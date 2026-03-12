import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { useAppBridge } from '@shopify/app-bridge-react';

const ThemeEditorContext = createContext(null);

// ── Undo/Redo history manager ─────────────────────────────────────
function useHistory(initialState) {
    const [history, setHistory] = useState([initialState]);
    const [cursor, setCursor] = useState(0);

    const current = history[cursor];

    const push = useCallback((newState) => {
        setHistory(prev => {
            const trimmed = prev.slice(0, cursor + 1);
            return [...trimmed, newState].slice(-50); // keep max 50 history items
        });
        setCursor(prev => Math.min(prev + 1, 49));
    }, [cursor]);

    const undo = useCallback(() => {
        if (cursor > 0) setCursor(c => c - 1);
    }, [cursor]);

    const redo = useCallback(() => {
        if (cursor < history.length - 1) setCursor(c => c + 1);
    }, [cursor, history.length]);

    const canUndo = cursor > 0;
    const canRedo = cursor < history.length - 1;

    return { current, push, undo, redo, canUndo, canRedo, setCurrent: push };
}

export function ThemeEditorProvider({ children }) {
    const { pageBlocks: initBlocks, categories, themeId, shop, themeName, templateFile: initTemplateFile } = useLoaderData();
    const fetcher = useFetcher();
    const shopify = useAppBridge();

    // ── History-aware blocks state ────────────────────────────────
    const {
        current: blocks,
        push: pushHistory,
        undo: undoBlocks,
        redo: redoBlocks,
        canUndo,
        canRedo,
    } = useHistory(initBlocks || []);

    // We also need a mutable setter for non-history updates (server sync)
    const [serverBlocks, setServerBlocks] = useState(null); // override when server returns
    const activeBlocks = serverBlocks !== null ? serverBlocks : blocks;

    const setBlocks = useCallback((updaterOrValue) => {
        const newVal = typeof updaterOrValue === 'function' ? updaterOrValue(activeBlocks) : updaterOrValue;
        pushHistory(newVal);
        setServerBlocks(null);
    }, [activeBlocks, pushHistory]);

    const [templateFile, setTemplateFile] = useState(initTemplateFile || 'templates/index.json');

    // ── UI State ──────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('sections');
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [selectedBlockType, setSelectedBlockType] = useState(null); // 'section' | 'block'
    const [previewTemplateId, setPreviewTemplateId] = useState(null);
    const [device, setDevice] = useState('desktop');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Insert/Swap targeting
    const [insertTargetId, setInsertTargetId] = useState(null);
    const [swapTargetId, setSwapTargetId] = useState(null);

    // ── Settings form state ───────────────────────────────────────
    const [settings, setSettings] = useState({});
    const [lastSavedAt, setLastSavedAt] = useState(null);

    // Debounce ref for auto-save
    const autoSaveTimerRef = useRef(null);

    // Direct preview reload callback – Canvas registers this so Context
    // can call it immediately when a save succeeds (no render-cycle race).
    const previewReloadRef = useRef(null);
    const registerPreviewReload = useCallback((fn) => { previewReloadRef.current = fn; }, []);

    // Helper: find active block from the merged list
    const activeBlock = activeBlocks.find(b => b.id === selectedBlockId);

    // ── Sync settings when block changes ─────────────────────────
    useEffect(() => {
        if (activeBlock) {
            setSettings(activeBlock.settings || {});
        } else {
            setSettings({});
        }
        setHasUnsavedChanges(false);
    }, [selectedBlockId]);

    // ── Sync server action results ────────────────────────────────
    // Track previous fetcher data to avoid double-firing
    const prevFetcherData = useRef(null);
    useEffect(() => {
        if (fetcher.state !== 'idle') return;
        if (!fetcher.data) return;
        // dedupe: only handle when data changes
        if (fetcher.data === prevFetcherData.current) return;
        prevFetcherData.current = fetcher.data;

        if (fetcher.data.ok) {
            if (fetcher.data.pageBlocks) setServerBlocks(fetcher.data.pageBlocks);
            if (fetcher.data.newBlockId) setSelectedBlockId(fetcher.data.newBlockId);
            setLastSavedAt(Date.now());
            setHasUnsavedChanges(false);
            shopify.toast.show(fetcher.data.message || 'Saved ✓');

            // 🔑 Fire Canvas reload IMMEDIATELY — no render cycle gap
            const intent = fetcher.data.intent;
            if (intent !== 'reorder' && previewReloadRef.current) {
                previewReloadRef.current({
                    blockId: fetcher.data.blockId,
                    sectionType: fetcher.data.sectionType,
                    isRemove: intent === 'remove_section',
                    isStructural: ['inject_section', 'insert_section', 'swap_section', 'apply_titan', 'reorder'].includes(intent),
                });
            }
        } else if (fetcher.data.error) {
            shopify.toast.show(fetcher.data.error, { isError: true });
        }
    }, [fetcher.state, fetcher.data]);

    // ── Keyboard shortcuts ────────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            const tag = document.activeElement?.tagName;
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);
            if (isInput) return;

            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undoBlocks();
            } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                redoBlocks();
            } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                if (selectedBlockId) saveSettings();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [undoBlocks, redoBlocks, selectedBlockId]);

    // ── Actions ───────────────────────────────────────────────────

    const updateSettings = useCallback((newValues) => {
        setSettings(prev => ({ ...prev, ...newValues }));
        setHasUnsavedChanges(true);

        // Debounce auto-save (2 second delay)
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
            saveSettingsRef.current?.();
        }, 2000);
    }, []);

    // Use a ref so the debounced fn always has access to latest state
    const saveSettingsRef = useRef(null);

    const saveSettings = useCallback(() => {
        if (!selectedBlockId) return;
        const currentSettings = settings;
        fetcher.submit(
            { intent: "update_settings", blockId: selectedBlockId, settings: JSON.stringify(currentSettings), templateFile },
            { method: "post" }
        );
        setHasUnsavedChanges(false);

        // Also optimistically update local blocks
        setServerBlocks(prev => {
            const base = prev || activeBlocks;
            return base.map(b => b.id === selectedBlockId ? { ...b, settings: currentSettings } : b);
        });
    }, [selectedBlockId, settings, templateFile, fetcher, activeBlocks]);

    // Keep ref in sync
    useEffect(() => { saveSettingsRef.current = saveSettings; }, [saveSettings]);

    const addSection = useCallback((sectionId) => {
        fetcher.submit(
            { intent: "inject_section", sectionId, placement: "bottom", trustedOrder: JSON.stringify(activeBlocks.map(b => b.id)), templateFile },
            { method: "post" }
        );
        setInsertTargetId(null);
        setActiveTab('sections');
    }, [activeBlocks, templateFile, fetcher]);

    const insertSection = useCallback((sectionId, afterBlockId) => {
        fetcher.submit(
            { intent: "insert_at", sectionId, afterBlockId: afterBlockId || '', settings: '{}', templateFile },
            { method: "post" }
        );
        setInsertTargetId(null);
        setActiveTab('sections');
    }, [templateFile, fetcher]);

    const swapSection = useCallback((targetBlockId, newSectionId) => {
        fetcher.submit(
            { intent: "swap_section", targetBlockId, newSectionId, templateFile },
            { method: "post" }
        );
        setSwapTargetId(null);
        setActiveTab('sections');
    }, [templateFile, fetcher]);

    const applyTitan = useCallback((titanId) => {
        fetcher.submit(
            { intent: "apply_titan", titanId, templateFile },
            { method: "post" }
        );
        setActiveTab('sections');
    }, [templateFile, fetcher]);

    const removeSection = useCallback((blockId) => {
        fetcher.submit(
            { intent: "remove_section", blockId, templateFile },
            { method: "post" }
        );
        if (selectedBlockId === blockId) setSelectedBlockId(null);

        // Optimistic update
        setServerBlocks(prev => (prev || activeBlocks).filter(b => b.id !== blockId));
    }, [selectedBlockId, templateFile, fetcher, activeBlocks]);

    const reorderSections = useCallback((newOrderArray) => {
        fetcher.submit(
            { intent: "reorder", order: JSON.stringify(newOrderArray), templateFile },
            { method: "post" }
        );
    }, [templateFile, fetcher]);

    // ── Section Visibility Toggle ─────────────────────────────────
    const toggleSectionVisibility = useCallback((blockId, hidden) => {
        fetcher.submit(
            { intent: "toggle_section_visibility", blockId, hidden: String(hidden), templateFile },
            { method: "post" }
        );
        // Optimistic update
        setServerBlocks(prev => (prev || activeBlocks).map(b =>
            b.id === blockId ? { ...b, disabled: hidden } : b
        ));
    }, [templateFile, fetcher, activeBlocks]);

    // ── Block CRUD ────────────────────────────────────────────────
    const addBlock = useCallback((sectionId, blockType, blockSettings = {}) => {
        fetcher.submit(
            { intent: "add_block", sectionId, blockType, settings: JSON.stringify(blockSettings), templateFile },
            { method: "post" }
        );
    }, [templateFile, fetcher]);

    const removeBlock = useCallback((sectionId, blockKey) => {
        fetcher.submit(
            { intent: "remove_block", sectionId, blockKey, templateFile },
            { method: "post" }
        );
    }, [templateFile, fetcher]);

    const reorderBlocks = useCallback((sectionId, blockOrder) => {
        fetcher.submit(
            { intent: "reorder_blocks", sectionId, blockOrder: JSON.stringify(blockOrder), templateFile },
            { method: "post" }
        );
    }, [templateFile, fetcher]);

    const saveBlockSettings = useCallback((sectionId, blockKey, blockSettings) => {
        fetcher.submit(
            { intent: "update_block_settings", sectionId, blockKey, settings: JSON.stringify(blockSettings), templateFile },
            { method: "post" }
        );
    }, [templateFile, fetcher]);

    // ── Undo/Redo ────────────────────────────────────────────────
    const handleUndo = useCallback(() => {
        undoBlocks();
        setServerBlocks(null);
    }, [undoBlocks]);

    const handleRedo = useCallback(() => {
        redoBlocks();
        setServerBlocks(null);
    }, [redoBlocks]);

    return (
        <ThemeEditorContext.Provider value={{
            blocks: activeBlocks,
            setBlocks,
            templateFile, setTemplateFile,
            activeTab, setActiveTab,
            selectedBlockId, setSelectedBlockId,
            selectedBlockType, setSelectedBlockType,
            previewTemplateId, setPreviewTemplateId,
            insertTargetId, setInsertTargetId,
            swapTargetId, setSwapTargetId,
            device, setDevice,
            settings, setSettings, updateSettings, saveSettings,
            hasUnsavedChanges,
            activeBlock,
            addSection, insertSection, swapSection, applyTitan,
            removeSection, reorderSections, toggleSectionVisibility,
            addBlock, removeBlock, reorderBlocks, saveBlockSettings,
            undo: handleUndo, redo: handleRedo, canUndo, canRedo,
            fetcher, categories, themeId, shop, themeName,
            lastSavedAt, registerPreviewReload,
        }}>
            {children}
        </ThemeEditorContext.Provider>
    );
}

export function useThemeEditor() {
    const context = useContext(ThemeEditorContext);
    if (!context) throw new Error('useThemeEditor must be used within ThemeEditorProvider');
    return context;
}
