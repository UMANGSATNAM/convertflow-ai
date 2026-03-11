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
            <aside style={{ width: 300, background: '#fff', borderLeft: '1px solid var(--p-color-border)' }}>
                {/* Render Empty State (Select an element to edit) */}
            </aside>
        );
    }

    return (
        <aside style={{ width: 300, background: '#fff', borderLeft: '1px solid var(--p-color-border)', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--p-color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Button variant="plain" icon={XIcon} onClick={() => setSelectedBlockId(null)} />
                    <Text variant="headingMd" as="h3">{schema.name}</Text>
                </div>
                <Button size="micro" variant="primary" onClick={saveSettings} loading={fetcher.state !== 'idle'}>Save</Button>
            </div>

            {/* Settings Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {loading ? (
                    <Text color="subdued">Loading parameters...</Text>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {schema.settings.map(s => (
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

        </aside>
    );
}
