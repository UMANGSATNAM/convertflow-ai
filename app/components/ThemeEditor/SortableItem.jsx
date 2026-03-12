import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

    const isActive = props.isActive;

    return (
        <div className="group">
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                onClick={props.onClick}
                className={`flex items-center justify-between p-2 rounded-r-lg cursor-pointer transition-colors ${
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
                <div className="flex items-center gap-1">
                    {props.isCf && (
                        <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">CF</span>
                    )}

                    {/* Action buttons — visible on hover */}
                    <div className={`flex items-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {props.onSwap && (
                            <button
                                onClick={(e) => { e.stopPropagation(); props.onSwap(); }}
                                className="p-1 text-polaris-subdued hover:text-primary transition-all rounded hover:bg-white/50"
                                title="Replace section"
                            >
                                <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                            </button>
                        )}
                        {props.onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); props.onDelete(); }}
                                className="p-1 text-polaris-subdued hover:text-red-600 transition-all rounded hover:bg-red-50"
                                title="Delete section"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Insert-between [+] button — appears on hover below */}
            {props.onInsertAfter && (
                <div className="h-0 group-hover:h-7 overflow-hidden transition-all duration-200 flex items-center justify-center">
                    <button
                        onClick={(e) => { e.stopPropagation(); props.onInsertAfter(); }}
                        className="flex items-center gap-1 text-xs text-polaris-subdued hover:text-primary transition-colors"
                        title="Insert section here"
                    >
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        <span>Add section</span>
                    </button>
                </div>
            )}
        </div>
    );
}
