import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { useAppBridge } from '@shopify/app-bridge-react';

const ThemeEditorContext = createContext(null);

export function ThemeEditorProvider({ children }) {
    const { pageBlocks: initBlocks, categories, themeId, shop, themeName, templateFile: initTemplateFile } = useLoaderData();
    const fetcher = useFetcher();
    const shopify = useAppBridge();

    // Core State
    const [blocks, setBlocks] = useState(initBlocks || []);
    const [templateFile, setTemplateFile] = useState(initTemplateFile || 'templates/index.json');

    // UI State
    const [activeTab, setActiveTab] = useState('sections'); // 'sections' | 'add' | 'titan'
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [previewTemplateId, setPreviewTemplateId] = useState(null);
    const [device, setDevice] = useState('desktop');

    // Insert-at targeting: which block to insert AFTER
    const [insertTargetId, setInsertTargetId] = useState(null);

    // Swap targeting: which block to swap out
    const [swapTargetId, setSwapTargetId] = useState(null);

    // Form State for Active Block
    const [settings, setSettings] = useState({});

    // Helper mapping
    const activeBlock = blocks.find(b => b.id === selectedBlockId);

    // Sync state with server action results
    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data?.ok) {
            if (fetcher.data.pageBlocks) {
                setBlocks(fetcher.data.pageBlocks);
            }
            if (fetcher.data.newBlockId) {
                setSelectedBlockId(fetcher.data.newBlockId);
            }
            shopify.toast.show(fetcher.data.message || 'Theme updated');
        } else if (fetcher.state === 'idle' && fetcher.data?.error) {
            shopify.toast.show(fetcher.data.error, { isError: true });
        }
    }, [fetcher.state, fetcher.data]);

    // ── Actions ────────────────────────────────────────────────

    const updateSettings = useCallback((newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    const saveSettings = useCallback(() => {
        if (!selectedBlockId) return;
        fetcher.submit(
            { intent: "update_settings", blockId: selectedBlockId, settings: JSON.stringify(settings), templateFile },
            { method: "post" }
        );
    }, [selectedBlockId, settings, templateFile, fetcher]);

    /** Original add — appends to bottom */
    const addSection = useCallback((templateId) => {
        fetcher.submit(
            { intent: "inject_section", sectionId: templateId, placement: "bottom", trustedOrder: JSON.stringify(blocks.map(b => b.id)), templateFile },
            { method: "post" }
        );
        setInsertTargetId(null);
    }, [blocks, templateFile, fetcher]);

    /** NEW: Insert a section AFTER a specific block */
    const insertSection = useCallback((sectionId, afterBlockId) => {
        fetcher.submit(
            { intent: "insert_at", sectionId, afterBlockId: afterBlockId || '', settings: '{}', templateFile },
            { method: "post" }
        );
        setInsertTargetId(null);
        setActiveTab('sections');
    }, [templateFile, fetcher]);

    /** NEW: Swap a section in-place */
    const swapSection = useCallback((targetBlockId, newSectionId) => {
        fetcher.submit(
            { intent: "swap_section", targetBlockId, newSectionId, templateFile },
            { method: "post" }
        );
        setSwapTargetId(null);
        setActiveTab('sections');
    }, [templateFile, fetcher]);

    /** NEW: Apply a full Titan template */
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
    }, [selectedBlockId, templateFile, fetcher]);

    const reorderSections = useCallback((newOrderArray) => {
        fetcher.submit(
            { intent: "reorder", order: JSON.stringify(newOrderArray), templateFile },
            { method: "post" }
        );
    }, [templateFile, fetcher]);

    return (
        <ThemeEditorContext.Provider value={{
            blocks, setBlocks,
            templateFile, setTemplateFile,
            activeTab, setActiveTab,
            selectedBlockId, setSelectedBlockId,
            previewTemplateId, setPreviewTemplateId,
            insertTargetId, setInsertTargetId,
            swapTargetId, setSwapTargetId,
            device, setDevice,
            settings, updateSettings, setSettings, saveSettings,
            activeBlock,
            addSection, insertSection, swapSection, applyTitan,
            removeSection, reorderSections,
            fetcher, categories, themeId, shop, themeName
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
