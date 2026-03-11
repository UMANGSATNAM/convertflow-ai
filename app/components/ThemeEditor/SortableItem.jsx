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

    // 1:1 Shopify Editor row styling
    const isActive = props.isActive;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            onClick={props.onClick}
            className={`flex items-center justify-between p-2 rounded-r-lg group cursor-pointer transition-colors ${
                isActive ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-polaris-bg border-l-2 border-transparent hover:border-polaris-border'
            }`}
        >
            <div className="flex items-center gap-2" {...listeners} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
                <span className="material-symbols-outlined text-polaris-subdued">drag_indicator</span>
                <span className={`material-symbols-outlined ${isActive ? 'text-primary' : 'text-polaris-subdued'}`}>
                    grid_view
                </span>
                <span className={`text-sm font-medium ${isActive ? 'text-polaris-text font-semibold' : 'text-polaris-text'}`}>
                    {props.title}
                </span>
            </div>
            <span className={`material-symbols-outlined text-polaris-subdued transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                visibility
            </span>
        </div>
    );
}
