import React, { useMemo, useState } from 'react';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useThemeEditor } from './ThemeEditorContext';
import { TemplatePicker } from './TemplatePicker';

// ── Sortable block item ──────────────────────────────────────────────
function SortableBlockItem({ block, isActive, formatName, onSelect, onSwap, onDelete, onInsertAfter }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <BlockItem
                block={block}
                isActive={isActive}
                formatName={formatName}
                onSelect={onSelect}
                onSwap={onSwap}
                onDelete={onDelete}
                onInsertAfter={onInsertAfter}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
}

// ── Block item (shared for both sortable and static) ─────────────────
function BlockItem({ block, isActive, formatName, onSelect, onSwap, onDelete, onInsertAfter, dragHandleProps = {} }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div
                onClick={onSelect}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 8px 7px 4px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: isActive ? '#e3eeff' : hovered ? '#f1f2f4' : 'transparent',
                    transition: 'background 0.1s',
                    userSelect: 'none',
                }}
            >
                {/* Drag Handle */}
                <span
                    {...dragHandleProps}
                    style={{ cursor: 'grab', color: hovered ? '#8c9196' : 'transparent', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'color 0.1s' }}
                >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M7 2a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4z" /></svg>
                </span>
                {/* Section Icon */}
                <span style={{ color: isActive ? '#005bd3' : '#6d7175', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" /></svg>
                </span>
                {/* Name */}
                <span style={{ flex: 1, fontSize: 13, color: isActive ? '#005bd3' : '#202223', fontWeight: isActive ? 600 : 400, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formatName(block.type)}
                </span>
                {/* CF badge */}
                {block.isCf && (
                    <span style={{ fontSize: 10, background: '#eaf3fe', color: '#005bd3', padding: '1px 5px', borderRadius: 4, fontWeight: 600, flexShrink: 0 }}>CF</span>
                )}
                {/* Actions on hover */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, opacity: hovered ? 1 : 0, transition: 'opacity 0.1s', flexShrink: 0 }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onSwap(); }}
                        title="Replace"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, border: 'none', background: 'none', borderRadius: 4, cursor: 'pointer', color: '#6d7175' }}
                        onMouseOver={e => e.currentTarget.style.background = '#e4e5e7'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                    >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M4.06 5.06a1 1 0 000 1.414L5.586 8h-2.25a.75.75 0 000 1.5h4.025c.033 0 .065-.002.097-.005a.75.75 0 00.653-.748V4.75a.75.75 0 00-1.5 0v2.154L5.47 5.768a1 1 0 00-1.41-.708zm11.88 4.94a1 1 0 000-1.414L14.414 7h2.25a.75.75 0 000-1.5h-4.025c-.033 0-.065.002-.097.005a.75.75 0 00-.653.748V10.25a.75.75 0 001.5 0V8.096l1.141 1.186a1 1 0 001.41-.292z" /></svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        title="Remove section"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, border: 'none', background: 'none', borderRadius: 4, cursor: 'pointer', color: '#6d7175' }}
                        onMouseOver={e => { e.currentTarget.style.background = '#fff4f4'; e.currentTarget.style.color = '#d72c0d'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6d7175'; }}
                    >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>

            {/* Insert betwen divider */}
            {hovered && (
                <div style={{ display: 'flex', alignItems: 'center', height: 20, padding: '0 8px', gap: 8 }}>
                    <div style={{ flex: 1, height: 1, background: '#e4e5e7' }} />
                    <button
                        onClick={(e) => { e.stopPropagation(); onInsertAfter(); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#005bd3', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, fontWeight: 500 }}
                    >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                        Add section
                    </button>
                    <div style={{ flex: 1, height: 1, background: '#e4e5e7' }} />
                </div>
            )}
        </div>
    );
}

// ── Group header component ───────────────────────────────────────────
function GroupHeader({ label, count, onAddSection }) {
    const [collapsed, setCollapsed] = useState(false);
    return (
        <div>
            <div
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', cursor: 'pointer' }}
                onClick={() => setCollapsed(c => !c)}
            >
                <span style={{ color: '#6d7175', display: 'flex', alignItems: 'center', transition: 'transform 0.15s', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6d7175', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
                {count > 0 && <span style={{ fontSize: 11, color: '#8c9196', background: '#f1f2f4', padding: '1px 6px', borderRadius: 8, marginLeft: 'auto' }}>{count}</span>}
            </div>
        </div>
    );
}

// ── Main SidebarLeft ─────────────────────────────────────────────────
export function SidebarLeft() {
    const {
        blocks, setBlocks, selectedBlockId, setSelectedBlockId,
        activeTab, setActiveTab, reorderSections,
        setInsertTargetId, setSwapTargetId,
        templateFile, setTemplateFile, removeSection
    } = useThemeEditor();

    if (activeTab === 'add' || activeTab === 'titan' || activeTab === 'swap') {
        return <TemplatePicker />;
    }

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

    function handleDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setBlocks(items => {
            const oldIdx = items.findIndex(i => i.id === active.id);
            const newIdx = items.findIndex(i => i.id === over.id);
            const reordered = arrayMove(items, oldIdx, newIdx);
            reorderSections(reordered.map(b => b.id));
            return reordered;
        });
    }

    const formatName = (type) => (type || '')
        .replace(/^cf[-_]/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

    const handleInsertAfter = (blockId) => { setInsertTargetId(blockId); setActiveTab('add'); };
    const handleSwap = (blockId) => { setSwapTargetId(blockId); setActiveTab('swap'); };
    const handleDelete = (blockId) => {
        if (window.confirm('Remove this section?')) {
            setBlocks(prev => prev.filter(b => b.id !== blockId));
            removeSection(blockId);
        }
    };

    const handleTemplateSwitch = (e) => {
        const val = e.target.value;
        setTemplateFile(val);
        window.location.href = `/app/theme-editor?template=${val === 'templates/product.json' ? 'product' : 'index'}`;
    };

    return (
        <aside style={{ width: 270, minWidth: 270, height: '100%', background: '#fff', borderRight: '1px solid #ebebeb', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>

            {/* Template selector */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #ebebeb' }}>
                <div style={{ position: 'relative' }}>
                    <select
                        value={templateFile}
                        onChange={handleTemplateSwitch}
                        style={{ width: '100%', appearance: 'none', background: '#fff', border: '1px solid #c9cccf', borderRadius: 6, padding: '7px 28px 7px 10px', fontSize: 13, fontWeight: 500, color: '#202223', cursor: 'pointer', outline: 'none' }}
                    >
                        <option value="templates/index.json">Home page</option>
                        <option value="templates/product.json">Product page</option>
                    </select>
                    <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6d7175' }}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                    </span>
                </div>
            </div>

            {/* Sections tree */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 16px' }}>

                {/* Header */}
                {headerBlocks.length > 0 && (
                    <div style={{ marginBottom: 4 }}>
                        <GroupHeader label="Header" count={0} />
                        {headerBlocks.map(block => (
                            <div key={block.id} style={{ paddingLeft: 16 }}>
                                <BlockItem
                                    block={block}
                                    isActive={selectedBlockId === block.id}
                                    formatName={formatName}
                                    onSelect={() => setSelectedBlockId(block.id)}
                                    onSwap={() => handleSwap(block.id)}
                                    onDelete={() => handleDelete(block.id)}
                                    onInsertAfter={() => handleInsertAfter(block.id)}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Template (Draggable) */}
                <div style={{ marginBottom: 4 }}>
                    <GroupHeader label="Template" count={templateBlocks.length} />
                    <div style={{ paddingLeft: 16 }}>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={templateBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                {templateBlocks.map(block => (
                                    <SortableBlockItem
                                        key={block.id}
                                        block={block}
                                        isActive={selectedBlockId === block.id}
                                        formatName={formatName}
                                        onSelect={() => setSelectedBlockId(block.id)}
                                        onSwap={() => handleSwap(block.id)}
                                        onDelete={() => handleDelete(block.id)}
                                        onInsertAfter={() => handleInsertAfter(block.id)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        {/* Add section */}
                        <button
                            onClick={() => { setInsertTargetId(null); setActiveTab('add'); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 8px', color: '#005bd3', background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, marginTop: 4 }}
                            onMouseOver={e => e.currentTarget.style.background = '#f1f2f4'}
                            onMouseOut={e => e.currentTarget.style.background = 'none'}
                        >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                            Add section
                        </button>
                    </div>
                </div>

                {/* Footer */}
                {footerBlocks.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                        <GroupHeader label="Footer" count={0} />
                        {footerBlocks.map(block => (
                            <div key={block.id} style={{ paddingLeft: 16 }}>
                                <BlockItem
                                    block={block}
                                    isActive={selectedBlockId === block.id}
                                    formatName={formatName}
                                    onSelect={() => setSelectedBlockId(block.id)}
                                    onSwap={() => handleSwap(block.id)}
                                    onDelete={() => handleDelete(block.id)}
                                    onInsertAfter={() => handleInsertAfter(block.id)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom: Theme settings */}
            <div style={{ borderTop: '1px solid #ebebeb', padding: '8px 12px' }}>
                <button
                    onClick={() => setActiveTab('titan')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', background: '#f1f2f4', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#202223', fontSize: 13, fontWeight: 500 }}
                >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 116.11 5.173L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zm-9.09 9.08a4 4 0 015.14-6.13 4 4 0 01.98 5.95l.65.66a6 6 0 10-8.49-.01l.65-.65a4 4 0 011.07.17zm0 0" /></svg>
                    Apply Readymade Theme
                </button>
            </div>
        </aside>
    );
}
