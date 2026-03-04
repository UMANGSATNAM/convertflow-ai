import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { useState, useCallback, useEffect } from "react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

// ═══════════════════════════════════════════════════════════
// SECTION TYPE REGISTRY — maps theme section types → CF categories
// ═══════════════════════════════════════════════════════════
const SECTION_REGISTRY = [
    { match: ['header', 'nav', 'navigation', 'menu'], label: 'Header / Navigation', category: 'Headers', icon: '☰', color: '#6366f1' },
    { match: ['announcement', 'banner', 'topbar'], label: 'Announcement Bar', category: 'Announcement Bars', icon: '📢', color: '#f59e0b' },
    { match: ['hero', 'slider', 'slideshow', 'carousel'], label: 'Hero Section', category: 'Hero Sections', icon: '⚡', color: '#8b5cf6' },
    { match: ['trust', 'badge', 'guarantee', 'secure'], label: 'Trust Badges', category: 'Trust Badges', icon: '🛡', color: '#10b981' },
    { match: ['feature', 'benefit', 'usp', 'value'], label: 'Features & Benefits', category: 'Features & Benefits', icon: '✨', color: '#3b82f6' },
    { match: ['product', 'featured-product', 'item'], label: 'Product Section', category: 'Product Highlights', icon: '🛍', color: '#ec4899' },
    { match: ['collection', 'grid', 'catalog', 'shop'], label: 'Product Grid', category: 'Product Grid', icon: '🏪', color: '#f97316' },
    { match: ['testimonial', 'review', 'rating', 'social'], label: 'Reviews & Social Proof', category: 'Testimonials', icon: '⭐', color: '#eab308' },
    { match: ['stat', 'metric', 'number', 'counter'], label: 'Stats & Numbers', category: 'Stats & Metrics', icon: '📊', color: '#06b6d4' },
    { match: ['faq', 'accordion', 'question'], label: 'FAQ Section', category: 'FAQ & Accordions', icon: '❔', color: '#a855f7' },
    { match: ['cta', 'promo', 'offer', 'deal', 'sale'], label: 'Call to Action', category: 'Call to Action', icon: '🎯', color: '#ef4444' },
    { match: ['video', 'media', 'youtube', 'embed'], label: 'Video / Media', category: 'Hero Sections', icon: '▶', color: '#64748b' },
    { match: ['footer', 'bottom', 'copyright'], label: 'Footer', category: 'Footers', icon: '⬇', color: '#475569' },
    { match: ['cf-'], label: 'ConvertFlow Section', category: null, icon: '⚙', color: '#6366f1' },
];

// All browsable categories for the full library panel
const ALL_CATEGORIES = [
    { label: 'Announcement Bars', category: 'Announcement Bars', icon: '📢', color: '#f59e0b' },
    { label: 'Headers', category: 'Headers', icon: '☰', color: '#6366f1' },
    { label: 'Hero Sections', category: 'Hero Sections', icon: '⚡', color: '#8b5cf6' },
    { label: 'Trust Badges', category: 'Trust Badges', icon: '🛡', color: '#10b981' },
    { label: 'Features & Benefits', category: 'Features & Benefits', icon: '✨', color: '#3b82f6' },
    { label: 'Product Highlights', category: 'Product Highlights', icon: '🛍', color: '#ec4899' },
    { label: 'Product Grid', category: 'Product Grid', icon: '🏪', color: '#f97316' },
    { label: 'Testimonials', category: 'Testimonials', icon: '⭐', color: '#eab308' },
    { label: 'Stats & Metrics', category: 'Stats & Metrics', icon: '📊', color: '#06b6d4' },
    { label: 'FAQ & Accordions', category: 'FAQ & Accordions', icon: '❔', color: '#a855f7' },
    { label: 'Call to Action', category: 'Call to Action', icon: '🎯', color: '#ef4444' },
    { label: 'Footers', category: 'Footers', icon: '⬇', color: '#475569' },
];

function getRegistry(type) {
    const lower = (type || '').toLowerCase();
    for (const reg of SECTION_REGISTRY) {
        if (reg.match.some(m => lower.includes(m))) return reg;
    }
    return { label: type, category: 'Features & Benefits', icon: '▤', color: '#64748b' };
}

