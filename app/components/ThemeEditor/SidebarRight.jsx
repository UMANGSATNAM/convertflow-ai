import React, { useEffect, useState, useMemo } from 'react';
import { Button, Icon, Text } from '@shopify/polaris';
import { XIcon } from '@shopify/polaris-icons';
import { useThemeEditor } from './ThemeEditorContext';
import { SettingRenderer } from './SettingRenderer';

/**
 * SidebarRight - The Settings Panel
 * Uses React.memo for the individual settings list to prevent 
 * re-rendering the entire sidebar on every single keystroke.
 */
export function SidebarRight() {
    const {
        activeBlock,
        selectedBlockId,
        setSelectedBlockId,
        settings,
        updateSettings,
        saveSettings,
        removeSection,
        fetcher
    } = useThemeEditor();

    const [schema, setSchema] = useState({ settings: [], name: '' });
    const [loading, setLoading] = useState(false);

    // Fetch Schema when a block is selected
    useEffect(() => {
        if (!activeBlock) return;

        setLoading(true);
        fetch(`/app/api/section-schema?id=${activeBlock.type}`)
            .then(res => res.json())
            .then(data => {
                if (data.settings) {
                    setSchema({ settings: data.settings, name: data.name || activeBlock.type });
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [activeBlock?.type]);

    if (!activeBlock) {
        return (
            <aside className="w-80 h-full bg-white border-l border-polaris-border flex flex-col justify-center items-center p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-polaris-subdued mb-2">touch_app</span>
                <Text variant="bodyMd" tone="subdued">Select a section or block from the preview to edit its settings.</Text>
            </aside>
        );
    }

    return (
        <aside className="w-80 h-full bg-white border-l border-polaris-border flex flex-col">

            {/* Header */}
            <div className="p-4 border-b border-polaris-border">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-semibold text-polaris-text">{schema.name}</h2>
                    <button className="text-polaris-subdued hover:text-polaris-text" onClick={() => setSelectedBlockId(null)}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <p className="text-xs text-polaris-subdued">Edit the configuration of this element natively.</p>
            </div>

            {/* Settings Scroll Area */}
            <div className="flex-1 overflow-y-auto sidebar-scroll p-4 space-y-6">
                {loading ? (
                    <Text color="subdued">Loading parameters...</Text>
                ) : (
                    <div className="space-y-6">
                        {(schema.settings || []).map(s => (
                            <SettingRenderer
                                key={s.id}
                                setting={s}
                                value={settings[s.id]}
                                onChange={updateSettings}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer / Remove Button */}
            <div className="p-4 border-t border-polaris-border bg-white">
                <button 
                    onClick={() => removeSection(selectedBlockId)}
                    className="w-full text-red-600 border border-polaris-border py-2 text-sm font-semibold hover:bg-red-50 rounded-lg transition-colors"
                >
                    Remove section
                </button>
            </div>

        </aside>
    );
}
