import React, { useEffect, useState } from 'react';
import { useThemeEditor } from './ThemeEditorContext';
import { SettingRenderer } from './SettingRenderer';

export function SidebarRight() {
    const {
        activeBlock, selectedBlockId, setSelectedBlockId,
        settings, updateSettings, saveSettings, removeSection, hasUnsavedChanges,
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
    }, [activeBlock?.id, activeBlock?.type]);

    const formatName = (type) => (type || '')
        .replace(/^cf[-_]/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    // ── Empty state ────────────────────────────────────────────────
    if (!activeBlock) {
        return (
            <aside style={{ width: 300, minWidth: 300, height: '100%', background: '#fff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center', flexShrink: 0 }}>
                {/* Illustration */}
                <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
                        <path d="M6 6h.01M3 12h.01M12 3v.01M9 3h.01"/>
                    </svg>
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Select a section</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>Click any section in the outline on the left, or click directly on the preview to start editing.</p>

                <div style={{ marginTop: 24, padding: '14px 16px', background: '#f9fafb', borderRadius: 12, width: '100%', textAlign: 'left' }}>
                    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Keyboard shortcuts</p>
                    {[
                        ['Ctrl + Z', 'Undo'],
                        ['Ctrl + Y', 'Redo'],
                        ['Ctrl + S', 'Save'],
                    ].map(([key, label]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
                            <kbd style={{ fontSize: 10, fontFamily: 'monospace', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '2px 6px', color: '#374151', fontWeight: 600 }}>{key}</kbd>
                        </div>
                    ))}
                </div>
            </aside>
        );
    }

    const sectionName = schema.name || formatName(activeBlock.type);

    return (
        <aside style={{ width: 300, minWidth: 300, height: '100%', background: '#fff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                        onClick={() => setSelectedBlockId(null)}
                        style={{ width: 30, height: 30, border: '1.5px solid #e5e7eb', background: '#fff', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', flexShrink: 0, transition: 'all 0.15s' }}
                        onMouseOver={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                        onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                        title="Back"
                    >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.56l3.22 3.22a.75.75 0 11-1.06 1.06l-4.5-4.5a.75.75 0 010-1.06l4.5-4.5a.75.75 0 011.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd"/></svg>
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sectionName}</h2>
                            {activeBlock.isCf && (
                                <span style={{ fontSize: 9, background: '#eef2ff', color: '#4f46e5', padding: '2px 6px', borderRadius: 4, fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0 }}>CF</span>
                            )}
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', marginTop: 1 }}>Edit section settings</p>
                    </div>

                    {hasUnsavedChanges && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308', flexShrink: 0, boxShadow: '0 0 0 3px rgba(234,179,8,0.2)' }} title="Unsaved changes" />
                    )}
                </div>
            </div>

            {/* Settings scroll area */}
            <div style={{ flex: 1, overflowY: 'auto', paddingTop: 6 }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, gap: 12 }}>
                        <div style={{ width: 32, height: 32, border: '2.5px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'cf-spin 0.7s linear infinite' }} />
                        <span style={{ fontSize: 13, color: '#9ca3af' }}>Loading settings…</span>
                    </div>
                ) : schema.settings.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', textAlign: 'center', gap: 10 }}>
                        <div style={{ width: 48, height: 48, background: '#f3f4f6', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
                                <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                            </svg>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>No editable settings</p>
                        <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>This is a native theme section. Open Shopify's editor to customize it.</p>
                    </div>
                ) : (
                    schema.settings.map(s => (
                        <SettingRenderer
                            key={s.id}
                            setting={s}
                            value={settings[s.id]}
                            onChange={(key, val) => updateSettings({ [key]: val })}
                        />
                    ))
                )}
            </div>

            {/* Footer actions */}
            <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                    onClick={saveSettings}
                    style={{
                        width: '100%', height: 44, border: 'none', borderRadius: 11, cursor: 'pointer',
                        background: hasUnsavedChanges
                            ? 'linear-gradient(135deg, #059669, #10b981)'
                            : 'linear-gradient(135deg, #1f2937, #374151)',
                        color: '#fff', fontSize: 14, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'all 0.2s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.2)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'; }}
                >
                    {hasUnsavedChanges ? '💾 Save Changes' : '✓ Save'}
                </button>
                {activeBlock.isCf && (
                    <button
                        onClick={() => {
                            if (window.confirm('Remove this section from the page?')) removeSection(selectedBlockId);
                        }}
                        style={{ width: '100%', height: 38, background: '#fff', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseOver={e => { e.currentTarget.style.background = '#fef2f2'; }}
                        onMouseOut={e => { e.currentTarget.style.background = '#fff'; }}
                    >
                        🗑 Remove section
                    </button>
                )}
            </div>
        </aside>
    );
}
