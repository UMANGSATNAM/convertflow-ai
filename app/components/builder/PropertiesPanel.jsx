import React, { useState } from 'react';

export function PropertiesPanel({ selectedBlockId }) {
    if (!selectedBlockId) {
        return (
            <aside style={{
                width: 320, minWidth: 320, height: '100%',
                background: '#1e293b', borderLeft: '1px solid #334155',
                display: 'flex', flexDirection: 'column', flexShrink: 0,
                alignItems: 'center', justifyContent: 'center', color: '#64748b'
            }}>
                <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
                    <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
                </svg>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>Select a section to edit properties.</p>
            </aside>
        );
    }

    return (
        <aside style={{
            width: 320, minWidth: 320, height: '100%',
            background: '#1e293b', borderLeft: '1px solid #334155',
            display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden'
        }}>
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #334155' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: '0 0 4px' }}>
                    Section Name
                </h3>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                    ID: {selectedBlockId.slice(0, 8)}...
                </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
                {/* Text Input */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>Heading Title</label>
                    <input type="text" defaultValue="Vantage Watch" style={{
                        width: '100%', padding: '10px 12px', fontSize: 14,
                        background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
                        color: '#f8fafc', outline: 'none', transition: 'border-color 0.2s',
                    }} />
                </div>

                {/* Color Picker Simulator */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>Background Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f8fafc', border: '2px solid #334155' }} />
                        <span style={{ fontSize: 14, color: '#94a3b8', fontFamily: 'monospace' }}>#f8fafc</span>
                    </div>
                </div>

                {/* Toggle / Checkbox  */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Show Borders</label>
                    <div style={{ width: 44, height: 24, background: '#6366f1', borderRadius: 12, position: 'relative', cursor: 'pointer' }}>
                        <div style={{ width: 20, height: 20, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, right: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                </div>

                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Full Width</label>
                    <div style={{ width: 44, height: 24, background: '#334155', borderRadius: 12, position: 'relative', cursor: 'pointer' }}>
                        <div style={{ width: 20, height: 20, background: '#94a3b8', borderRadius: '50%', position: 'absolute', top: 2, left: 2, transition: 'all 0.2s' }} />
                    </div>
                </div>

            </div>
        </aside>
    );
}
