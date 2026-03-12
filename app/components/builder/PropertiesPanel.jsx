import React, { useState } from 'react';

export function PropertiesPanel({ selectedBlockId }) {
    if (!selectedBlockId) {
        return (
            <aside style={{
                width: 320, minWidth: 320, height: '100%',
                background: '#ffffff', borderLeft: '1px solid #e5e7eb',
                display: 'flex', flexDirection: 'column', flexShrink: 0,
                color: '#374151', padding: '24px 20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </div>
                
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#111827' }}>Add elements</h3>
                <p style={{ fontSize: 13, lineHeight: 1.5, color: '#4b5563', margin: '0 0 32px' }}>
                    Select, drag, and drop your element variants of choice into the canvas.
                </p>

                <h4 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 8px', color: '#111827' }}>PageFly elements</h4>
                <p style={{ fontSize: 12, lineHeight: 1.5, color: '#6b7280', margin: '0 0 32px' }}>
                    PageFly elements are the original building blocks of PageFly pages. They include a variety of functions, basic or advanced, and will meet all merchants' needs.
                </p>

                <h4 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 8px', color: '#111827' }}>Shopify elements</h4>
                <p style={{ fontSize: 12, lineHeight: 1.5, color: '#6b7280', margin: 0 }}>
                    Shopify elements directly display content from Shopify like product and collection information, blog posts, meta data, etc.
                </p>
            </aside>
        );
    }

    return (
        <aside style={{
            width: 320, minWidth: 320, height: '100%',
            background: '#ffffff', borderLeft: '1px solid #e5e7eb',
            display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden'
        }}>
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
                    Element Settings
                </h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                    ID: {selectedBlockId.slice(0, 8)}...
                </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
                {/* Text Input */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>General text</label>
                    <input type="text" defaultValue="Parent Information" style={{
                        width: '100%', padding: '10px 12px', fontSize: 13,
                        background: '#ffffff', border: '1px solid #d1d5db', borderRadius: 4,
                        color: '#111827', outline: 'none', transition: 'border-color 0.2s',
                    }} />
                </div>

                {/* Color Picker Simulator */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Background Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 4, background: '#e0f2fe', border: '1px solid #d1d5db' }} />
                        <span style={{ fontSize: 13, color: '#4b5563', fontFamily: 'monospace' }}>#e0f2fe</span>
                    </div>
                </div>

                {/* Toggle / Checkbox  */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Full Width</label>
                    <div style={{ width: 36, height: 20, background: '#2563eb', borderRadius: 12, position: 'relative', cursor: 'pointer' }}>
                        <div style={{ width: 16, height: 16, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, right: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
                    </div>
                </div>

            </div>
        </aside>
    );
}
