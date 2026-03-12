import React, { useMemo, useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useThemeEditor } from './ThemeEditorContext';
import { TemplatePicker } from './TemplatePicker';

// ── Section icon colors ──────────────────────────────────────────
const SECTION_ICON_COLORS = {
    header: { bg: '#ede9fe', color: '#7c3aed' },
    hero: { bg: '#dbeafe', color: '#2563eb' },
    footer: { bg: '#fce7f3', color: '#db2777' },
    announcement: { bg: '#fef9c3', color: '#ca8a04' },
    banner: { bg: '#dbeafe', color: '#2563eb' },
    collection: { bg: '#dcfce7', color: '#16a34a' },
    product: { bg: '#ffedd5', color: '#ea580c' },
    image: { bg: '#f0fdf4', color: '#15803d' },
    text: { bg: '#f1f5f9', color: '#475569' },
    rich: { bg: '#f1f5f9', color: '#475569' },
    featured: { bg: '#ecfdf5', color: '#059669' },
    cf: { bg: '#eef2ff', color: '#4f46e5' },
    default: { bg: '#f3f4f6', color: '#6b7280' },
};

function getSectionColor(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('cf')) return SECTION_ICON_COLORS.cf;
    for (const [key, val] of Object.entries(SECTION_ICON_COLORS)) {
        if (t.includes(key)) return val;
    }
    return SECTION_ICON_COLORS.default;
}

