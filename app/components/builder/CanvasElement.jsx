import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useBuilderStore } from '../../store/builderStore';

export default function CanvasElement({ node }) {
    const { id, type, settings, children } = node;
    const { selectedId, setSelectedId, hoveredId, setHoveredId } = useBuilderStore();

    // If it's a container, it needs to be droppable
    const isContainer = type === 'Root' || type === 'Row' || type === 'Column';

    const { setNodeRef, isOver } = useDroppable({
        id: id,
        data: {
            type: type,
            isContainer: isContainer,
        },
        disabled: !isContainer // Only containers accept drops
    });

    const isSelected = selectedId === id;
    const isHovered = hoveredId === id && !isSelected;

    const handleSelect = (e) => {
        e.stopPropagation(); // Prevent selecting parent
        setSelectedId(id);
    };

    const handleMouseEnter = (e) => {
        e.stopPropagation();
        setHoveredId(id);
    };

    const handleMouseLeave = (e) => {
        e.stopPropagation();
        setHoveredId(null);
    };

    // Construct the CSS styles from settings
    const inlineStyles = { ...settings?.styles };

    // Common wrapper classes for selection/hover styling
    const wrapperClass = `
        relative transition-all duration-200 outline outline-1 outline-offset-[-1px]
        ${isSelected ? 'outline-blue-500 z-10' : ''}
        ${isHovered ? 'outline-blue-300 z-10' : ''}
        ${!isSelected && !isHovered ? 'outline-transparent' : ''}
        ${isOver && isContainer ? 'bg-blue-50/10 outline-dashed outline-2 outline-blue-400' : ''}
    `;

    // Render logic based on node type
    const renderNode = () => {
        switch (type) {
            case 'Root':
                return (
                    <div
                        ref={setNodeRef}
                        className={`min-h-full ${wrapperClass}`}
                        style={inlineStyles}
                        onClick={handleSelect}
                    >
                        {children.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50 py-20 pointer-events-none">
                                <span className="text-4xl mb-4">+</span>
                                <p>Drag and drop elements here to start building</p>
                            </div>
                        )}
                        {children.map(child => <CanvasElement key={child.id} node={child} />)}
                    </div>
                );
            case 'Row':
            case 'Column':
                return (
                    <div
                        ref={setNodeRef}
                        className={`min-h-[50px] min-w-[50px] ${wrapperClass}`}
                        style={inlineStyles}
                        onClick={handleSelect}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {children.map(child => <CanvasElement key={child.id} node={child} />)}
                        {children.length === 0 && isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100/10 text-xs text-gray-400 pointer-events-none opacity-50">
                                Empty {type}
                            </div>
                        )}
                    </div>
                );
            case 'Heading':
                const Tag = settings.tag || 'h2';
                return (
                    <Tag
                        className={wrapperClass}
                        style={inlineStyles}
                        onClick={handleSelect}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {settings.text}
                    </Tag>
                );
            case 'Paragraph':
                return (
                    <p
                        className={wrapperClass}
                        style={inlineStyles}
                        onClick={handleSelect}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {settings.text}
                    </p>
                );
            case 'Button':
                return (
                    <a
                        href={settings.url || '#'}
                        className={wrapperClass}
                        style={inlineStyles}
                        onClick={(e) => { e.preventDefault(); handleSelect(e); }}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {settings.text}
                    </a>
                );
            case 'Image':
                return (
                    <img
                        src={settings.src}
                        alt={settings.alt}
                        className={wrapperClass}
                        style={inlineStyles}
                        onClick={handleSelect}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    />
                );
            case 'Spacer':
            case 'Divider':
                return (
                    <div
                        className={wrapperClass}
                        style={inlineStyles}
                        onClick={handleSelect}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    />
                );
            default:
                return (
                    <div className="p-4 bg-red-100 text-red-800 border border-red-300">
                        Unknown element type: {type}
                    </div>
                );
        }
    };

    return (
        <div className="relative group">
            {/* Selection Label Badge */}
            {isSelected && type !== 'Root' && (
                <div className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-t-md flex items-center gap-2 z-50">
                    {type}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            useBuilderStore.getState().removeElement(id);
                        }}
                        className="hover:text-red-200 transition-colors ml-1"
                    >
                        ✕
                    </button>
                </div>
            )}
            {renderNode()}
        </div>
    );
}
