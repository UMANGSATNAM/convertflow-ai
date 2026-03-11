import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { useAppBridge } from '@shopify/app-bridge-react';

const ThemeEditorContext = createContext(null);

export function ThemeEditorProvider({ children }) {
    const { pageBlocks: initBlocks, categories, themeId, shop } = useLoaderData();
    const fetcher = useFetcher();
    const shopify = useAppBridge();

    // Core State
    const [blocks, setBlocks] = useState(initBlocks || []);

    // UI State
    const [activeTab, setActiveTab] = useState('sections'); // 'sections' | 'add'
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [previewTemplateId, setPreviewTemplateId] = useState(null);
    const [device, setDevice] = useState('desktop');

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

    // Actions
    const updateSettings = useCallback((newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    const saveSettings = useCallback(() => {
        if (!selectedBlockId) return;
        fetcher.submit(
            { intent: "update_settings", blockId: selectedBlockId, settings: JSON.stringify(settings) },
            { method: "post" }
        );
    }, [selectedBlockId, settings, fetcher]);

    const addSection = useCallback((templateId) => {
        fetcher.submit(
            { intent: "inject_section", sectionId: templateId, placement: "bottom", trustedOrder: JSON.stringify(blocks.map(b => b.id)) },
            { method: "post" }
        );
    }, [blocks, fetcher]);

    const removeSection = useCallback((blockId) => {
        fetcher.submit(
            { intent: "remove_section", blockId },
            { method: "post" }
        );
        if (selectedBlockId === blockId) setSelectedBlockId(null);
    }, [selectedBlockId, fetcher]);

    const reorderSections = useCallback((newOrderArray) => {
        fetcher.submit(
            { intent: "reorder", order: JSON.stringify(newOrderArray) },
            { method: "post" }
        );
    }, [fetcher]);

    return (
        <ThemeEditorContext.Provider value={{
            blocks, setBlocks,
            activeTab, setActiveTab,
            selectedBlockId, setSelectedBlockId,
            previewTemplateId, setPreviewTemplateId,
            device, setDevice,
            settings, updateSettings, setSettings, saveSettings,
            activeBlock,
            addSection, removeSection, reorderSections,
            fetcher, categories, themeId, shop
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
