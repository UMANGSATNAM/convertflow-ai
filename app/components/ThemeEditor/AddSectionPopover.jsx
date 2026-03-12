/**
 * AddSectionPopover.jsx — PREMIUM SECTION PICKER
 * ═══════════════════════════════════════════════════════════════
 *
 * This is the Phase 3 "killer feature" — a Shopify-style popover
 * that appears when the merchant clicks "+ Add section" or "Swap".
 *
 * Features:
 *  ✅ Category tabs on the left (scrollable)
 *  ✅ Section cards on the right with search
 *  ✅ Hover flyout preview box (200ms delay, fades in)
 *  ✅ Context-aware filtering (swap vs insert vs add)
 *  ✅ Keyboard navigation (Esc to close)
 *  ✅ Smooth open/close animations
 *  ✅ Click-outside to dismiss
 *
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import useEditorStore, {
    selectCategories, selectInsertTargetId,
    selectSwapTargetId, selectActiveTab,
} from './useEditorStore';
import { getSectionsByCategory, SECTION_CATEGORIES, SECTION_FILES } from '../../lib/constants';
import { PAGE_TEMPLATES } from '../../lib/page-templates';

// ── Category icons (inline SVGs for zero dependencies) ───────
const CATEGORY_ICONS = {
    'cro-home': '🎯', 'cro-product': '🛒', header: '📐', marquee: '📢',
    promo: '🖼️', snack: '🏷️', category: '📦', feature: '🛍️',
    trust: '🛡️', announcement: '📣', hero: '🌟', footer: '🦶',
};

const CATEGORY_COLORS = {
    'cro-home': '#ef4444', 'cro-product': '#f97316', header: '#8b5cf6',
    marquee: '#06b6d4', promo: '#3b82f6', snack: '#10b981',
    category: '#6366f1', feature: '#ec4899', trust: '#14b8a6',
    announcement: '#eab308', hero: '#7c3aed', footer: '#6b7280',
};

// ═══════════════════════════════════════════════════════════════
//  HOVER PREVIEW BOX (floats next to hovered item)
// ═══════════════════════════════════════════════════════════════
function HoverPreviewBox({ sectionId, sectionName, category, anchorRect, containerRect }) {
    if (!sectionId || !anchorRect || !containerRect) return null;

    // Position the preview box to the right of the popover
    const top = Math.max(8, Math.min(anchorRect.top - containerRect.top - 20, containerRect.height - 220));
    const color = CATEGORY_COLORS[category] || '#6b7280';

    return (
        <div style={{
            position: 'absolute',
            top,
            left: '100%',
            marginLeft: 12,
            width: 280,
            background: '#fff',
            borderRadius: 14,
            border: '1px solid #e5e7eb',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            animation: 'cfPopIn 0.2s ease',
            zIndex: 200,
            pointerEvents: 'none',
        }}>
            {/* Preview placeholder with gradient */}
            <div style={{
                height: 140,
                background: `linear-gradient(135deg, ${color}15, ${color}30)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderBottom: '1px solid #f3f4f6',
            }}>
                <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `linear-gradient(135deg, ${color}20, ${color}40)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                }}>
                    {CATEGORY_ICONS[category] || '📦'}
                </div>
                <span style={{ fontSize: 11, color: color, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Preview
                </span>
            </div>

            {/* Info strip */}
            <div style={{ padding: '12px 16px' }}>
                <h4 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#111827' }}>{sectionName}</h4>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
                    {SECTION_CATEGORIES.find(c => c.id === category)?.description || 'ConvertFlow section'}
                </p>
                <div style={{
                    marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 10px', background: '#f9fafb', borderRadius: 8,
                }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 500 }}>Click to add to your page</span>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
//  SECTION CARD (individual item in the grid)
// ═══════════════════════════════════════════════════════════════
function SectionCard({ section, isSwapMode, onAdd, onHover, onLeave, isHovered }) {
    const color = CATEGORY_COLORS[section.category] || '#6b7280';

    return (
        <div
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onClick={() => onAdd(section.id)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 10,
                cursor: 'pointer',
                background: isHovered ? `${color}08` : 'transparent',
                border: isHovered ? `1.5px solid ${color}30` : '1.5px solid transparent',
                transition: 'all 0.15s',
            }}
        >
            {/* Icon */}
            <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: `linear-gradient(135deg, ${color}15, ${color}25)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 14, transition: 'transform 0.15s',
                transform: isHovered ? 'scale(1.08)' : 'scale(1)',
            }}>
                {CATEGORY_ICONS[section.category] || '📦'}
            </div>

            {/* Name + niche tag */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: 12.5, fontWeight: 600, color: '#1f2937',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {section.name}
                </div>
            </div>

            {/* Add button (visible on hover) */}
            <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: isHovered ? color : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.15s',
            }}>
                <svg width="12" height="12" viewBox="0 0 20 20" fill={isHovered ? '#fff' : 'transparent'}>
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/>
                </svg>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN POPOVER COMPONENT
// ═══════════════════════════════════════════════════════════════
export function AddSectionPopover({ open, onClose, mode = 'add' }) {
    const categories      = useEditorStore(selectCategories);
    const insertTargetId  = useEditorStore(selectInsertTargetId);
    const swapTargetId    = useEditorStore(selectSwapTargetId);
    const addSection      = useEditorStore(s => s.addSection);
    const insertSection   = useEditorStore(s => s.insertSection);
    const swapSection     = useEditorStore(s => s.swapSection);
    const setActiveTab    = useEditorStore(s => s.setActiveTab);
    const setInsertTargetId = useEditorStore(s => s.setInsertTargetId);
    const setSwapTargetId = useEditorStore(s => s.setSwapTargetId);

    const [activeCat, setActiveCat] = useState(null);
    const [search, setSearch] = useState('');
    const [hoveredSection, setHoveredSection] = useState(null);
    const [hoverRect, setHoverRect] = useState(null);
    const hoverTimerRef = useRef(null);
    const containerRef = useRef(null);
    const searchRef = useRef(null);

    const isSwapMode = mode === 'swap';

    // Auto-focus search on open
    useEffect(() => {
        if (open) {
            setSearch('');
            setActiveCat(null);
            setHoveredSection(null);
            setTimeout(() => searchRef.current?.focus(), 100);
        }
    }, [open]);

    // Esc to close
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    // Click outside to close
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open, onClose]);

    // All sections, filtered
    const allSections = useMemo(() => {
        if (activeCat) return getSectionsByCategory(activeCat);
        // Show all sections when no category selected
        return Object.entries(SECTION_FILES).map(([id, meta]) => ({ id, ...meta }));
    }, [activeCat]);

    const filtered = useMemo(() => {
        if (!search.trim()) return allSections;
        const q = search.toLowerCase();
        return allSections.filter(s =>
            s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
        );
    }, [allSections, search]);

    // Hover handlers (200ms delay)
    const handleHover = useCallback((section, e) => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        const rect = e.currentTarget.getBoundingClientRect();
        hoverTimerRef.current = setTimeout(() => {
            setHoveredSection(section);
            setHoverRect(rect);
        }, 200);
    }, []);

    const handleLeave = useCallback(() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        setHoveredSection(null);
        setHoverRect(null);
    }, []);

    // Add/swap/insert handler
    const handleAdd = useCallback((sectionId) => {
        if (isSwapMode && swapTargetId) {
            swapSection(swapTargetId, sectionId);
        } else if (insertTargetId) {
            insertSection(sectionId, insertTargetId);
        } else {
            addSection(sectionId);
        }
        setInsertTargetId(null);
        setSwapTargetId(null);
        onClose();
    }, [isSwapMode, swapTargetId, insertTargetId, addSection, insertSection, swapSection, setInsertTargetId, setSwapTargetId, onClose]);

    if (!open) return null;

    const catList = Array.isArray(categories) ? categories : (categories ? Object.values(categories) : SECTION_CATEGORIES);

    return (
        <>
            {/* Backdrop */}
            <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
                backdropFilter: 'blur(3px)', zIndex: 999,
                animation: 'cfFadeIn 0.15s ease',
            }} onClick={onClose} />

            {/* Popover container */}
            <div ref={containerRef} style={{
                position: 'fixed',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 680, maxHeight: '80vh',
                background: '#fff',
                borderRadius: 18,
                border: '1px solid #e5e7eb',
                boxShadow: '0 25px 80px rgba(0,0,0,0.2), 0 8px 30px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 1000,
                animation: 'cfSlideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
            }}>
                {/* HEADER */}
                <div style={{
                    padding: '16px 20px 12px',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex', alignItems: 'center', gap: 12,
                }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: isSwapMode
                            ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                            : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        {isSwapMode ? (
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="#fff"><path d="M13.28 7.78l3.22-3.22v2.69a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.69l-3.22 3.22a.75.75 0 001.06 1.06zM2 17.25v-4.5a.75.75 0 011.5 0v2.69l3.22-3.22a.75.75 0 011.06 1.06L4.56 16.5h2.69a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z"/></svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="#fff"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/></svg>
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>
                            {isSwapMode ? 'Swap Section' : insertTargetId ? 'Insert Section' : 'Add Section'}
                        </h3>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>
                            {isSwapMode ? 'Choose a replacement section' : `${Object.keys(SECTION_FILES).length}+ premade sections available`}
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        width: 30, height: 30, border: '1px solid #e5e7eb', borderRadius: 8,
                        background: '#fff', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: '#9ca3af',
                        flexShrink: 0, transition: 'all 0.15s',
                    }}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/></svg>
                    </button>
                </div>

                {/* SEARCH BAR */}
                <div style={{ padding: '10px 20px', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ position: 'relative' }}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd"/>
                        </svg>
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search sections by name or category…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '9px 12px 9px 36px',
                                fontSize: 13, fontWeight: 500,
                                border: '1.5px solid #e5e7eb',
                                borderRadius: 10,
                                outline: 'none',
                                fontFamily: 'inherit',
                                color: '#1f2937',
                                transition: 'border-color 0.15s',
                            }}
                            onFocus={e => e.target.style.borderColor = '#a5b4fc'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                style={{
                                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                    width: 20, height: 20, border: 'none', borderRadius: 5,
                                    background: '#f3f4f6', cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', color: '#9ca3af',
                                }}
                            >
                                <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/></svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* BODY: Categories + Sections side-by-side */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>

                    {/* LEFT: Category tabs */}
                    <div style={{
                        width: 185, flexShrink: 0, borderRight: '1px solid #f3f4f6',
                        overflowY: 'auto', padding: '8px 6px',
                    }}>
                        {/* All sections tab */}
                        <button
                            onClick={() => setActiveCat(null)}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                padding: '7px 10px', border: 'none', borderRadius: 8,
                                cursor: 'pointer', textAlign: 'left',
                                background: !activeCat ? '#eef2ff' : 'transparent',
                                color: !activeCat ? '#4f46e5' : '#6b7280',
                                fontWeight: !activeCat ? 700 : 500,
                                fontSize: 12, fontFamily: 'inherit',
                                transition: 'all 0.12s',
                            }}
                        >
                            <span style={{ fontSize: 14 }}>✨</span>
                            <span>All Sections</span>
                            <span style={{
                                marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                                background: !activeCat ? '#4f46e5' : '#e5e7eb',
                                color: !activeCat ? '#fff' : '#9ca3af',
                                padding: '1px 7px', borderRadius: 20,
                            }}>{Object.keys(SECTION_FILES).length}</span>
                        </button>

                        <div style={{ height: 1, background: '#f3f4f6', margin: '6px 8px' }} />

                        {catList.map(cat => {
                            const catId = cat.id || cat;
                            const catName = cat.name || catId;
                            const catCount = cat.count || 0;
                            const isActive = activeCat === catId;
                            const color = CATEGORY_COLORS[catId] || '#6b7280';

                            return (
                                <button
                                    key={catId}
                                    onClick={() => setActiveCat(catId)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '7px 10px', border: 'none', borderRadius: 8,
                                        cursor: 'pointer', textAlign: 'left',
                                        background: isActive ? `${color}12` : 'transparent',
                                        fontWeight: isActive ? 700 : 500,
                                        fontSize: 12, fontFamily: 'inherit',
                                        color: isActive ? color : '#6b7280',
                                        transition: 'all 0.12s',
                                    }}
                                >
                                    <span style={{ fontSize: 13 }}>{CATEGORY_ICONS[catId] || '📦'}</span>
                                    <span style={{
                                        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>{catName.replace(/^[🎯🛒📐📢🖼️🏷️📦🛍️🛡️📣🌟🦶]\s*/, '')}</span>
                                    {catCount > 0 && (
                                        <span style={{
                                            fontSize: 10, fontWeight: 700,
                                            background: isActive ? color : '#e5e7eb',
                                            color: isActive ? '#fff' : '#9ca3af',
                                            padding: '1px 6px', borderRadius: 20,
                                        }}>{catCount}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* RIGHT: Section list */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
                        {filtered.length === 0 ? (
                            <div style={{
                                padding: '40px 20px', textAlign: 'center',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                            }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round">
                                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                                </svg>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#9ca3af' }}>No sections found</p>
                                <p style={{ margin: 0, fontSize: 12, color: '#d1d5db' }}>Try a different search or category</p>
                            </div>
                        ) : (
                            <>
                                {/* Results count */}
                                <div style={{
                                    padding: '4px 10px 8px', display: 'flex',
                                    alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>
                                        {search ? `${filtered.length} results` : `${filtered.length} sections`}
                                    </span>
                                </div>

                                {/* Section cards */}
                                {filtered.map(section => (
                                    <SectionCard
                                        key={section.id}
                                        section={section}
                                        isSwapMode={isSwapMode}
                                        onAdd={handleAdd}
                                        isHovered={hoveredSection?.id === section.id}
                                        onHover={(e) => handleHover(section, e)}
                                        onLeave={handleLeave}
                                    />
                                ))}
                            </>
                        )}
                    </div>

                    {/* FLYOUT PREVIEW (positioned to the right of the popover) */}
                    {hoveredSection && hoverRect && containerRef.current && (
                        <HoverPreviewBox
                            sectionId={hoveredSection.id}
                            sectionName={hoveredSection.name}
                            category={hoveredSection.category}
                            anchorRect={hoverRect}
                            containerRect={containerRef.current.getBoundingClientRect()}
                        />
                    )}
                </div>

                {/* FOOTER */}
                <div style={{
                    padding: '10px 20px', borderTop: '1px solid #f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>
                            Hover to preview · Click to {isSwapMode ? 'swap' : 'add'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <kbd style={{ fontSize: 9, fontFamily: 'monospace', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 4, padding: '2px 5px', color: '#9ca3af' }}>ESC</kbd>
                        <span style={{ fontSize: 10, color: '#d1d5db' }}>to close</span>
                    </div>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes cfFadeIn   { from { opacity: 0 } to { opacity: 1 } }
                @keyframes cfSlideUp  { from { opacity: 0; transform: translate(-50%, -48%) scale(0.96) } to { opacity: 1; transform: translate(-50%, -50%) scale(1) } }
                @keyframes cfPopIn    { from { opacity: 0; transform: translateX(-4px) scale(0.97) } to { opacity: 1; transform: translateX(0) scale(1) } }
            `}</style>
        </>
    );
}
