import React, { useEffect, useState, useRef, useCallback } from 'react';
import useEditorStore, { selectSettings, selectSelectedBlockId, selectHasUnsavedChanges } from './useEditorStore';
import { SettingRenderer } from './SettingRenderer';

// ── Mini hook: load schema for a section type ────────────────────
function useSectionSchema(sectionType) {
    const [schema, setSchema] = useState({ settings: [], blocks: [], name: '', max_blocks: 16 });
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (!sectionType) { setSchema({ settings: [], blocks: [], name: '', max_blocks: 16 }); return; }
        setLoading(true);
        fetch(`/app/api/section-schema?id=${encodeURIComponent(sectionType)}`)
            .then(r => r.json())
            .then(data => setSchema({ settings: data.settings || [], blocks: data.blocks || [], name: data.name || titleCase(sectionType), max_blocks: data.max_blocks || 16 }))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [sectionType]);
    return { schema, loading };
}

function titleCase(str) {
    return (str || '').replace(/^cf[-_]/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Color token ─────────────────────────────────────────────────
const P = {
    border: '#f3f4f6',
    labelColor: '#9ca3af',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    indigo: '#4f46e5',
    indigoBg: '#eef2ff',
    red: '#dc2626',
    redBg: '#fee2e2',
    greenBg: 'linear-gradient(135deg,#059669,#10b981)',
    darkBg: 'linear-gradient(135deg,#1f2937,#374151)',
};

// ── Block row within a section ────────────────────────────────────
function BlockRow({ block, sectionId, blockSchema, onEditBlock, active }) {
    const [hovered, setHovered] = useState(false);
    const removeBlock = useEditorStore(s => s.removeBlock);
    const name = blockSchema?.name || titleCase(block.type);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onEditBlock}
            style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
                borderRadius: 8, cursor: 'pointer', userSelect: 'none',
                background: active ? P.indigoBg : hovered ? '#f9fafb' : 'transparent',
                border: active ? `1.5px solid ${P.indigo}` : '1.5px solid transparent',
                transition: 'all 0.15s',
            }}
        >
            {/* Block type icon */}
            <div style={{ width: 22, height: 22, background: active ? P.indigoBg : '#f3f4f6', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 20 20" fill={active ? P.indigo : '#9ca3af'}>
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                </svg>
            </div>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: active ? P.indigo : P.textPrimary }}>{name}</span>
            {hovered && (
                <button
                    onClick={e => { e.stopPropagation(); if (window.confirm(`Remove this ${name} block?`)) removeBlock(sectionId, block.key); }}
                    style={{ width: 24, height: 24, border: 'none', background: 'none', borderRadius: 5, cursor: 'pointer', color: '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseOver={e => { e.currentTarget.style.background = P.redBg; e.currentTarget.style.color = P.red; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#d1d5db'; }}
                >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd"/></svg>
                </button>
            )}
        </div>
    );
}

