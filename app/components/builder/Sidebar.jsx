import React, { useState } from 'react';
import { Layout, Palette, ChevronRight, X, Image as ImageIcon, MessageSquare, Grid, Award, Type, Mail, Camera, Play, HelpCircle, Zap, ShoppingBag, Megaphone } from "lucide-react";
import { SECTION_FILES } from '../../lib/constants';

const SVG_ICONS = {
    layout: <Layout size={14} />,
    announcement: <Megaphone size={14} />,
    image: <ImageIcon size={14} />,
    shoppingBag: <ShoppingBag size={14} />,
    grid: <Grid size={14} />,
    message: <MessageSquare size={14} />,
    award: <Award size={14} />,
    type: <Type size={14} />,
    mail: <Mail size={14} />,
    camera: <Camera size={14} />,
    play: <Play size={14} />,
    help: <HelpCircle size={14} />,
    zap: <Zap size={14} />,
    default: <Layout size={14} />
};

const CAT_SVG = {
    header: SVG_ICONS.layout,
    announcement: SVG_ICONS.announcement,
    hero: SVG_ICONS.image,
    product: SVG_ICONS.shoppingBag,
    collection: SVG_ICONS.grid,
    testimonial: SVG_ICONS.message,
    brand: SVG_ICONS.award,
    content: SVG_ICONS.type,
    newsletter: SVG_ICONS.mail,
    social: SVG_ICONS.camera,
    video: SVG_ICONS.play,
    faq: SVG_ICONS.help,
    banner: SVG_ICONS.zap,
    footer: SVG_ICONS.layout,
    default: SVG_ICONS.default
};

export function Sidebar({ 
    blocks = [], 
    categories = [],
    activeTab, 
    setActiveTab,
    activeBlockId, 
    setActiveBlockId,
    activeCategoryId,
    setActiveCategoryId,
    selectedTemplateId,
    setSelectedTemplateId,
    onRemoveBlock
}) {
    const [expandedCategories, setExpandedCategories] = useState({});

    const toggleCategory = (cat) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    // Filter themes to only show CF categories
    const cfCats = categories || [];

    return (
        <div style={{
            width: '100%', height: '100%',
            background: '#ffffff',
            display: 'flex', flexShrink: 0, overflow: 'hidden'
        }}>
            {/* ─── LEFT MINI RAIL ─── */}
            <div style={{
                width: 48, background: '#ffffff', borderRight: '1px solid #e5e7eb',
                display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 16
            }}>
                <button 
                    onClick={() => setActiveTab('elements')}
                    style={{ background: activeTab === 'elements' ? '#eef2ff' : 'transparent', color: activeTab === 'elements' ? '#4f46e5' : '#9ca3af', border: 'none', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </button>
                <button 
                    onClick={() => setActiveTab('page')}
                    style={{ background: activeTab === 'page' ? '#eef2ff' : 'transparent', color: activeTab === 'page' ? '#4f46e5' : '#9ca3af', border: 'none', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
                </button>
            </div>

            {/* ─── MAIN SIDEBAR AREA ─── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                
                {/* Header & Search */}
                <div style={{ padding: '16px 16px 12px' }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>
                        {activeTab === 'elements' ? 'Add Elements' : 'Page Outline'}
                    </h3>
                    
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
                            Library
                        </button>
                        <button 
                            onClick={() => setActiveTab('page')}
                            style={{ 
                                flex: 1, padding: '6px 0', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 4, cursor: 'pointer',
                                background: activeTab === 'page' ? '#ffffff' : 'transparent',
                                color: activeTab === 'page' ? '#111827' : '#6b7280',
                                boxShadow: activeTab === 'page' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                            }}
                        >
                            Page <span style={{ background: '#e5e7eb', color: '#4b5563', padding: '1px 6px', borderRadius: 10, fontSize: 10, marginLeft: 4 }}>{blocks.length}</span>
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 20px', fontSize: 13, color: '#374151' }}>
                    {activeTab === 'page' && (
                        <div style={{ padding: '8px 16px' }}>
                            {blocks.length === 0 && <div style={{ color: '#9ca3af', textAlign: 'center', marginTop: 20 }}>No elements on page</div>}
                            {blocks.map((block) => {
                                const isActive = block.id === activeBlockId;
                                const label = block.isCf ? (SECTION_FILES[block.type]?.name || block.type) : block.type;
                                return (
                                    <div 
                                        key={block.id}
                                        onClick={() => {
                                            setActiveBlockId(block.id);
                                            setSelectedTemplateId(null);
                                        }}
                                        style={{ 
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                                            background: isActive ? '#eef2ff' : 'transparent',
                                            color: isActive ? '#4f46e5' : '#374151',
                                            fontWeight: isActive ? 500 : 400,
                                            marginBottom: 2
                                        }}
                                        onMouseOver={e => { if(!isActive) e.currentTarget.style.background = '#f9fafb' }}
                                        onMouseOut={e => { if(!isActive) e.currentTarget.style.background = 'transparent' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ color: isActive ? '#4f46e5' : '#9ca3af', display: 'flex' }}>
                                                {block.isCf ? <Palette size={14} /> : <Layout size={14} />}
                                            </span>
                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160, textTransform: 'capitalize' }}>
                                                {label.replace(/[-_]/g, ' ')}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onRemoveBlock(block.id); }}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2, display: 'flex', opacity: isActive ? 1 : 0.5 }}
                                            title="Remove section"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'elements' && (
                        <div>
                            {cfCats.map(cat => {
                                const isExpanded = expandedCategories[cat.id];
                                const templates = Object.entries(SECTION_FILES).filter(([_, m]) => m.category === cat.id);
                                
                                return (
                                    <div key={cat.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                                        <button 
                                            onClick={() => toggleCategory(cat.id)}
                                            style={{ width: '100%', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', fontSize: 12, fontWeight: 600, color: '#111827', cursor: 'pointer' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ color: '#6b7280', display: 'flex' }}>{CAT_SVG[cat.id] || CAT_SVG.default}</span>
                                                {cat.name}
                                            </div>
                                            <svg style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#9ca3af' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                                        </button>
                                        
                                        {isExpanded && (
                                            <div style={{ padding: '0 8px 8px' }}>
                                                {templates.map(([id, meta]) => {
                                                    const isSelected = selectedTemplateId === id;
                                                    return (
                                                        <div 
                                                            key={id} 
                                                            onClick={() => {
                                                                setSelectedTemplateId(id);
                                                                setActiveBlockId(null);
                                                            }}
                                                            style={{ 
                                                                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 2,
                                                                background: isSelected ? '#eef2ff' : 'transparent',
                                                                color: isSelected ? '#4f46e5' : '#374151',
                                                                fontWeight: isSelected ? 500 : 400
                                                            }} 
                                                            onMouseOver={e => { if(!isSelected) e.currentTarget.style.background = '#f9fafb' }} 
                                                            onMouseOut={e => { if(!isSelected) e.currentTarget.style.background = 'transparent' }}
                                                        >
                                                            <span style={{ color: isSelected ? '#4f46e5' : '#9ca3af', display: 'flex' }}>
                                                                <Palette size={14} />
                                                            </span>
                                                            {meta.name}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