function SectionIcon({ type }) {
    const { bg, color } = getSectionColor(type);
    return (
        <div style={{ width: 28, height: 28, borderRadius: 7, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill={color}>
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" />
            </svg>
        </div>
    );
}

// ── DragHandle ───────────────────────────────────────────────────
function DragHandle({ listeners, attributes, visible }) {
    return (
        <div {...listeners} {...attributes} style={{
            cursor: 'grab', color: visible ? '#9ca3af' : 'transparent', display: 'flex', alignItems: 'center', flexShrink: 0,
            transition: 'color 0.1s', padding: '0 2px',
        }}>
            <svg width="12" height="16" viewBox="0 0 8 16" fill="currentColor">
                <circle cx="2" cy="3" r="1.2"/><circle cx="6" cy="3" r="1.2"/>
                <circle cx="2" cy="8" r="1.2"/><circle cx="6" cy="8" r="1.2"/>
                <circle cx="2" cy="13" r="1.2"/><circle cx="6" cy="13" r="1.2"/>
            </svg>
        </div>
    );
}

// ── Block row item ───────────────────────────────────────────────
function BlockItem({ block, isActive, formatName, onSelect, onSwap, onDelete, onInsertAfter, dragHandleProps = {} }) {
    const [hovered, setHovered] = useState(false);
    const { listeners, attributes } = dragHandleProps;

    return (
        <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ animation: 'cf-fade-in 0.2s ease' }}>
            <div
                onClick={onSelect}
                style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                    borderRadius: 10, cursor: 'pointer', userSelect: 'none',
                    background: isActive
                        ? 'linear-gradient(135deg, #4f46e5, #2563eb)'
                        : hovered ? '#f9fafb' : 'transparent',
                    transition: 'all 0.15s',
                    boxShadow: isActive ? '0 2px 8px rgba(79,70,229,0.25)' : 'none',
                }}
            >
                {/* Drag handle */}
                <div {...listeners} {...attributes} style={{ cursor: 'grab', color: hovered && !isActive ? '#9ca3af' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', transition: 'color 0.1s' }}>
                    <svg width="10" height="14" viewBox="0 0 8 16" fill="currentColor">
                        <circle cx="2" cy="3" r="1.2"/><circle cx="6" cy="3" r="1.2"/>
                        <circle cx="2" cy="8" r="1.2"/><circle cx="6" cy="8" r="1.2"/>
                        <circle cx="2" cy="13" r="1.2"/><circle cx="6" cy="13" r="1.2"/>
                    </svg>
                </div>

                {/* Section icon */}
                {isActive ? (
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="rgba(255,255,255,0.9)">
                            <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd"/>
                        </svg>
                    </div>
                ) : (
                    <SectionIcon type={block.type} />
                )}

                {/* Name */}
                <span style={{ flex: 1, fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? '#fff' : '#1f2937', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formatName(block.type)}
                </span>

                {/* CF badge */}
                {block.isCf && !isActive && (
                    <span style={{ fontSize: 9, background: '#eef2ff', color: '#4f46e5', padding: '2px 5px', borderRadius: 4, fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0 }}>CF</span>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, opacity: hovered && !isActive ? 1 : 0, transition: 'opacity 0.1s', flexShrink: 0 }}>
                    <button onClick={(e) => { e.stopPropagation(); onSwap(); }} title="Replace section"
                        style={{ width: 26, height: 26, border: 'none', background: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
                        onMouseOver={e => { e.currentTarget.style.background = '#e0e7ff'; e.currentTarget.style.color = '#4f46e5'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280'; }}>
                        <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor"><path d="M13.28 7.78l3.22-3.22v2.69a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.69l-3.22 3.22a.75.75 0 001.06 1.06zM2 17.25v-4.5a.75.75 0 011.5 0v2.69l3.22-3.22a.75.75 0 011.06 1.06L4.56 16.5h2.69a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z"/></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete section"
                        style={{ width: 26, height: 26, border: 'none', background: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
                        onMouseOver={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280'; }}>
                        <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd"/></svg>
                    </button>
                </div>
            </div>

            {/* Insert between divider */}
            {hovered && (
                <div style={{ display: 'flex', alignItems: 'center', height: 22, padding: '0 12px', gap: 8 }}>
                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                    <button onClick={onInsertAfter} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 5, fontWeight: 600 }}>
                        <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/></svg>
                        Insert here
                    </button>
                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                </div>
            )}
        </div>
    );
}

// ── Sortable wrapper ─────────────────────────────────────────────
function SortableBlockItem(props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.block.id });
    return (
        <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}>
            <BlockItem {...props} dragHandleProps={{ listeners, attributes }} />
        </div>
    );
}

// ── Group section ────────────────────────────────────────────────
function SectionGroup({ label, count, color, children }) {
    const [collapsed, setCollapsed] = useState(false);
    return (
        <div style={{ marginBottom: 4 }}>
            <button
                onClick={() => setCollapsed(c => !c)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8 }}
            >
                <svg width="11" height="11" viewBox="0 0 20 20" fill="#9ca3af" style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
                </svg>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', flex: 1, textAlign: 'left' }}>{label}</span>
                {count > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: color, color: '#fff', padding: '1px 7px', borderRadius: 20 }}>{count}</span>
                )}
            </button>
            {!collapsed && <div>{children}</div>}
        </div>
    );
}

