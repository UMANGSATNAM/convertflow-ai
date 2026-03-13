import React, { useState, useEffect, useRef } from 'react';
import { Layout, Palette, X, Image as ImageIcon, MessageSquare, Grid, Award, Type, Mail, Camera, Play, HelpCircle, Zap, ShoppingBag, Megaphone, Eye } from "lucide-react";
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
    activeBlockId, 
    setActiveBlockId,
    selectedTemplateId,
    setSelectedTemplateId,
    onInject,
    onAiClick
}) {
    const [expandedCategories, setExpandedCategories] = useState({});
    const [showLibrary, setShowLibrary] = useState(false);
    const popoverRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setShowLibrary(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleCategory = (cat) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    // Filter themes to only show CF categories
    const cfCats = categories || [];

    return (
        <aside style={{
            width: 310, minWidth: 310, height: '100%',
            background: '#ffffff', borderRight: '1px solid #e5e7eb',
            display: 'flex', flexShrink: 0, overflow: 'hidden'
        }}>
            {/* ─── MAIN SIDEBAR AREA ─── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                
                {/* Header */}
                <div style={{ padding: '16px 16px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>
                            Template
                        </h3>
                        <button
                            onClick={onAiClick}
                            title="AI Section Generator"
                            style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', border: 'none', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}
                        >
                            ✨
                        </button>
                    </div>
                </div>

                {/* Section List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 20px', fontSize: 13, color: '#374151', position: 'relative' }}>
                    <div style={{ padding: '0 8px' }}>
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
                                        setShowLibrary(false);
                                    }}
                                    style={{ 
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '8px 8px', borderRadius: 6, cursor: 'pointer',
                                        background: isActive ? '#f3f4f6' : 'transparent',
                                        color: '#374151',
                                        fontWeight: isActive ? 600 : 400,
                                        marginBottom: 2
                                    }}
                                    onMouseOver={e => { if(!isActive) e.currentTarget.style.background = '#f9fafb' }}
                                    onMouseOut={e => { if(!isActive) e.currentTarget.style.background = 'transparent' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ color: '#d1d5db', cursor: 'grab', display: 'flex' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
                                        </div>
                                        <span style={{ color: isActive ? '#4f46e5' : '#9ca3af', display: 'flex' }}>
                                            {block.isCf ? <Palette size={14} /> : <Layout size={14} />}
                                        </span>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160, textTransform: 'capitalize' }}>
                                            {label.replace(/[-_]/g, ' ')}
                                        </span>
                                    </div>
                                    <div style={{ color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                                        <Eye size={14} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Add Section Button */}
                    <div style={{ padding: '16px 20px' }}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowLibrary(prev => !prev); }}
                            style={{ 
                                width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', 
                                background: showLibrary ? '#f3f4f6' : 'transparent', border: '1px solid #e5e7eb', borderRadius: 6, 
                                fontSize: 13, fontWeight: 500, color: '#4f46e5', cursor: 'pointer',
                                transition: 'all 0.15s'
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Add section
                        </button>
                    </div>

                    {/* ─── FLOATING LIBRARY POPOVER ─── */}
                    {showLibrary && (
                        <div 
                            ref={popoverRef}
                            style={{
                                position: 'absolute',
                                left: '100%', top: 32, marginLeft: 8,
                                width: 340, maxHeight: 'calc(100vh - 100px)',
                                background: '#ffffff', borderRadius: 8,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                                zIndex: 9999, overflowY: 'auto', display: 'flex', flexDirection: 'column'
                            }}
                        >
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
                                <div style={{ position: 'relative' }}>
                                    <svg style={{ position: 'absolute', left: 10, top: 10, color: '#9ca3af' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                    <input 
                                        type="text" 
                                        placeholder="Search sections" 
                                        style={{ 
                                            width: '100%', height: 34, paddingLeft: 32, paddingRight: 10, 
                                            background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, 
                                            fontSize: 13, color: '#111827', outline: 'none' 
                                        }} 
                                    />
                                </div>
                            </div>
                            <div style={{ padding: '8px 0' }}>
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
                                                                    setShowLibrary(false);
                                                                    onInject(id); // Immediate Injection
                                                                }}
                                                                style={{ 
                                                                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 2,
                                                                    background: isSelected ? '#f3f4f6' : 'transparent',
                                                                    color: '#374151',
                                                                    fontWeight: isSelected ? 600 : 400
                                                                }} 
                                                                onMouseOver={e => { if(!isSelected) e.currentTarget.style.background = '#f9fafb' }} 
                                                                onMouseOut={e => { if(!isSelected) e.currentTarget.style.background = 'transparent' }}
                                                            >
                                                                <span style={{ color: '#9ca3af', display: 'flex' }}>
                                                                    <Layout size={14} />
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
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
