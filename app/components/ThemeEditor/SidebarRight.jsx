import React, { useEffect, useState } from 'react';
import { useThemeEditor } from './ThemeEditorContext';
import { SettingRenderer } from './SettingRenderer';

export function SidebarRight() {
    const {
        activeBlock, selectedBlockId, setSelectedBlockId,
        settings, updateSettings, saveSettings, removeSection,
    } = useThemeEditor();

    const [schema, setSchema] = useState({ settings: [], name: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!activeBlock) { setSchema({ settings: [], name: '' }); return; }
        setLoading(true);
        fetch(`/app/api/section-schema?id=${activeBlock.type}`)
            .then(r => r.json())
            .then(data => setSchema({ settings: data.settings || [], name: data.name || activeBlock.type }))
            .catch(console.error)
            .finally(() => setLoading(false));
        // Initialize settings from block
        // (done via context when block is selected)
    }, [activeBlock?.id, activeBlock?.type]);

    // ── Empty state ────────────────────────────────────────────────
    if (!activeBlock) {
        return (
            <aside style={{ width: 300, minWidth: 300, height: '100%', background: '#fff', borderLeft: '1px solid #ebebeb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', flexShrink: 0 }}>
                <div style={{ width: 48, height: 48, background: '#f1f2f4', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="#6d7175"><path d="M10 1a9 9 0 100 18A9 9 0 0010 1zm0 2a7 7 0 110 14A7 7 0 0110 3zm-.006 11.01a1.006 1.006 0 100-2.013 1.006 1.006 0 000 2.012zM9 9.25v-1.5a1 1 0 012 0v1.75c0 .689-.374 1.298-1 1.625v.375a1 1 0 01-2 0V10.5C8.437 10.223 9 9.775 9 9.25z" /></svg>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#202223', margin: '0 0 6px' }}>No element selected</p>
                <p style={{ fontSize: 12, color: '#6d7175', margin: 0, lineHeight: 1.5 }}>Click a section in the outline or on the preview canvas to edit it.</p>
            </aside>
        );
    }

    const formatName = (type) => (type || '')
        .replace(/^cf[-_]/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

    return (
        <aside style={{ width: 300, minWidth: 300, height: '100%', background: '#fff', borderLeft: '1px solid #ebebeb', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #ebebeb', display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                    onClick={() => setSelectedBlockId(null)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4, color: '#6d7175', flexShrink: 0 }}
                    onMouseOver={e => e.currentTarget.style.background = '#f1f2f4'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.56l3.22 3.22a.75.75 0 11-1.06 1.06l-4.5-4.5a.75.75 0 010-1.06l4.5-4.5a.75.75 0 011.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" /></svg>
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#202223', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {schema.name || formatName(activeBlock.type)}
                    </h2>
                </div>
                <button
                    onClick={() => setSelectedBlockId(null)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4, color: '#6d7175', flexShrink: 0 }}
                    onMouseOver={e => e.currentTarget.style.background = '#f1f2f4'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                </button>
            </div>

            {/* Settings area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32, gap: 8 }}>
                        <div style={{ width: 28, height: 28, border: '2px solid #ebebeb', borderTopColor: '#005bd3', borderRadius: '50%', animation: 'shopify-spin 0.7s linear infinite' }} />
                        <span style={{ fontSize: 12, color: '#6d7175' }}>Loading settings...</span>
                    </div>
                ) : schema.settings.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', textAlign: 'center', gap: 8 }}>
                        <svg width="24" height="24" viewBox="0 0 20 20" fill="#8c9196"><path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.312 1.562c.515.193 1.002.456 1.45.777l1.518-.493a1 1 0 011.154.434l1.18 2.043a1 1 0 01-.212 1.263l-1.16 1.001c.046.321.07.648.07.979s-.024.657-.07.979l1.16 1a1 1 0 01.212 1.264l-1.18 2.043a1 1 0 01-1.154.434l-1.518-.493c-.448.321-.935.584-1.45.777l-.312 1.562a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.311-1.562a6.956 6.956 0 01-1.45-.777l-1.519.493a1 1 0 01-1.153-.434l-1.18-2.043a1 1 0 01.212-1.263l1.16-1.001A6.921 6.921 0 013.5 10c0-.332.024-.658.07-.979L2.41 8.02a1 1 0 01-.212-1.263L3.378 4.714a1 1 0 011.153-.434l1.519.493a6.956 6.956 0 011.45-.777l.311-1.562zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                        <p style={{ margin: 0, fontSize: 12, color: '#6d7175' }}>This section has no editable settings.</p>
                    </div>
                ) : (
                    <div>
                        {schema.settings.map(s => (
                            <SettingRenderer
                                key={s.id}
                                setting={s}
                                value={settings[s.id]}
                                onChange={(key, value) => updateSettings({ [key]: value })}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid #ebebeb', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                    onClick={saveSettings}
                    style={{ width: '100%', height: 34, background: '#303030', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    onMouseOver={e => e.currentTarget.style.background = '#000'}
                    onMouseOut={e => e.currentTarget.style.background = '#303030'}
                >
                    Save
                </button>
                {activeBlock.isCf && (
                    <button
                        onClick={() => removeSection(selectedBlockId)}
                        style={{ width: '100%', height: 34, background: '#fff', color: '#d72c0d', border: '1px solid #ffd2cc', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                        onMouseOver={e => { e.currentTarget.style.background = '#fff4f4'; }}
                        onMouseOut={e => { e.currentTarget.style.background = '#fff'; }}
                    >
                        Remove section
                    </button>
                )}
            </div>

            <style>{`@keyframes shopify-spin { to { transform: rotate(360deg); } }`}</style>
        </aside>
    );
}
