import React, { useEffect, useState } from 'react';
import { Text } from '@shopify/polaris';
import { useThemeEditor } from './ThemeEditorContext';
import { SettingRenderer } from './SettingRenderer';

export function SidebarRight() {
    const {
        activeBlock,
        selectedBlockId,
        setSelectedBlockId,
        settings,
        setSettings,
        updateSettings,
        saveSettings,
        removeSection,
    } = useThemeEditor();

    const [schema, setSchema] = useState({ settings: [], name: '' });
    const [loading, setLoading] = useState(false);

    // Fetch Schema when a block is selected
    useEffect(() => {
        if (!activeBlock) {
            setSchema({ settings: [], name: '' });
            return;
        }

        setLoading(true);
        fetch(`/app/api/section-schema?id=${activeBlock.type}`)
            .then(res => res.json())
            .then(data => {
                setSchema({
                    settings: data.settings || [],
                    name: data.name || activeBlock.type
                });
            })
            .catch(console.error)
            .finally(() => setLoading(false));

        // Initialize settings from the block's existing settings
        setSettings(activeBlock.settings || {});
    }, [activeBlock?.id, activeBlock?.type]);

    // Handle setting change — updates both local state and context
    const handleSettingChange = (key, value) => {
        updateSettings({ [key]: value });
    };

    if (!activeBlock) {
        return (
            <aside className="w-80 h-full bg-white border-l border-polaris-border flex flex-col justify-center items-center p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-polaris-subdued mb-2">touch_app</span>
                <p className="text-sm text-polaris-subdued">Select a section from the sidebar or click one in the preview to edit its settings.</p>
            </aside>
        );
    }

    return (
        <aside className="w-80 h-full bg-white border-l border-polaris-border flex flex-col">

            {/* Header */}
            <div className="p-4 border-b border-polaris-border">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-base font-semibold text-polaris-text">{schema.name}</h2>
                    <button className="text-polaris-subdued hover:text-polaris-text" onClick={() => setSelectedBlockId(null)}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <p className="text-xs text-polaris-subdued">Edit section settings. Changes preview in real-time.</p>
            </div>

            {/* Settings Scroll Area */}
            <div className="flex-1 overflow-y-auto sidebar-scroll p-4 space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center py-8">
                        <span className="material-symbols-outlined text-3xl text-polaris-subdued animate-spin">progress_activity</span>
                        <p className="text-sm text-polaris-subdued mt-2">Loading settings...</p>
                    </div>
                ) : schema.settings.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                        <span className="material-symbols-outlined text-3xl text-polaris-subdued mb-2">tune</span>
                        <p className="text-sm text-polaris-subdued">This section has no editable settings.</p>
                        <p className="text-xs text-polaris-subdued mt-1">It may be a native Dawn theme section.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {schema.settings.map(s => (
                            <SettingRenderer
                                key={s.id}
                                setting={s}
                                value={settings[s.id]}
                                onChange={handleSettingChange}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-polaris-border bg-white space-y-2">
                <button
                    onClick={saveSettings}
                    className="w-full bg-primary text-black py-2 text-sm font-semibold hover:opacity-90 rounded-lg transition-opacity"
                >
                    Save changes
                </button>
                {activeBlock.isCf && (
                    <button 
                        onClick={() => removeSection(selectedBlockId)}
                        className="w-full text-red-600 border border-polaris-border py-2 text-sm font-semibold hover:bg-red-50 rounded-lg transition-colors"
                    >
                        Remove section
                    </button>
                )}
            </div>

        </aside>
    );
}
