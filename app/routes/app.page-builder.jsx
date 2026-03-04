import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate, useSearchParams } from "@remix-run/react";
import { useState, useEffect, useRef } from "react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════
const PAGE_TYPES = [
    { key: 'home', label: 'Home Page', icon: '🏠', template: 'templates/index.json' },
    { key: 'product', label: 'Product Page', icon: '🛍', template: 'templates/product.json' },
    { key: 'collection', label: 'Collection Page', icon: '🏪', template: 'templates/collection.json' },
    { key: 'blog', label: 'Blog Page', icon: '✏️', template: 'templates/blog.json' },
    { key: 'cart', label: 'Cart Page', icon: '🛒', template: 'templates/cart.json' },
    { key: 'about', label: 'About Page', icon: '👋', template: 'templates/page.json' },
    { key: 'contact', label: 'Contact Page', icon: '📩', template: 'templates/page.contact.json' },
];

// Section categories relevant to each page type
const PAGE_CATEGORIES = {
    home: ['Announcement Bars', 'Headers', 'Hero Sections', 'Trust Badges', 'Features & Benefits', 'Product Highlights', 'Testimonials', 'Stats & Metrics', 'Call to Action', 'Footers'],
    product: ['Hero Sections', 'Product Highlights', 'Trust Badges', 'Testimonials', 'FAQ & Accordions', 'Urgency Tools', 'Call to Action'],
    collection: ['Headers', 'Hero Sections', 'Product Grid', 'Trust Badges', 'Call to Action', 'Footers'],
    blog: ['Hero Sections', 'Features & Benefits', 'Testimonials', 'Call to Action', 'Footers'],
    cart: ['Trust Badges', 'Call to Action', 'Features & Benefits'],
    about: ['Hero Sections', 'Features & Benefits', 'Testimonials', 'Stats & Metrics', 'Call to Action', 'Footers'],
    contact: ['Hero Sections', 'Trust Badges', 'FAQ & Accordions', 'Call to Action'],
};

