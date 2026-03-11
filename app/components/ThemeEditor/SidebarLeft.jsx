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
import { Button, Icon, Text } from '@shopify/polaris';
import { PlusIcon } from '@shopify/polaris-icons';
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

    function handleDragEnd(event) {
        const { active, over } = event;

        if (active.id !== over.id) {
            setBlocks((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                const newBlocks = arrayMove(items, oldIndex, newIndex);

                // Fire off to the Remix backend Action asynchronously
                reorderSections(newBlocks.map(b => b.id));

                return newBlocks;
            });

            // Also dispatch to Iframe immediately to reorder HTML
            // (Implementation via useIframeBridge happens in Canvas/Context)
        }
    }

    // Pure representation of the draggable section items
    // Separating headers/footers in the future via block types
    return (
        <aside className="w-72 bg-white border-r border-polaris-border flex flex-col">
            <div className="p-3 border-b border-polaris-border bg-white sticky top-0">
                <div className="relative">
                    <select className="w-full bg-white border border-polaris-border rounded-lg py-1.5 pl-3 pr-8 text-sm font-medium focus:ring-1 focus:ring-primary appearance-none outline-none">
                        <option>Home page</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1.5 pointer-events-none text-polaris-subdued">unfold_more</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto sidebar-scroll">
                
                {/* Header Group */}
                <div className="p-2">
                    <button className="w-full flex items-center justify-between p-2 hover:bg-polaris-bg rounded-lg group">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-polaris-subdued">drag_indicator</span>
                            <span className="material-symbols-outlined text-polaris-subdued">keyboard_arrow_down</span>
                            <span className="text-sm font-semibold text-polaris-text">Header</span>
                        </div>
                        <span className="material-symbols-outlined text-polaris-subdued opacity-0 group-hover:opacity-100">visibility</span>
                    </button>
                    <div className="ml-10 space-y-1 mt-1">
                        <div className="flex items-center justify-between p-2 hover:bg-polaris-bg rounded-lg group">
                            <span className="text-sm text-polaris-text">Announcement bar</span>
                            <span className="material-symbols-outlined text-polaris-subdued opacity-0 group-hover:opacity-100">visibility</span>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-polaris-border mx-4 my-1"></div>

                {/* Template Group (Draggable) */}
                <div className="p-2">
                    <button className="w-full flex items-center justify-between p-2 hover:bg-polaris-bg rounded-lg group">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-polaris-subdued">drag_indicator</span>
                            <span className="material-symbols-outlined text-polaris-subdued">keyboard_arrow_down</span>
                            <span className="text-sm font-semibold text-polaris-text">Template</span>
                        </div>
                        <span className="material-symbols-outlined text-polaris-subdued">visibility</span>
                    </button>

                    <div className="ml-6 space-y-1 mt-1 pb-2">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={blocks.map(b => b.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {blocks.map(block => (
                                    <SortableItem
                                        key={block.id}
                                        id={block.id}
                                        title={block.type}
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

                {/* Footer Group */}
                <div className="p-2">
                    <button className="w-full flex items-center justify-between p-2 hover:bg-polaris-bg rounded-lg group">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-polaris-subdued">drag_indicator</span>
                            <span className="material-symbols-outlined text-polaris-subdued">keyboard_arrow_right</span>
                            <span className="text-sm font-semibold text-polaris-text">Footer</span>
                        </div>
                        <span className="material-symbols-outlined text-polaris-subdued">visibility</span>
                    </button>
                </div>
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
