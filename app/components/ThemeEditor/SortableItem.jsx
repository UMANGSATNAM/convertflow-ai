import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icon, Text } from '@shopify/polaris';
import { DragDropIcon, AppsIcon } from '@shopify/polaris-icons';

export function SortableItem(props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto',
        opacity: isDragging ? 0.8 : 1,
        boxShadow: isDragging ? '0 0px 8px rgba(0,0,0,0.1)' : 'none',
    };

    // 1:1 Polaris specific row styling
    const isActive = props.isActive;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            onClick={props.onClick}
            className={`te-sortable-row ${isActive ? 'active' : ''}`}
        >
            <div
                {...listeners}
                style={{
                    cursor: isDragging ? 'grabbing' : 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--p-color-icon-secondary)'
                }}
            >
                <Icon source={DragDropIcon} />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
                <Icon source={AppsIcon} color={isActive ? "interactive" : "base"} />
                <Text variant="bodyMd" as="span" truncate tone={isActive ? "interactive" : "base"}>
                    {props.title}
                </Text>
            </div>

            {isActive && (
                <div style={{ width: 4, height: 16, background: 'var(--p-color-bg-interactive)', borderRadius: 2 }} />
            )}
        </div>
    );
}