// ── Main SidebarRight ─────────────────────────────────────────────
export function SidebarRight() {
    // 🔑 Zustand selectors — only re-render when these specific slices change
    const selectedBlockId  = useEditorStore(selectSelectedBlockId);
    const settings         = useEditorStore(selectSettings);
    const hasUnsavedChanges = useEditorStore(selectHasUnsavedChanges);
    const fetcherState     = useEditorStore(s => s._fetcherState);
    const templateFile     = useEditorStore(s => s.templateFile);

    // Actions (stable references, no re-render)
    const setSelectedBlockId      = useEditorStore(s => s.setSelectedBlockId);
    const updateSettings          = useEditorStore(s => s.updateSettings);
    const saveSettings            = useEditorStore(s => s.saveSettings);
    const removeSection           = useEditorStore(s => s.removeSection);
    const toggleSectionVisibility = useEditorStore(s => s.toggleSectionVisibility);
    const addBlock                = useEditorStore(s => s.addBlock);
    const saveBlockSettings       = useEditorStore(s => s.saveBlockSettings);

    // Compute activeBlock from the store
    const activeBlock = useEditorStore(s => {
        const blocks = s._serverBlocks ?? s.blocks;
        return blocks.find(b => b.id === s.selectedBlockId) || null;
    });

    const { schema, loading } = useSectionSchema(activeBlock?.type);

    // Block-level editing state
    const [editingBlock, setEditingBlock] = useState(null); // { key, type, settings }
    const [blockSettings, setBlockSettings] = useState({});
    const blockSchemaMap = Object.fromEntries((schema.blocks || []).map(b => [b.type, b]));

    // When section changes, reset block editing
    useEffect(() => { setEditingBlock(null); setBlockSettings({}); }, [selectedBlockId]);

    // When we select a block to edit, load its settings
    const handleEditBlock = (b) => {
        setEditingBlock(b);
        setBlockSettings(b.settings || {});
    };

    // Save block settings
    const handleSaveBlock = () => {
        if (!editingBlock || !activeBlock) return;
        saveBlockSettings(activeBlock.id, editingBlock.key, blockSettings);
        setEditingBlock(null); // go back to section view
        // Toast via Zustand's injected shopify ref
        const shopifyRef = useEditorStore.getState()._shopify;
        shopifyRef?.toast?.show?.('Block saved');
    };

    // ── Empty state ───────────────────────────────────────────────
    if (!activeBlock) {
        return (
            <aside style={asideStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '32px 24px', textAlign: 'center' }}>
                    <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={P.indigo} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/><circle cx="5" cy="5" r="1"/><circle cx="3" cy="11" r="1"/><circle cx="11" cy="3" r="1"/>
                        </svg>
                    </div>
                    <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: P.textPrimary }}>Select a section</h3>
                    <p style={{ margin: '0 0 24px', fontSize: 13, color: P.textSecondary, lineHeight: 1.6 }}>
                        Click any section in the outline or click directly on the preview to start editing.
                    </p>
                    <div style={{ width: '100%', padding: '14px 16px', background: '#f9fafb', borderRadius: 12, textAlign: 'left' }}>
                        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: P.labelColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shortcuts</p>
                        {[['Ctrl+Z', 'Undo'], ['Ctrl+Y', 'Redo'], ['Ctrl+S', 'Save']].map(([k, l]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                                <span style={{ fontSize: 12, color: P.textSecondary }}>{l}</span>
                                <kbd style={{ fontSize: 10, fontFamily: 'monospace', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '2px 6px', color: '#374151', fontWeight: 600 }}>{k}</kbd>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
        );
    }

    // ── Block editing view ────────────────────────────────────────
    if (editingBlock) {
        const blockSch = blockSchemaMap[editingBlock.type] || {};
        return (
            <aside style={asideStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <button onClick={() => setEditingBlock(null)} style={backBtnStyle} title="Back to section">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.56l3.22 3.22a.75.75 0 11-1.06 1.06l-4.5-4.5a.75.75 0 010-1.06l4.5-4.5a.75.75 0 011.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd"/></svg>
                    </button>
                    <div style={{ flex: 1 }}>
                        <h2 style={h2Style}>{blockSch.name || titleCase(editingBlock.type)}</h2>
                        <p style={subStyle}>Block settings</p>
                    </div>
                </div>

                {/* Block settings */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {(blockSch.settings || []).length === 0 ? (
                        <div style={{ padding: '40px 24px', textAlign: 'center', color: P.textSecondary, fontSize: 13 }}>No settings for this block type.</div>
                    ) : (
                        (blockSch.settings || []).map(s => (
                            <SettingRenderer
                                key={s.id}
                                setting={s}
                                value={blockSettings[s.id]}
                                onChange={(key, val) => setBlockSettings(prev => ({ ...prev, [key]: val }))}
                            />
                        ))
                    )}
                </div>

                {/* Footer */}
                <div style={footerStyle}>
                    <SaveBtn onClick={handleSaveBlock} hasChanges label="Save block" />
                </div>
            </aside>
        );
    }

    // ── Section settings view ─────────────────────────────────────
    const sectionName = schema.name || titleCase(activeBlock.type);
    const sectionBlocks = activeBlock.blocks || {};
    const blockOrder = activeBlock.block_order || Object.keys(sectionBlocks);
    const hasBlocks = blockOrder.length > 0;
    const canAddMoreBlocks = blockOrder.length < (schema.max_blocks || 16);

    return (
        <aside style={asideStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <button onClick={() => setSelectedBlockId(null)} style={backBtnStyle} title="Deselect">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.56l3.22 3.22a.75.75 0 11-1.06 1.06l-4.5-4.5a.75.75 0 010-1.06l4.5-4.5a.75.75 0 011.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd"/></svg>
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <h2 style={h2Style}>{sectionName}</h2>
                        {activeBlock.isCf && <span style={cfBadge}>CF</span>}
                        {activeBlock.disabled && <span style={{ fontSize: 9, background: '#fef9c3', color: '#ca8a04', padding: '2px 5px', borderRadius: 4, fontWeight: 700 }}>HIDDEN</span>}
                    </div>
                    <p style={subStyle}>Section settings</p>
                </div>
                {/* Visibility eye toggle */}
                <button
                    onClick={() => toggleSectionVisibility(activeBlock.id, !activeBlock.disabled)}
                    title={activeBlock.disabled ? 'Show section' : 'Hide section'}
                    style={{ width: 30, height: 30, border: '1.5px solid #e5e7eb', borderRadius: 8, background: activeBlock.disabled ? '#fef9c3' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeBlock.disabled ? '#ca8a04' : '#9ca3af', flexShrink: 0 }}
                >
                    {activeBlock.disabled ? (
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd"/><path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z"/></svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd"/></svg>
                    )}
                </button>
                {hasUnsavedChanges && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308', flexShrink: 0 }} />}
            </div>

            {/* Settings + Blocks */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, gap: 12 }}>
                        <div style={{ width: 28, height: 28, border: '2.5px solid #e5e7eb', borderTopColor: P.indigo, borderRadius: '50%', animation: 'cf-spin 0.7s linear infinite' }} />
                        <span style={{ fontSize: 13, color: P.textSecondary }}>Loading settings…</span>
                    </div>
                ) : (
                    <>
                        {/* ── Section Settings ── */}
                        {schema.settings.length > 0 && (
                            <div>
                                {schema.settings.map(s => (
                                    <SettingRenderer
                                        key={s.id}
                                        setting={s}
                                        value={settings[s.id]}
                                        onChange={(key, val) => updateSettings({ [key]: val })}
                                    />
                                ))}
                            </div>
                        )}

                        {/* ── Blocks (sub-items) ── */}
                        {schema.blocks?.length > 0 && (
                            <div style={{ borderTop: schema.settings.length > 0 ? `1px solid ${P.border}` : 'none', marginTop: schema.settings.length > 0 ? 8 : 0 }}>
                                {/* Blocks header */}
                                <div style={{ padding: '12px 16px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: P.labelColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Blocks {hasBlocks ? `(${blockOrder.length})` : ''}
                                    </span>
                                    {canAddMoreBlocks && (
                                        <div style={{ position: 'relative' }}>
                                            <AddBlockDropdown
                                                blockTypes={schema.blocks}
                                                onAdd={(type) => addBlock(activeBlock.id, type)}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Block list */}
                                <div style={{ padding: '0 10px 8px' }}>
                                    {blockOrder.length === 0 ? (
                                        <div style={{ padding: '14px 12px', textAlign: 'center', color: P.textSecondary, fontSize: 12, border: '1.5px dashed #e5e7eb', borderRadius: 8 }}>
                                            No blocks yet. Click "+ Add block" to start.
                                        </div>
                                    ) : blockOrder.map(key => {
                                        const b = sectionBlocks[key];
                                        if (!b) return null;
                                        return (
                                            <BlockRow
                                                key={key}
                                                block={{ ...b, key }}
                                                sectionId={activeBlock.id}
                                                blockSchema={blockSchemaMap[b.type]}
                                                active={editingBlock?.key === key}
                                                onEditBlock={() => handleEditBlock({ ...b, key })}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* No settings at all */}
                        {schema.settings.length === 0 && schema.blocks?.length === 0 && (
                            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                                <div style={{ width: 48, height: 48, background: '#f3f4f6', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round">
                                        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                                    </svg>
                                </div>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>No editable settings</p>
                                <p style={{ margin: '6px 0 0', fontSize: 12, color: P.textSecondary, lineHeight: 1.5 }}>This is a native theme section.<br/>Open Shopify to customize it.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <div style={footerStyle}>
                <SaveBtn onClick={saveSettings} hasChanges={hasUnsavedChanges} label={hasUnsavedChanges ? '💾 Save Changes' : '✓ Save'} />
                {activeBlock.isCf && (
                    <button
                        onClick={() => { if (window.confirm('Remove this section from the page?')) removeSection(selectedBlockId); }}
                        style={{ width: '100%', height: 38, background: '#fff', color: P.red, border: `1.5px solid #fecaca`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', marginTop: 2 }}
                        onMouseOver={e => e.currentTarget.style.background = '#fef2f2'}
                        onMouseOut={e => e.currentTarget.style.background = '#fff'}
                    >🗑 Remove section</button>
                )}
            </div>
        </aside>
    );
}

// ── Add Block dropdown ────────────────────────────────────────────
function AddBlockDropdown({ blockTypes, onAdd }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#4f46e5', background: '#eef2ff', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}
            >
                <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/></svg>
                Add block
            </button>
            {open && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: 190, zIndex: 100, overflow: 'hidden', animation: 'cf-fade-in 0.15s ease' }}>
                    {blockTypes.map(bt => (
                        <button
                            key={bt.type}
                            onClick={() => { onAdd(bt.type); setOpen(false); }}
                            style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: '#1f2937', fontWeight: 500, transition: 'background 0.1s', display: 'flex', alignItems: 'center', gap: 8 }}
                            onMouseOver={e => e.currentTarget.style.background = '#f9fafb'}
                            onMouseOut={e => e.currentTarget.style.background = 'none'}
                        >
                            <div style={{ width: 22, height: 22, background: '#f3f4f6', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="11" height="11" viewBox="0 0 20 20" fill="#9ca3af"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                            </div>
                            {bt.name || titleCase(bt.type)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Reusable Save button ─────────────────────────────────────────
function SaveBtn({ onClick, hasChanges, label = 'Save' }) {
    return (
        <button
            onClick={onClick}
            style={{
                width: '100%', height: 44, border: 'none', borderRadius: 11, cursor: 'pointer',
                background: hasChanges ? P.greenBg : P.darkBg,
                color: '#fff', fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.2)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'; }}
        >{label}</button>
    );
}

// ── Shared style objects ──────────────────────────────────────────
const asideStyle = { width: 300, minWidth: 300, height: '100%', background: '#fff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' };
const headerStyle = { padding: '14px 12px 12px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 };
const h2Style = { margin: 0, fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const subStyle = { margin: '2px 0 0', fontSize: 11, color: '#9ca3af' };
const backBtnStyle = { width: 30, height: 30, border: '1.5px solid #e5e7eb', background: '#fff', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', flexShrink: 0, transition: 'all 0.15s' };
const cfBadge = { fontSize: 9, background: '#eef2ff', color: '#4f46e5', padding: '2px 6px', borderRadius: 4, fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0 };
const footerStyle = { padding: '12px 14px 14px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 6 };