// ── Main SidebarLeft ─────────────────────────────────────────────
export function SidebarLeft() {
    const {
        blocks, setBlocks, selectedBlockId, setSelectedBlockId,
        activeTab, setActiveTab, reorderSections,
        setInsertTargetId, setSwapTargetId,
        templateFile, setTemplateFile, removeSection
    } = useThemeEditor();

    if (activeTab === 'add' || activeTab === 'titan' || activeTab === 'swap') return <TemplatePicker />;

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const { headerBlocks, templateBlocks, footerBlocks } = useMemo(() => {
        const header = [], template = [], footer = [];
        for (const block of blocks) {
            const t = (block.type || block.id || '').toLowerCase();
            if (t.includes('header') || t.includes('announcement')) header.push(block);
            else if (t.includes('footer')) footer.push(block);
            else template.push(block);
        }
        return { headerBlocks: header, templateBlocks: template, footerBlocks: footer };
    }, [blocks]);

    function handleDragEnd({ active, over }) {
        if (!over || active.id === over.id) return;
        setBlocks(items => {
            const o = items.findIndex(i => i.id === active.id);
            const n = items.findIndex(i => i.id === over.id);
            const reordered = arrayMove(items, o, n);
            reorderSections(reordered.map(b => b.id));
            return reordered;
        });
    }

    const formatName = (type) => (type || '')
        .replace(/^cf[-_]/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const handleInsertAfter = (id) => { setInsertTargetId(id); setActiveTab('add'); };
    const handleSwap = (id) => { setSwapTargetId(id); setActiveTab('swap'); };
    const handleDelete = (id) => {
        if (window.confirm('Remove this section from the page?')) {
            setBlocks(prev => prev.filter(b => b.id !== id));
            removeSection(id);
        }
    };

    const blockProps = (block) => ({
        block,
        isActive: selectedBlockId === block.id,
        formatName,
        onSelect: () => setSelectedBlockId(block.id),
        onSwap: () => handleSwap(block.id),
        onDelete: () => handleDelete(block.id),
        onInsertAfter: () => handleInsertAfter(block.id),
    });

    return (
        <aside style={{ width: 268, minWidth: 268, height: '100%', background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>

            {/* Page selector */}
            <div style={{ padding: '14px 14px 10px' }}>
                <div style={{ position: 'relative' }}>
                    <select
                        value={templateFile}
                        onChange={e => {
                            setTemplateFile(e.target.value);
                            window.location.href = `/app/theme-editor?template=${e.target.value === 'templates/product.json' ? 'product' : 'index'}`;
                        }}
                        style={{
                            width: '100%', appearance: 'none', background: '#f9fafb',
                            border: '1.5px solid #e5e7eb', borderRadius: 10,
                            padding: '10px 36px 10px 14px', fontSize: 13, fontWeight: 600,
                            color: '#1f2937', cursor: 'pointer', outline: 'none',
                            transition: 'border-color 0.15s',
                        }}
                        onFocus={e => e.target.style.borderColor = '#4f46e5'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    >
                        <option value="templates/index.json">🏠 Home page</option>
                        <option value="templates/product.json">🛍️ Product page</option>
                    </select>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="#9ca3af" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
                    </svg>
                </div>
            </div>

            {/* Sections tree */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 6px 12px' }}>
                {headerBlocks.length > 0 && (
                    <SectionGroup label="Header" count={headerBlocks.length} color="#7c3aed">
                        {headerBlocks.map(block => <BlockItem key={block.id} {...blockProps(block)} />)}
                    </SectionGroup>
                )}

                <SectionGroup label="Template" count={templateBlocks.length} color="#2563eb">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={templateBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                            {templateBlocks.map(block => <SortableBlockItem key={block.id} {...blockProps(block)} />)}
                        </SortableContext>
                    </DndContext>

                    {/* Add Section */}
                    <button
                        onClick={() => { setInsertTargetId(null); setActiveTab('add'); }}
                        style={{
                            width: '100%', height: 44, margin: '6px 0 2px',
                            border: '1.5px dashed #c7d2fe', borderRadius: 10,
                            background: 'transparent', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                            fontSize: 13, fontWeight: 600, color: '#4f46e5',
                            transition: 'all 0.2s',
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderStyle = 'solid'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderStyle = 'dashed'; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/></svg>
                        Add Section
                    </button>
                </SectionGroup>

                {footerBlocks.length > 0 && (
                    <SectionGroup label="Footer" count={footerBlocks.length} color="#db2777">
                        {footerBlocks.map(block => <BlockItem key={block.id} {...blockProps(block)} />)}
                    </SectionGroup>
                )}
            </div>

            {/* Apply Template Button */}
            <div style={{ padding: '10px 14px 14px', borderTop: '1px solid #f3f4f6' }}>
                <button
                    onClick={() => setActiveTab('titan')}
                    style={{
                        width: '100%', height: 42, border: 'none', borderRadius: 10,
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        boxShadow: '0 2px 10px rgba(79,70,229,0.35)',
                        transition: 'all 0.2s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(79,70,229,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(79,70,229,0.35)'; e.currentTarget.style.transform = 'none'; }}
                >
                    ✨ Apply Readymade Template
                </button>
            </div>
        </aside>
    );
}