// ═══════════════════════════════════════════════════════════
// LOADER
// ═══════════════════════════════════════════════════════════
export const loader = async ({ request }) => {
    await authenticate.admin(request);
    const allSections = await db.sections.getAll();
    return json({ allSections });
};

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function iframeDoc(html) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif}svg{display:inline-block;vertical-align:middle}</style></head><body>${html || ''}</body></html>`;
}

// Build a "full page composite" HTML by stacking multiple section HTML codes
function buildCompositeHTML(sections) {
    return sections.map(s => s.html_code || '').join('\n\n');
}

// Shuffle an array and take N
function sampleN(arr, n) {
    const copy = [...arr].sort(() => Math.random() - 0.5);
    return copy.slice(0, n);
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function PageBuilder() {
    const { allSections } = useLoaderData();
    const fetcher = useFetcher();
    const navigate = useNavigate();

    const [activePageType, setActivePageType] = useState('home');
    const [activeView, setActiveView] = useState('templates'); // 'templates' | 'sections' | 'custom'
    const [hoveredTemplate, setHoveredTemplate] = useState(null);
    const [selectedSections, setSelectedSections] = useState([]);
    const [customCode, setCustomCode] = useState('');
    const [customSectionName, setCustomSectionName] = useState('My Custom Section');
    const [customPosition, setCustomPosition] = useState('end');
    const [notification, setNotification] = useState(null);
    const [activeCategory, setActiveCategory] = useState(null);

    const showToast = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 5000);
    };

    useEffect(() => {
        if (fetcher.data && fetcher.state === 'idle') {
            if (fetcher.data.success) showToast(`✓ ${fetcher.data.message}`);
            else showToast(fetcher.data.error || 'Action failed', 'error');
        }
    }, [fetcher.data, fetcher.state]);

    // Sections for this page type
    const categories = PAGE_CATEGORIES[activePageType] || [];
    const pageSections = allSections.filter(s => categories.includes(s.category));
    const byCategory = {};
    for (const cat of categories) {
        byCategory[cat] = allSections.filter(s => s.category === cat);
    }

    // Build 20 "full page templates" by randomly grouping top-scoring sections
    const fullPageTemplates = (() => {
        const templates = [];
        const topPerCat = {};
        for (const cat of categories) {
            topPerCat[cat] = (byCategory[cat] || []).sort((a, b) => (b.conversion_score || 0) - (a.conversion_score || 0));
        }
        for (let i = 0; i < 20; i++) {
            const combo = categories.map(cat => {
                const pool = topPerCat[cat] || [];
                return pool[i % (pool.length || 1)] || null;
            }).filter(Boolean);
            if (combo.length > 0) {
                templates.push({ id: `template_${i}`, sections: combo, score: Math.round(combo.reduce((s, c) => s + (c.conversion_score || 85), 0) / combo.length) });
            }
        }
        return templates.slice(0, 20);
    })();

    const handleReplacePage = (template) => {
        if (!window.confirm(`Replace your entire ${PAGE_TYPES.find(p => p.key === activePageType)?.label} with this template? This will overwrite your current page layout.`)) return;
        const fd = new FormData();
        fd.append('_action', 'replace_page');
        fd.append('pageType', activePageType);
        fd.append('sectionIds', JSON.stringify(template.sections.map(s => s.id)));
        showToast('Replacing page...', 'loading');
        fetcher.submit(fd, { method: 'post', action: '/api/page-builder' });
    };

    const handleInjectCustom = () => {
        if (!customCode.trim()) { showToast('Please paste your Liquid code first', 'error'); return; }
        const fd = new FormData();
        fd.append('_action', 'inject_custom');
        fd.append('pageType', activePageType);
        fd.append('liquidCode', customCode);
        fd.append('sectionName', customSectionName);
        fd.append('position', customPosition);
        showToast('Injecting custom section...', 'loading');
        fetcher.submit(fd, { method: 'post', action: '/api/page-builder' });
    };

    const pageInfo = PAGE_TYPES.find(p => p.key === activePageType);

    return (
        <div style={S.root}>
            {/* ══ TOP BAR ══ */}
            <div style={S.topbar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => navigate('/app/builder')} style={S.backBtn}>← Back</button>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Page Builder</div>
                        <div style={{ fontSize: 11, color: '#71717a' }}>Replace entire pages or inject custom Liquid code</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {(['templates', 'sections', 'custom']).map(v => (
                        <button key={v} onClick={() => setActiveView(v)} style={{
                            ...S.viewTab,
                            background: activeView === v ? 'rgba(99,102,241,0.2)' : 'transparent',
                            color: activeView === v ? '#818cf8' : '#71717a',
                            borderColor: activeView === v ? '#6366f1' : 'rgba(255,255,255,0.08)'
                        }}>
                            {v === 'templates' ? '📄 Full Page Templates' : v === 'sections' ? '🧩 Section Library' : '{ } Custom Liquid'}
                        </button>
                    ))}
                </div>
            </div>

            <div style={S.body}>
                {/* ══ LEFT: Page Type Selector ══ */}
                <div style={S.leftPanel}>
                    <div style={S.panelLabel}>Pages</div>
                    {PAGE_TYPES.map(pt => (
                        <div key={pt.key} onClick={() => { setActivePageType(pt.key); setHoveredTemplate(null); setActiveCategory(null); }} style={{
                            ...S.pageTypeItem,
                            background: activePageType === pt.key ? 'rgba(99,102,241,0.12)' : 'transparent',
                            borderLeftColor: activePageType === pt.key ? '#6366f1' : 'transparent',
                            color: activePageType === pt.key ? '#fff' : '#a1a1aa',
                        }}>
                            <span style={{ fontSize: 18, marginRight: 4 }}>{pt.icon}</span>
                            <span style={{ fontSize: 13, fontWeight: activePageType === pt.key ? 700 : 400 }}>{pt.label}</span>
                            {activePageType === pt.key && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6366f1' }}>›</span>}
                        </div>
                    ))}

                    {activeView === 'sections' && (
                        <>
                            <div style={{ ...S.panelLabel, marginTop: 20 }}>Categories</div>
                            {categories.map(cat => (
                                <div key={cat} onClick={() => setActiveCategory(cat)} style={{
                                    ...S.pageTypeItem, fontSize: 12,
                                    background: activeCategory === cat ? 'rgba(99,102,241,0.1)' : 'transparent',
                                    borderLeftColor: activeCategory === cat ? '#6366f1' : 'transparent',
                                    color: activeCategory === cat ? '#c4b5fd' : '#71717a',
                                }}>
                                    <span style={{ fontSize: 11 }}>{cat}</span>
                                    <span style={{ marginLeft: 'auto', fontSize: 10, color: '#52525b', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 8 }}>
                                        {(byCategory[cat] || []).length}
                                    </span>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* ══ CENTER: Main Content ══ */}
                <div style={S.center}>

                    {/* ── 1. FULL PAGE TEMPLATES ── */}
                    {activeView === 'templates' && (
                        <>
                            <div style={S.centerHeader}>
                                <h2 style={S.centerTitle}>{pageInfo?.icon} {pageInfo?.label} — Full Page Templates</h2>
                                <p style={S.centerSub}>
                                    {fullPageTemplates.length} complete page designs. Click <strong style={{ color: '#fff' }}>Replace Page</strong> to swap your entire {pageInfo?.label.toLowerCase()} instantly.
                                </p>
                            </div>
                            {pageSections.length === 0 ? (
                                <div style={S.emptyState}>
                                    <div style={{ fontSize: 40, marginBottom: 16 }}>🔧</div>
                                    <p style={{ color: '#71717a', fontSize: 14 }}>No sections seeded for <strong style={{ color: '#fff' }}>{pageInfo?.label}</strong> yet.<br />Add sections to the library first.</p>
                                </div>
                            ) : (
                                <div style={S.templateGrid}>
                                    {fullPageTemplates.map((tmpl, idx) => {
                                        const isHovered = hoveredTemplate?.id === tmpl.id;
                                        const compositeHtml = buildCompositeHTML(tmpl.sections.slice(0, 4));
                                        return (
                                            <div key={tmpl.id}
                                                onMouseEnter={() => setHoveredTemplate(tmpl)}
                                                onMouseLeave={() => setHoveredTemplate(null)}
                                                style={{
                                                    ...S.templateCard,
                                                    borderColor: isHovered ? '#6366f1' : 'rgba(255,255,255,0.07)',
                                                    transform: isHovered ? 'translateY(-4px)' : 'none',
                                                }}>
                                                <div style={S.templateThumb}>
                                                    <iframe
                                                        srcDoc={iframeDoc(compositeHtml)}
                                                        style={S.thumbIframe}
                                                        sandbox="allow-same-origin"
                                                        loading="lazy"
                                                        title={`Template ${idx + 1}`}
                                                    />
                                                    {isHovered && (
                                                        <div style={S.thumbOverlay}>
                                                            <button onClick={() => handleReplacePage(tmpl)} disabled={fetcher.state !== 'idle'} style={S.replaceBtn}>
                                                                Replace Entire Page
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={S.templateFooter}>
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e4e4e7' }}>Design #{idx + 1}</div>
                                                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                                        <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>{tmpl.score}% CV Score</span>
                                                        <span style={{ fontSize: 10, color: '#71717a' }}>{tmpl.sections.length} sections</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {/* ── 2. SECTION LIBRARY ── */}
                    {activeView === 'sections' && (
                        <>
                            <div style={S.centerHeader}>
                                <h2 style={S.centerTitle}>🧩 Section Library — {pageInfo?.label}</h2>
                                <p style={S.centerSub}>Browse individual sections. Hover to preview, click <strong style={{ color: '#fff' }}>Add</strong> to insert into the page.</p>
                            </div>
                            <div style={S.sectionLibGrid}>
                                {(activeCategory ? (byCategory[activeCategory] || []) : pageSections).map(sec => (
                                    <div key={sec.id} style={S.secCard} onMouseEnter={() => setHoveredTemplate({ ...sec, isSingle: true })} onMouseLeave={() => setHoveredTemplate(null)}>
                                        <div style={S.secThumb}>
                                            <iframe srcDoc={iframeDoc(sec.html_code)} style={S.thumbIframeSm} sandbox="allow-same-origin" loading="lazy" title={sec.name} />
                                            {hoveredTemplate?.id === sec.id && (
                                                <div style={S.thumbOverlay}>
                                                    <button
                                                        onClick={() => {
                                                            const fd = new FormData();
                                                            fd.append('_action', 'replace_page');
                                                            fd.append('pageType', activePageType);
                                                            fd.append('sectionIds', JSON.stringify([sec.id]));
                                                            showToast(`Adding ${sec.name}...`, 'loading');
                                                            fetcher.submit(fd, { method: 'post', action: '/api/page-builder' });
                                                        }}
                                                        disabled={fetcher.state !== 'idle'}
                                                        style={{ ...S.replaceBtn, padding: '8px 16px', fontSize: 12 }}
                                                    >
                                                        + Add to Page
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: '10px 12px' }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: '#e4e4e7' }}>{sec.name}</div>
                                            <div style={{ fontSize: 10, color: '#71717a', marginTop: 3 }}>{sec.category}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* ── 3. CUSTOM LIQUID CODE ── */}
                    {activeView === 'custom' && (
                        <>
                            <div style={S.centerHeader}>
                                <h2 style={S.centerTitle}>{'{ }'} Custom Liquid Code Injector</h2>
                                <p style={S.centerSub}>Paste any Liquid or HTML code. It will be installed as a section and added to your <strong style={{ color: '#fff' }}>{pageInfo?.label}</strong>.</p>
                            </div>
                            <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={S.inputRow}>
                                    <label style={S.label}>Section Name</label>
                                    <input
                                        type="text"
                                        value={customSectionName}
                                        onChange={e => setCustomSectionName(e.target.value)}
                                        style={S.textInput}
                                        placeholder="e.g. My Custom Hero"
                                    />
                                </div>
                                <div style={S.inputRow}>
                                    <label style={S.label}>Position</label>
                                    <select value={customPosition} onChange={e => setCustomPosition(e.target.value)} style={S.textInput}>
                                        <option value="end">Add at bottom of page</option>
                                        <option value="start">Add at top of page</option>
                                    </select>
                                </div>
                                <div style={S.inputRow}>
                                    <label style={S.label}>Liquid / HTML Code</label>
                                    <textarea
                                        value={customCode}
                                        onChange={e => setCustomCode(e.target.value)}
                                        style={{ ...S.textInput, height: 340, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7, resize: 'vertical' }}
                                        placeholder={`<!-- Paste your Liquid or HTML code here -->\n<section class="my-section">\n  <h2>{{ section.settings.heading }}</h2>\n</section>\n\n{% schema %}\n{\n  "name": "My Section",\n  "settings": [{ "id": "heading", "type": "text", "label": "Heading", "default": "Hello World" }]\n}\n{% endschema %}`}
                                        spellCheck={false}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button
                                        onClick={handleInjectCustom}
                                        disabled={fetcher.state !== 'idle' || !customCode.trim()}
                                        style={{ ...S.replaceBtn, padding: '14px 32px', borderRadius: 10, fontSize: 14, opacity: !customCode.trim() ? 0.4 : 1 }}
                                    >
                                        {fetcher.state !== 'idle' ? 'Injecting...' : '⚡ Inject to Theme'}
                                    </button>
                                    <button onClick={() => setCustomCode('')} style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>
                                        Clear
                                    </button>
                                </div>

                                {/* Tips */}
                                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 20 }}>
                                    <div style={{ fontWeight: 700, color: '#818cf8', marginBottom: 10, fontSize: 13 }}>💡 Tips</div>
                                    <ul style={{ color: '#a1a1aa', fontSize: 12, lineHeight: 2, paddingLeft: 18 }}>
                                        <li>You can paste pure HTML — the <code>{'{% schema %}'}</code> block is added automatically if missing.</li>
                                        <li>Import sections from <strong>any website</strong> (inspect → copy HTML).</li>
                                        <li>Use <code>{`{{ section.settings.key }}`}</code> for editable text in Shopify Customizer.</li>
                                        <li>Add <code>{'{% for product in collections.frontpage.products limit: 4 %}'}</code> to loop products.</li>
                                        <li>The section is instantly live after injection.</li>
                                    </ul>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ══ RIGHT: Live Preview ══ */}
                <div style={S.rightPanel}>
                    <div style={S.panelLabel}>Live Preview</div>
                    {hoveredTemplate ? (
                        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 40px)' }}>
                            <div style={{ padding: '10px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f5' }}>
                                    {hoveredTemplate.isSingle ? hoveredTemplate.name : `Design #${fullPageTemplates.findIndex(t => t.id === hoveredTemplate.id) + 1}`}
                                </div>
                                {!hoveredTemplate.isSingle && (
                                    <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>
                                        {hoveredTemplate.sections?.length} sections · {hoveredTemplate.score}% avg CV
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 1, background: '#fff', overflow: 'hidden' }}>
                                <iframe
                                    srcDoc={iframeDoc(hoveredTemplate.isSingle ? hoveredTemplate.html_code : buildCompositeHTML(hoveredTemplate.sections || []))}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                    sandbox="allow-same-origin"
                                    title="Preview"
                                />
                            </div>
                            <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                {hoveredTemplate.isSingle ? null : (
                                    <button onClick={() => handleReplacePage(hoveredTemplate)} disabled={fetcher.state !== 'idle'}
                                        style={{ ...S.replaceBtn, width: '100%', borderRadius: 10, padding: 14, fontSize: 14 }}>
                                        Replace Entire {pageInfo?.label}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={S.emptyState}>
                            <div style={{ fontSize: 36, opacity: 0.3, marginBottom: 12 }}>👁</div>
                            <p style={{ color: '#52525b', fontSize: 12, textAlign: 'center' }}>Hover any design to see a full preview here</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ══ Toast ══ */}
            {notification && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 9999, padding: '14px 24px',
                    borderRadius: 12, fontWeight: 600, fontSize: 14, color: '#fff',
                    background: notification.type === 'success' ? '#059669' : notification.type === 'error' ? '#dc2626' : '#2563eb',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease-out'
                }}>
                    {notification.msg}
                </div>
            )}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                *{box-sizing:border-box}
                ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:4px}
                @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const S = {
    root: { background: '#09090b', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" },
    topbar: { height: 56, background: '#111114', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0, gap: 16 },
    backBtn: { padding: '6px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
    viewTab: { padding: '6px 14px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s' },
    body: { display: 'flex', flex: 1, overflow: 'hidden' },

    leftPanel: { width: 228, background: '#0e0e12', borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', flexShrink: 0, paddingTop: 8 },
    panelLabel: { padding: '10px 16px 4px', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#52525b' },
    pageTypeItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderLeft: '3px solid transparent', cursor: 'pointer', transition: 'all 0.15s' },

    center: { flex: 1, overflowY: 'auto', background: '#09090b' },
    centerHeader: { padding: '24px 28px 12px' },
    centerTitle: { fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 6px' },
    centerSub: { fontSize: 12, color: '#71717a' },

    templateGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, padding: '8px 28px 28px' },
    templateCard: { background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s', position: 'relative' },
    templateThumb: { height: 180, overflow: 'hidden', position: 'relative', background: '#1a1a2e' },
    thumbIframe: { width: '200%', height: '200%', border: 'none', transform: 'scale(0.5)', transformOrigin: 'top left', pointerEvents: 'none' },
    thumbIframeSm: { width: '200%', height: '200%', border: 'none', transform: 'scale(0.5)', transformOrigin: 'top left', pointerEvents: 'none' },
    thumbOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    replaceBtn: { padding: '10px 22px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' },
    templateFooter: { padding: '10px 14px' },

    sectionLibGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, padding: '8px 28px 28px' },
    secCard: { background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' },
    secThumb: { height: 140, overflow: 'hidden', position: 'relative', background: '#1a1a2e' },

    rightPanel: { width: 320, background: '#0e0e12', borderLeft: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', flexDirection: 'column' },
    emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 },

    inputRow: { display: 'flex', flexDirection: 'column', gap: 8 },
    label: { fontSize: 12, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 0.5 },
    textInput: { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f4f4f5', fontSize: 13, outline: 'none', fontFamily: 'system-ui, sans-serif' },
};