// ═══════════════════════════════════════════════════════════
// LOADER
// ═══════════════════════════════════════════════════════════
export const loader = async ({ request }) => {
    await authenticate.admin(request);
    const allSections = await db.sections.getAll();
    // Group by category
    const byCategory = {};
    for (const s of allSections) {
        if (!byCategory[s.category]) byCategory[s.category] = [];
        byCategory[s.category].push(s);
    }
    return json({ allSections, byCategory });
};

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function LiveBuilder() {
    const { allSections, byCategory } = useLoaderData();
    const fetcher = useFetcher();
    const navigate = useNavigate();

    // Theme state
    const [themeSections, setThemeSections] = useState([]);
    const [themeError, setThemeError] = useState(null);
    const [isLoadingTheme, setIsLoadingTheme] = useState(true);
    const [themeName, setThemeName] = useState('');
    const [activeTemplate, setActiveTemplate] = useState('templates/index.json');

    // Selection state
    const [selectedThemeSection, setSelectedThemeSection] = useState(null); // { id, type, name } from live theme
    const [selectedCategory, setSelectedCategory] = useState(null); // category string for browsing library
    const [hoveredDesign, setHoveredDesign] = useState(null); // CF section being previewed
    const [mode, setMode] = useState('theme'); // 'theme' | 'library'

    // Notification
    const [notification, setNotification] = useState(null);
    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 4000);
    };

    // Load theme on mount
    useEffect(() => {
        loadThemeSections('templates/index.json');
    }, []);

    const loadThemeSections = useCallback((template) => {
        setIsLoadingTheme(true);
        setThemeError(null);
        setSelectedThemeSection(null);
        fetch(`/api/theme-editor?template=${encodeURIComponent(template)}`)
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setThemeSections(data.sections);
                    setThemeName(data.themeName || '');
                } else {
                    setThemeError(data.error || 'Failed to load theme');
                }
            })
            .catch(err => setThemeError(err.message))
            .finally(() => setIsLoadingTheme(false));
    }, []);

    // When a section card in the theme is clicked
    const handleThemeSectionClick = (section) => {
        const reg = getRegistry(section.type);
        setSelectedThemeSection({ ...section, reg });
        setSelectedCategory(reg.category);
        setHoveredDesign(null);
        setMode('theme');
    };

    // When browsing library categories
    const handleCategoryClick = (cat) => {
        setSelectedThemeSection(null);
        setSelectedCategory(cat.category);
        setHoveredDesign(null);
        setMode('library');
    };

    // Apply a design to the theme
    const handleApply = (cfSection) => {
        if (!selectedThemeSection && mode === 'theme') {
            showNotification('Please click a section from your theme first', 'error');
            return;
        }
        const fd = new FormData();
        if (mode === 'theme' && selectedThemeSection) {
            fd.append('_action', 'replace_section');
            fd.append('oldBlockId', selectedThemeSection.id);
            fd.append('newSectionId', cfSection.id);
        } else {
            fd.append('_action', 'add_section');
            fd.append('cfSectionId', cfSection.id);
            fd.append('position', 'end');
        }
        fd.append('template', activeTemplate);
        showNotification(`Applying "${cfSection.name}"...`, 'loading');
        fetcher.submit(fd, { method: 'post', action: '/api/theme-editor' });
    };

    // Watch fetcher result
    useEffect(() => {
        if (fetcher.data && fetcher.state === 'idle') {
            if (fetcher.data.success) {
                showNotification(`✓ ${fetcher.data.message}`);
                loadThemeSections(activeTemplate);
            } else {
                showNotification(fetcher.data.error || 'Failed', 'error');
            }
        }
    }, [fetcher.data, fetcher.state]);

    // Designs to display in center panel
    const designs = selectedCategory ? (byCategory[selectedCategory] || []) : [];

    const iframeDoc = (html) =>
        `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif}svg{display:inline-block;vertical-align:middle}</style></head><body>${html || ''}</body></html>`;

    // Page tabs
    const PAGE_TABS = [
        { key: 'templates/index.json', label: 'Home' },
        { key: 'templates/product.json', label: 'Product Page' },
        { key: 'templates/collection.json', label: 'Collection' },
        { key: 'templates/page.json', label: 'Page' },
        { key: 'templates/cart.json', label: 'Cart' },
    ];

    const handleTabSwitch = (tab) => {
        setActiveTemplate(tab.key);
        loadThemeSections(tab.key);
    };

    return (
        <div style={S.root}>
            {/* ══ TOP BAR ══ */}
            <div style={S.topBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => navigate('/app/builder')} style={S.backBtn}>
                        ← Back
                    </button>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Live Section Builder</div>
                        <div style={{ fontSize: 11, color: '#71717a' }}>{themeName || 'Loading theme...'}</div>
                    </div>
                </div>
                {/* Page tabs */}
                <div style={{ display: 'flex', gap: 4 }}>
                    {PAGE_TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabSwitch(tab)}
                            style={{
                                ...S.pageTab,
                                background: activeTemplate === tab.key ? 'rgba(99,102,241,0.2)' : 'transparent',
                                color: activeTemplate === tab.key ? '#818cf8' : '#71717a',
                                borderColor: activeTemplate === tab.key ? '#6366f1' : 'transparent'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                {/* Library toggle */}
                <button
                    onClick={() => { setMode('library'); setSelectedThemeSection(null); setSelectedCategory(ALL_CATEGORIES[0].category); }}
                    style={S.libraryBtn}
                >
                    + Add from Library
                </button>
            </div>

            <div style={S.body}>
                {/* ══ LEFT: Theme Map ══ */}
                <div style={S.leftPanel}>
                    <div style={S.panelHeader}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#71717a' }}>
                            Your Theme Sections
                        </div>
                        <div style={{ fontSize: 10, color: '#52525b', marginTop: 4 }}>
                            {themeSections.length} sections found · Click to replace
                        </div>
                    </div>

                    {isLoadingTheme && (
                        <div style={S.centerMsg}>
                            <div style={S.spinner} />
                            <div style={{ marginTop: 12, color: '#71717a', fontSize: 12 }}>Loading theme...</div>
                        </div>
                    )}
                    {themeError && (
                        <div style={{ padding: 16, color: '#f87171', fontSize: 12 }}>{themeError}</div>
                    )}
                    {!isLoadingTheme && !themeError && themeSections.map((sec, idx) => {
                        const reg = getRegistry(sec.type);
                        const isActive = selectedThemeSection?.id === sec.id;
                        return (
                            <div
                                key={sec.id}
                                onClick={() => handleThemeSectionClick(sec)}
                                style={{
                                    ...S.themeSectionCard,
                                    borderLeftColor: isActive ? reg.color : 'rgba(255,255,255,0.05)',
                                    background: isActive ? `${reg.color}11` : 'transparent',
                                }}
                            >
                                <div style={{ ...S.sectionIcon, background: `${reg.color}22`, color: reg.color }}>
                                    {reg.icon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#fff' : '#d4d4d8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {reg.label}
                                    </div>
                                    <div style={{ fontSize: 10, color: '#52525b', fontFamily: 'monospace', marginTop: 2 }}>
                                        {sec.type.slice(0, 24)}{sec.type.length > 24 ? '…' : ''}
                                    </div>
                                </div>
                                {isActive && (
                                    <div style={{ fontSize: 9, background: reg.color, color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                        SWAP
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Library category browser */}
                    <div style={{ padding: '16px 12px 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#71717a', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        Browse All Sections
                    </div>
                    {ALL_CATEGORIES.map(cat => {
                        const count = (byCategory[cat.category] || []).length;
                        const isActive = mode === 'library' && selectedCategory === cat.category;
                        return (
                            <div
                                key={cat.category}
                                onClick={() => handleCategoryClick(cat)}
                                style={{
                                    ...S.themeSectionCard,
                                    borderLeftColor: isActive ? cat.color : 'rgba(255,255,255,0.05)',
                                    background: isActive ? `${cat.color}11` : 'transparent',
                                }}
                            >
                                <div style={{ ...S.sectionIcon, background: `${cat.color}22`, color: cat.color }}>
                                    {cat.icon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#fff' : '#d4d4d8' }}>
                                        {cat.label}
                                    </div>
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: cat.color, background: `${cat.color}22`, padding: '2px 6px', borderRadius: 10 }}>
                                    {count}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ══ CENTER: Design Grid ══ */}
                <div style={S.centerPanel}>
                    {!selectedCategory ? (
                        <div style={S.emptyState}>
                            <div style={{ fontSize: 48, marginBottom: 20 }}>👆</div>
                            <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>Click a Section to Replace It</h3>
                            <p style={{ color: '#71717a', fontSize: 13, lineHeight: 1.6, maxWidth: 360, textAlign: 'center' }}>
                                Click any section on the left panel to see 10–20 premium alternative designs you can swap in instantly.
                                Or browse the full library below.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div style={S.centerHeader}>
                                <div>
                                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>
                                        {mode === 'theme' && selectedThemeSection
                                            ? `Replace: ${getRegistry(selectedThemeSection.type).label}`
                                            : `Add: ${ALL_CATEGORIES.find(c => c.category === selectedCategory)?.label}`}
                                    </h2>
                                    <p style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>
                                        {designs.length} premium designs — hover to preview, click Apply to install
                                    </p>
                                </div>
                            </div>

                            {designs.length === 0 ? (
                                <div style={{ ...S.emptyState, flex: 1 }}>
                                    <div style={{ fontSize: 32, marginBottom: 12 }}>🔧</div>
                                    <p style={{ color: '#71717a', fontSize: 13 }}>
                                        No designs yet for this category.<br />
                                        Sections are being added regularly!
                                    </p>
                                </div>
                            ) : (
                                <div style={S.designGrid}>
                                    {designs.map(sec => {
                                        const isHovered = hoveredDesign?.id === sec.id;
                                        return (
                                            <div
                                                key={sec.id}
                                                onMouseEnter={() => setHoveredDesign(sec)}
                                                onMouseLeave={() => setHoveredDesign(null)}
                                                style={{
                                                    ...S.designCard,
                                                    borderColor: isHovered ? '#6366f1' : 'rgba(255,255,255,0.07)',
                                                    transform: isHovered ? 'translateY(-4px)' : 'none',
                                                    boxShadow: isHovered ? '0 20px 40px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.2)',
                                                }}
                                            >
                                                {/* Thumbnail */}
                                                <div style={S.designThumb}>
                                                    {sec.html_code ? (
                                                        <iframe
                                                            srcDoc={iframeDoc(sec.html_code)}
                                                            style={S.thumbIframe}
                                                            sandbox="allow-same-origin"
                                                            title={sec.name}
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div style={S.thumbPlaceholder}>
                                                            <span style={{ fontSize: 32, opacity: 0.3 }}>▤</span>
                                                        </div>
                                                    )}
                                                    {isHovered && (
                                                        <div style={S.thumbOverlay}>
                                                            <button
                                                                onClick={() => handleApply(sec)}
                                                                disabled={fetcher.state !== 'idle'}
                                                                style={S.applyBtn}
                                                            >
                                                                {fetcher.state !== 'idle' ? 'Applying...' : '✓ Apply to Theme'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Footer */}
                                                <div style={S.designFooter}>
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e4e4e7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {sec.name}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                                        <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>
                                                            {sec.conversion_score || 85}% CV
                                                        </span>
                                                        <span style={{ fontSize: 10, color: '#52525b' }}>·</span>
                                                        <span style={{ fontSize: 10, color: '#71717a' }}>v{sec.variation_number}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ══ RIGHT: Live Preview ══ */}
                <div style={S.rightPanel}>
                    <div style={S.panelHeader}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#71717a' }}>Live Preview</div>
                    </div>
                    {hoveredDesign ? (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f5' }}>{hoveredDesign.name}</div>
                                <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>{hoveredDesign.category}</div>
                            </div>
                            <div style={{ flex: 1, background: '#fff', overflow: 'hidden' }}>
                                <iframe
                                    srcDoc={iframeDoc(hoveredDesign.html_code)}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                    sandbox="allow-same-origin"
                                    title="Full preview"
                                />
                            </div>
                            <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <button
                                    onClick={() => handleApply(hoveredDesign)}
                                    disabled={fetcher.state !== 'idle'}
                                    style={{ ...S.applyBtn, width: '100%', borderRadius: 10, padding: '12px 0', fontSize: 14 }}
                                >
                                    {mode === 'theme' && selectedThemeSection ? '✓ Replace Section' : '+ Add to Theme'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={S.emptyState}>
                            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>👁</div>
                            <p style={{ color: '#52525b', fontSize: 12, textAlign: 'center' }}>
                                Hover over a design to see the full preview here
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ══ Toast ══ */}
            {notification && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                    padding: '14px 24px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                    color: '#fff', display: 'flex', alignItems: 'center', gap: 10,
                    background: notification.type === 'success' ? '#059669'
                        : notification.type === 'error' ? '#dc2626' : '#2563eb',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    {notification.msg}
                </div>
            )}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const S = {
    root: { background: '#09090b', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" },

    topBar: {
        height: 56, background: '#111114', borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
        flexShrink: 0, gap: 16
    },
    backBtn: { padding: '6px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
    pageTab: { padding: '5px 14px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s' },
    libraryBtn: { padding: '7px 18px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' },

    body: { display: 'flex', flex: 1, overflow: 'hidden' },

    leftPanel: { width: 240, background: '#0e0e12', borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', flexShrink: 0 },
    panelHeader: { padding: '16px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)' },

    themeSectionCard: {
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
        borderLeft: '3px solid transparent', cursor: 'pointer', transition: 'all 0.15s'
    },
    sectionIcon: { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 },

    centerPanel: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#09090b' },
    centerHeader: { padding: '24px 28px 16px', flexShrink: 0 },
    emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 },

    designGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16, padding: '8px 28px 28px' },
    designCard: { background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s', position: 'relative' },
    designThumb: { height: 160, overflow: 'hidden', position: 'relative', background: '#1a1a2e' },
    thumbIframe: { width: '200%', height: '200%', border: 'none', transform: 'scale(0.5)', transformOrigin: 'top left', pointerEvents: 'none' },
    thumbPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    thumbOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    applyBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' },
    designFooter: { padding: '10px 14px' },

    rightPanel: { width: 320, background: '#0e0e12', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', flexShrink: 0 },

    centerMsg: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, flex: 1 },
    spinner: { width: 28, height: 28, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};
