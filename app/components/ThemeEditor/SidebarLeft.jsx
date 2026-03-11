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
    const { blocks, setBlocks, selectedBlockId, setSelectedBlockId, activeTab, setActiveTab } = useThemeEditor();

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
                return arrayMove(items, oldIndex, newIndex);
            });

            // Also dispatch to Iframe immediately to reorder HTML
            // (Implementation via useIframeBridge happens in Canvas/Context)
        }
    }

    // Pure representation of the draggable section items
    // Separating headers/footers in the future via block types
    return (
        <aside style={{
            width: 260, flexShrink: 0, borderRight: '1px solid var(--p-color-border)',
            background: '#fff', display: 'flex', flexDirection: 'column'
        }}>

            {/* Header Panel */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--p-color-border)' }}>
                <Text variant="headingMd" as="h3">Page content</Text>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>

                {/* Shopify Top Header Concept (Fixed) */}
                <div style={{ padding: '8px', color: 'var(--p-color-text-secondary)' }}>
                    <Text variant="bodySm" fontWeight="medium">Header group</Text>
                </div>

                {/* Draggable Template Body */}
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

                <div style={{ padding: '8px 0', marginTop: '4px' }}>
                    <Button
                        variant="tertiary"
                        icon={PlusIcon}
                        fullWidth
                        textAlign="left"
                        onClick={() => setActiveTab('add')}
                    >
                        Add section
                    </Button>
                </div>

                {/* Shopify Bottom Footer Concept (Fixed) */}
                <div style={{ padding: '8px', color: 'var(--p-color-text-secondary)', marginTop: '24px' }}>
                    <Text variant="bodySm" fontWeight="medium">Footer group</Text>
                </div>

            </div>

        </aside>
    );
}
