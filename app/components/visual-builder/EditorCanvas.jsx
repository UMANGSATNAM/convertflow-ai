import React from 'react';
import { useVisualBuilderStore } from '../../store/visualBuilderStore';

// Recursive canvas element renderer
function CanvasNode({ node }) {
    const { selectedId, setSelectedId, hoveredId, setHoveredId } = useVisualBuilderStore();
    const isSelected = selectedId === node.id;
    const isHovered = hoveredId === node.id && !isSelected;
    const styles = node.settings?.styles || {};

    const handleClick = (e) => {
        e.stopPropagation();
        setSelectedId(node.id);
    };

    // Build the outline style
    const outlineStyle = isSelected
        ? '2px solid #635bff'
        : isHovered
            ? '2px dashed #93c5fd'
            : node.type === 'Root' ? 'none' : '1px dashed transparent';

    const commonProps = {
        onClick: handleClick,
        onMouseEnter: (e) => { e.stopPropagation(); setHoveredId(node.id); },
        onMouseLeave: (e) => { e.stopPropagation(); setHoveredId(null); },
        style: {
            ...styles,
            outline: outlineStyle,
            outlineOffset: '-1px',
            position: 'relative',
            cursor: 'pointer',
            transition: 'outline 0.15s ease',
        },
    };

    // --- Type Label Badge when selected ---
    const labelBadge = isSelected && node.id !== 'root' ? (
        <div
            style={{
                position: 'absolute',
                top: '-20px',
                left: '0',
                background: '#635bff',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '600',
                padding: '1px 6px',
                borderRadius: '4px 4px 0 0',
                zIndex: 10,
                pointerEvents: 'none',
                fontFamily: 'Inter, sans-serif',
            }}
        >
            {node.label || node.type}
        </div>
    ) : null;

    // --- Render based on type ---
    switch (node.type) {
        case 'Root':
            return (
                <div {...commonProps} style={{ ...commonProps.style, outline: 'none' }}>
                    {node.children?.length === 0 && (
                        <div style={{ padding: '80px 40px', textAlign: 'center', color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>
                            <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>Drop elements here</p>
                            <p style={{ fontSize: '13px' }}>Click "Add element" in the sidebar or drag components onto the canvas</p>
                        </div>
                    )}
                    {node.children?.map(child => <CanvasNode key={child.id} node={child} />)}
                </div>
            );

        case 'Row':
        case 'Section':
            return (
                <div {...commonProps}>
                    {labelBadge}
                    {node.children?.length === 0 && (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#d1d5db', fontSize: '12px', fontFamily: 'Inter, sans-serif', border: '1px dashed #e5e7eb', borderRadius: '8px', margin: '4px' }}>
                            Empty section — add elements
                        </div>
                    )}
                    {node.children?.map(child => <CanvasNode key={child.id} node={child} />)}
                </div>
            );

        case 'Column':
            return (
                <div {...commonProps}>
                    {labelBadge}
                    {node.children?.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#d1d5db', fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                            Empty column
                        </div>
                    )}
                    {node.children?.map(child => <CanvasNode key={child.id} node={child} />)}
                </div>
            );

        case 'Heading': {
            const Tag = node.settings?.tag || 'h2';
            return (
                <div style={{ position: 'relative' }}>
                    {labelBadge}
                    <Tag {...commonProps}>{node.settings?.text || 'Heading'}</Tag>
                </div>
            );
        }

        case 'Paragraph':
            return (
                <div style={{ position: 'relative' }}>
                    {labelBadge}
                    <p {...commonProps}>{node.settings?.text || 'Paragraph text'}</p>
                </div>
            );

        case 'Button':
            return (
                <div style={{ position: 'relative' }}>
                    {labelBadge}
                    <a {...commonProps} href="#" onClick={(e) => { e.preventDefault(); handleClick(e); }}>
                        {node.settings?.text || 'Button'}
                    </a>
                </div>
            );

        case 'Image':
            return (
                <div style={{ position: 'relative' }}>
                    {labelBadge}
                    <img
                        {...commonProps}
                        src={node.settings?.src || 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png'}
                        alt={node.settings?.alt || 'Image'}
                    />
                </div>
            );

        case 'Spacer':
            return (
                <div style={{ position: 'relative' }}>
                    {labelBadge}
                    <div {...commonProps} />
                </div>
            );

        case 'Divider':
            return (
                <div style={{ position: 'relative' }}>
                    {labelBadge}
                    <hr {...commonProps} style={{ ...commonProps.style, border: 'none' }} />
                </div>
            );

        default:
            return (
                <div {...commonProps}>
                    {labelBadge}
                    <span style={{ fontSize: '12px', color: '#999' }}>[{node.type}]</span>
                    {node.children?.map(child => <CanvasNode key={child.id} node={child} />)}
                </div>
            );
    }
}

// --- Main Canvas ---
export default function EditorCanvas() {
    const { elements, deviceMode, setSelectedId } = useVisualBuilderStore();
    const root = elements[0];

    const canvasWidth = deviceMode === 'mobile' ? '390px' : deviceMode === 'tablet' ? '768px' : '100%';
    const canvasMaxWidth = deviceMode === 'desktop' ? '1280px' : canvasWidth;

    return (
        <div
            className="flex-1 overflow-auto relative"
            style={{
                background: '#f0f2f5',
                backgroundImage: 'radial-gradient(circle, #d9dce1 1px, transparent 1px)',
                backgroundSize: '20px 20px',
            }}
            onClick={() => setSelectedId(null)}
        >
            <div className="flex justify-center py-6 px-4">
                <div
                    className="bg-white shadow-lg transition-all duration-300 mx-auto"
                    style={{
                        width: canvasWidth,
                        maxWidth: canvasMaxWidth,
                        minHeight: deviceMode === 'mobile' ? '844px' : '600px',
                        borderRadius: '2px',
                    }}
                >
                    <CanvasNode node={root} />
                </div>
            </div>
        </div>
    );
}
