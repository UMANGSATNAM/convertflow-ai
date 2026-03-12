import React, { useState } from 'react';

export function Sidebar({ blocks = [], selectedBlockId, onSelectBlock }) {
    const [hoveredId, setHoveredId] = useState(null);
    const [activeTab, setActiveTab] = useState('elements'); // 'elements' or 'shopify'
    const [expandedCategories, setExpandedCategories] = useState({ 'media': true, 'advanced': true, 'social': true });

    const toggleCategory = (cat) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    return (
        <aside style={{
            width: 310, minWidth: 310, height: '100%',
            background: '#ffffff', borderRight: '1px solid #e5e7eb',
            display: 'flex', flexShrink: 0, overflow: 'hidden'
        }}>
            {/* ─── LEFT MINI RAIL ─── */}
            <div style={{
                width: 48, background: '#ffffff', borderRight: '1px solid #e5e7eb',
                display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 16
            }}>
                <button style={{ background: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </button>
                <button style={{ background: 'transparent', color: '#9ca3af', border: 'none', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
                </button>
                <button style={{ background: 'transparent', color: '#9ca3af', border: 'none', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </button>
            </div>

            {/* ─── MAIN SIDEBAR AREA ─── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header & Search */}
                <div style={{ padding: '16px 16px 12px' }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Elements</h3>
                    
                    <div style={{ position: 'relative', marginBottom: 16 }}>
                        <svg style={{ position: 'absolute', left: 10, top: 8, color: '#9ca3af' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input 
                            type="text" 
                            placeholder="Search" 
                            style={{ 
                                width: '100%', height: 32, paddingLeft: 32, paddingRight: 10, 
                                background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, 
                                fontSize: 13, color: '#111827', outline: 'none' 
                            }} 
                        />
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 6, padding: 2 }}>
                        <button 
                            onClick={() => setActiveTab('elements')}
                            style={{ 
                                flex: 1, padding: '6px 0', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 4, cursor: 'pointer',
                                background: activeTab === 'elements' ? '#ffffff' : 'transparent',
                                color: activeTab === 'elements' ? '#111827' : '#6b7280',
                                boxShadow: activeTab === 'elements' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                            }}
                        >
                            AppMate <span style={{ background: '#e5e7eb', color: '#4b5563', padding: '1px 6px', borderRadius: 10, fontSize: 10, marginLeft: 4 }}>29</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('shopify')}
                            style={{ 
                                flex: 1, padding: '6px 0', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 4, cursor: 'pointer',
                                background: activeTab === 'shopify' ? '#ffffff' : 'transparent',
                                color: activeTab === 'shopify' ? '#111827' : '#6b7280',
                                boxShadow: activeTab === 'shopify' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                            }}
                        >
                            Shopify <span style={{ background: '#e5e7eb', color: '#4b5563', padding: '1px 6px', borderRadius: 10, fontSize: 10, marginLeft: 4 }}>37</span>
                        </button>
                    </div>
                </div>

                {/* Elements Accordion List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 20px', fontSize: 13, color: '#374151' }}>
                    
                    {/* Basic Layout (Divider) */}
                    <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><line x1="4" y1="12" x2="20" y2="12"/></svg>
                        Divider
                    </div>

                    {/* Category: Media */}
                    <div style={{ borderTop: '1px solid #f3f4f6' }}>
                        <button 
                            onClick={() => toggleCategory('media')}
                            style={{ width: '100%', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', fontSize: 12, fontWeight: 600, color: '#111827', cursor: 'pointer' }}
                        >
                            Media
                            <svg style={{ transform: expandedCategories['media'] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#9ca3af' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        {expandedCategories['media'] && (
                            <div style={{ padding: '0 8px 8px' }}>
                                {[
                                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>, label: 'Image' },
                                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>, label: 'YouTube video' },
                                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>, label: 'Vimeo video' },
                                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>, label: 'HTML video' },
                                ].map(item => (
                                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 2 }} 
                                         onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                        <span style={{ color: '#6b7280', display: 'flex' }}>{item.icon}</span>
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Category: Advanced */}
                    <div style={{ borderTop: '1px solid #f3f4f6' }}>
                        <button 
                            onClick={() => toggleCategory('advanced')}
                            style={{ width: '100%', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', fontSize: 12, fontWeight: 600, color: '#111827', cursor: 'pointer' }}
                        >
                            Advanced
                            <svg style={{ transform: expandedCategories['advanced'] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#9ca3af' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        {expandedCategories['advanced'] && (
                            <div style={{ padding: '0 8px 8px' }}>
                                {[
                                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, label: 'QRCODE', active: true },
                                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>, label: 'Table' },
                                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, label: 'Countdown' },
                                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, label: 'Google Map' },
                                ].map(item => (
                                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 2, background: item.active ? '#e5e7eb' : 'transparent', fontWeight: item.active ? 600 : 400 }} 
                                         onMouseOver={e => { if(!item.active) e.currentTarget.style.background = '#f3f4f6' }} onMouseOut={e => { if(!item.active) e.currentTarget.style.background = 'transparent' }}>
                                        <span style={{ color: '#6b7280', display: 'flex' }}>{item.icon}</span>
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Category: Social */}
                    <div style={{ borderTop: '1px solid #f3f4f6' }}>
                        <button 
                            onClick={() => toggleCategory('social')}
                            style={{ width: '100%', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', fontSize: 12, fontWeight: 600, color: '#111827', cursor: 'pointer' }}
                        >
                            Social
                            <svg style={{ transform: expandedCategories['social'] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#9ca3af' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        {expandedCategories['social'] && (
                            <div style={{ padding: '0 8px 8px' }}>
                                {[
                                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>, label: 'Instagram feed' },
                                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>, label: 'Facebook like & share' },
                                ].map(item => (
                                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 2 }} 
                                         onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                        <span style={{ color: '#6b7280', display: 'flex' }}>{item.icon}</span>
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </aside>
    );
}
