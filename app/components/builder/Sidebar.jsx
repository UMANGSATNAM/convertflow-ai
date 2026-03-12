import React, { useState } from 'react';

export function Sidebar({ blocks = [], selectedBlockId, onSelectBlock }) {
    const [hoveredId, setHoveredId] = useState(null);

    return (
        <aside style={{
            width: 300, minWidth: 300, height: '100%',
            background: '#1e293b', borderRight: '1px solid #334155',
            display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden'
        }}>
            <div style={{ padding: '20px 20px 12px' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Template Sections
                </h3>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 20px' }}>
                {blocks.map((block, i) => (
                    <div
                        key={block.id || i}
                        onMouseEnter={() => setHoveredId(block.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => onSelectBlock(block.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px', margin: '4px 0',
                            borderRadius: 8, cursor: 'pointer',
                            background: selectedBlockId === block.id 
                                ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(79,70,229,0.1))' 
                                : hoveredId === block.id ? 'rgba(51,65,85,0.5)' : 'transparent',
                            border: selectedBlockId === block.id ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                            transition: 'all 0.15s',
                        }}
                    >
                        {/* Drag Handle */}
                        <div style={{ color: hoveredId === block.id || selectedBlockId === block.id ? '#64748b' : 'transparent', display: 'flex' }}>
                            <svg width="10" height="14" viewBox="0 0 8 16" fill="currentColor">
                                <circle cx="2" cy="3" r="1.2"/><circle cx="6" cy="3" r="1.2"/>
                                <circle cx="2" cy="8" r="1.2"/><circle cx="6" cy="8" r="1.2"/>
                                <circle cx="2" cy="13" r="1.2"/><circle cx="6" cy="13" r="1.2"/>
                            </svg>
                        </div>

                        {/* Icon */}
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                        </div>
                        
                        {/* Label */}
                        <span style={{ fontSize: 13, fontWeight: selectedBlockId === block.id ? 600 : 500, color: selectedBlockId === block.id ? '#818cf8' : '#e2e8f0', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {block.name || block.type || 'Unnamed Section'}
                        </span>
                    </div>
                ))}

                {/* Add Section Button */}
                <button
                    style={{
                        width: '100%', height: 44, marginTop: 12,
                        border: '1px dashed #4f46e5', borderRadius: 8,
                        background: 'rgba(79,70,229,0.05)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontSize: 13, fontWeight: 600, color: '#818cf8',
                        transition: 'all 0.2s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.1)'; e.currentTarget.style.borderColor = '#6366f1'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.05)'; e.currentTarget.style.borderColor = '#4f46e5'; }}
                >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/></svg>
                    Add Section
                </button>
            </div>
        </aside>
    );
}
