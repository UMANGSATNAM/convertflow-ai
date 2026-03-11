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
    const {
        blocks, setBlocks, selectedBlockId, setSelectedBlockId,
        activeTab, setActiveTab, reorderSections,
        setInsertTargetId, setSwapTargetId,
        templateFile, setTemplateFile
    } = useThemeEditor();

    // Slide-over Template Picker (for add, insert-at, swap, or titan)
    if (activeTab === 'add' || activeTab === 'titan' || activeTab === 'swap') {
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

    // Handle template file switch (Home page / Product page)
    const handleTemplateSwitch = (e) => {
        const val = e.target.value;
        setTemplateFile(val);
        // Navigate to reload with new template
        window.location.href = `/app/theme-editor?template=${val === 'templates/product.json' ? 'product' : 'index'}`;
    };

    // Handle "Insert after this block" — opens picker in insert mode
    const handleInsertAfter = (blockId) => {
        setInsertTargetId(blockId);
        setActiveTab('add');
    };

    // Handle "Swap this block" — opens picker in swap mode
    const handleSwap = (blockId) => {
        setSwapTargetId(blockId);
        setActiveTab('swap');
    };

    // Render a single section item with actions
    const renderBlockItem = (block) => (
        <div key={block.id} className="group">
            <button
                onClick={() => setSelectedBlockId(block.id)}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left ${
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
                <div className="flex items-center gap-1">
                    {block.isCf && (
                        <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">CF</span>
                    )}
                    {/* Swap button — visible on hover */}
                    <button
                        onClick={(e) => { e.stopPropagation(); handleSwap(block.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-polaris-subdued hover:text-primary transition-all"
                        title="Swap section"
                    >
                        <span className="material-symbols-outlined text-base">swap_horiz</span>
                    </button>
                </div>
            </button>

            {/* Insert-between [+] button — appears on hover below each section */}
            <div className="h-0 group-hover:h-8 overflow-hidden transition-all duration-200 flex items-center justify-center">
                <button
                    onClick={() => handleInsertAfter(block.id)}
                    className="flex items-center gap-1 text-xs text-polaris-subdued hover:text-primary transition-colors"
                    title="Insert section here"
                >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    <span>Add section</span>
                </button>
            </div>
        </div>
    );

    return (
        <aside className="w-72 h-full bg-white border-r border-polaris-border flex flex-col">
            {/* Template Selector Dropdown */}
            <div className="p-3 border-b border-polaris-border bg-white sticky top-0">
                <div className="relative">
                    <select 
                        className="w-full bg-white border border-polaris-border rounded-lg py-1.5 pl-3 pr-8 text-sm font-medium focus:ring-1 focus:ring-primary appearance-none outline-none"
                        value={templateFile}
                        onChange={handleTemplateSwitch}
                    >
                        <option value="templates/index.json">Home page</option>
                        <option value="templates/product.json">Product page</option>
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
                        <div className="ml-8 space-y-0 mt-1">
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

                    <div className="ml-6 space-y-0 mt-1 pb-2">
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
                                        isCf={block.isCf}
                                        onClick={() => setSelectedBlockId(block.id)}
                                        onSwap={() => handleSwap(block.id)}
                                        onInsertAfter={() => handleInsertAfter(block.id)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        {/* Add section button */}
                        <button
                            className="mt-4 w-full border border-dashed border-polaris-border py-2 text-sm text-polaris-subdued hover:bg-polaris-bg rounded-lg transition-colors"
                            onClick={() => { setInsertTargetId(null); setActiveTab('add'); }}
                        >
                            + Add section
                        </button>

                        {/* Apply Titan Template button */}
                        <button
                            className="mt-2 w-full border border-primary/30 bg-primary/5 py-2 text-sm text-primary font-medium hover:bg-primary/10 rounded-lg transition-colors"
                            onClick={() => setActiveTab('titan')}
                        >
                            Apply Titan Template
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
                        <div className="ml-8 space-y-0 mt-1">
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
