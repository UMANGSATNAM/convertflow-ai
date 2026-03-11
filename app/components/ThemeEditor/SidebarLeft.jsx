import React, { useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { useThemeEditor } from './ThemeEditorContext';
import { TemplatePicker } from './TemplatePicker';

export function SidebarLeft() {
    const { blocks, setBlocks, selectedBlockId, setSelectedBlockId, activeTab, setActiveTab, reorderSections } = useThemeEditor();

    // Slide-over Template Picker
    if (activeTab === 'add') {
        return <TemplatePicker />;
    }

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // ── Group blocks into Header / Template / Footer ────────────
    const { headerBlocks, templateBlocks, footerBlocks } = useMemo(() => {
        const header = [];
        const template = [];
        const footer = [];
        
        for (const block of blocks) {
            const t = (block.type || block.id || '').toLowerCase();
            if (t.includes('header') || t.includes('announcement')) {
                header.push(block);
            } else if (t.includes('footer')) {
                footer.push(block);
            } else {
                template.push(block);
            }
        }
        
        return { headerBlocks: header, templateBlocks: template, footerBlocks: footer };
    }, [blocks]);

    function handleDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setBlocks((items) => {
            const oldIndex = items.findIndex(i => i.id === active.id);
            const newIndex = items.findIndex(i => i.id === over.id);
            const newBlocks = arrayMove(items, oldIndex, newIndex);
            reorderSections(newBlocks.map(b => b.id));
            return newBlocks;
        });
    }

    // Format display name from section type
    const formatName = (type) => {
        return (type || '')
            .replace(/^cf[-_]/, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    };

    // Render clickable section item
    const renderBlockItem = (block) => (
        <button
            key={block.id}
            onClick={() => setSelectedBlockId(block.id)}
            className={`w-full flex items-center justify-between p-2 rounded-lg group transition-colors text-left ${
                selectedBlockId === block.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-polaris-bg'
            }`}
        >
            <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-polaris-subdued text-base">
                    {block.isCf ? 'widgets' : 'view_module'}
                </span>
                <span className="text-sm text-polaris-text truncate">{formatName(block.type)}</span>
            </div>
            {block.isCf && (
                <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">CF</span>
            )}
        </button>
    );

    return (
        <aside className="w-72 h-full bg-white border-r border-polaris-border flex flex-col">
            <div className="p-3 border-b border-polaris-border bg-white sticky top-0">
                <div className="relative">
                    <select className="w-full bg-white border border-polaris-border rounded-lg py-1.5 pl-3 pr-8 text-sm font-medium focus:ring-1 focus:ring-primary appearance-none outline-none">
                        <option>Home page</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1.5 pointer-events-none text-polaris-subdued">unfold_more</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto sidebar-scroll">
                
                {/* ── Header Group ─────────────────────────────── */}
                {headerBlocks.length > 0 && (
                    <div className="p-2">
                        <div className="flex items-center gap-2 p-2">
                            <span className="material-symbols-outlined text-polaris-subdued">drag_indicator</span>
                            <span className="material-symbols-outlined text-polaris-subdued">keyboard_arrow_down</span>
                            <span className="text-sm font-semibold text-polaris-text">Header</span>
                        </div>
                        <div className="ml-8 space-y-1 mt-1">
                            {headerBlocks.map(renderBlockItem)}
                        </div>
                    </div>
                )}

                <div className="h-px bg-polaris-border mx-4 my-1"></div>

                {/* ── Template Group (Draggable) ────────────────── */}
                <div className="p-2">
                    <div className="flex items-center gap-2 p-2">
                        <span className="material-symbols-outlined text-polaris-subdued">drag_indicator</span>
                        <span className="material-symbols-outlined text-polaris-subdued">keyboard_arrow_down</span>
                        <span className="text-sm font-semibold text-polaris-text">Template</span>
                        <span className="text-[10px] text-polaris-subdued bg-polaris-bg px-1.5 py-0.5 rounded-full ml-auto">{templateBlocks.length}</span>
                    </div>

                    <div className="ml-6 space-y-1 mt-1 pb-2">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={templateBlocks.map(b => b.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {templateBlocks.map(block => (
                                    <SortableItem
                                        key={block.id}
                                        id={block.id}
                                        title={formatName(block.type)}
                                        isActive={selectedBlockId === block.id}
                                        onClick={() => setSelectedBlockId(block.id)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                        
                        <button 
                            className="mt-4 w-full border border-dashed border-polaris-border py-2 text-sm text-polaris-subdued hover:bg-polaris-bg rounded-lg transition-colors"
                            onClick={() => setActiveTab('add')}
                        >
                            + Add section
                        </button>
                    </div>
                </div>

                <div className="h-px bg-polaris-border mx-4 my-1"></div>

                {/* ── Footer Group ──────────────────────────────── */}
                {footerBlocks.length > 0 && (
                    <div className="p-2">
                        <div className="flex items-center gap-2 p-2">
                            <span className="material-symbols-outlined text-polaris-subdued">drag_indicator</span>
                            <span className="material-symbols-outlined text-polaris-subdued">keyboard_arrow_down</span>
                            <span className="text-sm font-semibold text-polaris-text">Footer</span>
                        </div>
                        <div className="ml-8 space-y-1 mt-1">
                            {footerBlocks.map(renderBlockItem)}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Global Settings Trigger */}
            <div className="p-3 border-t border-polaris-border bg-white">
                <button className="w-full flex items-center gap-3 p-2 hover:bg-polaris-bg rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-polaris-subdued">settings</span>
                    <span className="text-sm font-medium text-polaris-text">Theme settings</span>
                </button>
            </div>
        </aside>
    );
}
