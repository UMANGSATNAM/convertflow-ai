import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { useState, useEffect, useCallback } from "react";
import { authenticate } from "../shopify.server";
import { Button, Badge, Spinner } from "@shopify/polaris";
import db from "../db.server";

// ═══════ SVG ICONS ═══════
const ICONS = {
    layout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>`,
    image: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    text: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>`,
    list: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>`,
    zap: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    close: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>`,
    search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    swap: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3l4 4-4 4"/><path d="M20 7H4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/></svg>`,
    refresh: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
};

function Icon({ name, size = 16, color = 'currentColor' }) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, color }}
        dangerouslySetInnerHTML={{ __html: ICONS[name] || ICONS.layout }} />;
}

// ═══════ LOADER ═══════
export const loader = async ({ request }) => {
    await authenticate.admin(request);
    const categoriesRows = await db.sections.getCategories();
    const categories = categoriesRows.map(row => ({
        category: row.category,
        count: Number(row.section_count)
    }));
    const allSections = await db.sections.getAll();
    return json({ categories, cfSections: allSections });
};

// ═══════ MAIN COMPONENT ═══════
export default function VisualEditor() {
    const { categories, cfSections } = useLoaderData();
    const fetcher = useFetcher();

    // Template state
    const [templates, setTemplates] = useState([]);
    const [activeTemplate, setActiveTemplate] = useState('templates/index.json');
    const [themeName, setThemeName] = useState('');

    // Sections state per template
    const [themeSections, setThemeSections] = useState([]);
    const [isLoadingTheme, setIsLoadingTheme] = useState(true);
    const [themeError, setThemeError] = useState(null);

    // Picker modal
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerMode, setPickerMode] = useState('replace'); // 'replace' or 'add'
    const [activeBlockToReplace, setActiveBlockToReplace] = useState(null);
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    // Notification
    const [notification, setNotification] = useState(null);

    // Load templates on mount
    useEffect(() => {
        fetch('/api/theme-editor?list=templates')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setTemplates(data.templates);
                    setThemeName(data.themeName);
                }
            })
            .catch(err => console.error("Failed to load templates:", err));
    }, []);

    // Load sections whenever active template changes
    useEffect(() => {
        loadTemplateSections(activeTemplate);
    }, [activeTemplate]);

    const loadTemplateSections = useCallback((templateKey) => {
        setIsLoadingTheme(true);
        setThemeError(null);
        fetch(`/api/theme-editor?template=${encodeURIComponent(templateKey)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setThemeSections(data.sections);
                    if (data.themeName) setThemeName(data.themeName);
                } else {
                    setThemeError(data.error || "Failed to load template");
                    setThemeSections([]);
                }
            })
            .catch(err => {
                setThemeError("Network error: " + err.message);
                setThemeSections([]);
            })
            .finally(() => setIsLoadingTheme(false));
    }, []);

    // ─── Handlers ─────
    const handleReplace = (blockId) => {
        setActiveBlockToReplace(blockId);
        setPickerMode('replace');
        setPickerOpen(true);
    };

    const handleAddSection = () => {
        setPickerMode('add');
        setPickerOpen(true);
    };

    const handleRemoveSection = (sectionId) => {
        if (!confirm("Are you sure you want to remove this section from the template?")) return;
        setNotification({ type: 'loading', text: 'Removing section...' });
        const fd = new FormData();
        fd.append("_action", "remove_section");
        fd.append("sectionId", sectionId);
        fd.append("template", activeTemplate);
        fetcher.submit(fd, { method: "post", action: "/api/theme-editor" });
    };

    const handleSelectCFSection = (cfSection) => {
        setPickerOpen(false);
        if (pickerMode === 'replace') {
            setNotification({ type: 'loading', text: `Replacing with ${cfSection.name}...` });
            const fd = new FormData();
            fd.append("_action", "replace_section");
            fd.append("oldBlockId", activeBlockToReplace);
            fd.append("newSectionId", cfSection.id);
            fd.append("template", activeTemplate);
            fetcher.submit(fd, { method: "post", action: "/api/theme-editor" });
        } else {
            setNotification({ type: 'loading', text: `Adding ${cfSection.name}...` });
            const fd = new FormData();
            fd.append("_action", "add_section");
            fd.append("cfSectionId", cfSection.id);
            fd.append("template", activeTemplate);
            fd.append("position", "end");
            fetcher.submit(fd, { method: "post", action: "/api/theme-editor" });
        }
    };

    // Watch fetcher results
    useEffect(() => {
        if (fetcher.data && fetcher.state === 'idle') {
            if (fetcher.data.success) {
                setNotification({ type: 'success', text: fetcher.data.message });
                loadTemplateSections(activeTemplate);
            } else {
                setNotification({ type: 'error', text: fetcher.data.error || "Action failed" });
            }
            setTimeout(() => setNotification(null), 5000);
        }
    }, [fetcher.data, fetcher.state]);

    // Filtered sections for picker
    const displaySections = cfSections.filter(s => {
        const matchesCat = activeCategory === "All" || s.category === activeCategory;
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    const getIconForType = (type) => {
        if (type.includes('image') || type.includes('banner') || type.includes('hero') || type.includes('slideshow')) return 'image';
        if (type.includes('text') || type.includes('rich') || type.includes('custom')) return 'text';
        if (type.includes('list') || type.includes('collection') || type.includes('product')) return 'list';
        return 'layout';
    };

    const getActiveLabel = () => {
        const t = templates.find(t => t.key === activeTemplate);
        return t ? `${t.icon} ${t.label}` : activeTemplate;
    };

    return (
        <div style={S.root}>
            {/* ══════ HEADER ══════ */}
            <div style={S.header}>
                <div>
                    <h1 style={S.pageTitle}>Theme Builder</h1>
                    <p style={S.pageSubtitle}>
                        Build your perfect store — replace, add, or remove any section on any page of your {themeName || 'theme'}.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => loadTemplateSections(activeTemplate)} disabled={isLoadingTheme} style={S.refreshBtn}>
                        <Icon name="refresh" size={14} /> Refresh
                    </button>
                </div>
            </div>

            {/* ══════ TEMPLATE TABS ══════ */}
            <div style={S.tabBar}>
                <div style={S.tabScroll}>
                    {templates.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTemplate(t.key)}
                            style={{
                                ...S.tab,
                                ...(activeTemplate === t.key ? S.tabActive : {})
                            }}
                        >
                            <span style={{ fontSize: 16 }}>{t.icon}</span>
                            <span>{t.label}</span>
                        </button>
                    ))}
                    {templates.length === 0 && (
                        <div style={{ padding: '12px 20px', color: '#94a3b8', fontSize: 13 }}>
                            <Spinner size="small" /> Loading templates...
                        </div>
                    )}
                </div>
            </div>

            {/* ══════ MAIN CONTENT ══════ */}
            <div style={S.mainLayout}>
                {/* LEFT: Section Map */}
                <div style={S.mapContainer}>
                    <div style={S.mapHeader}>
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>{getActiveLabel()}</h2>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                                {themeSections.length} section{themeSections.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <Badge tone="info">{themeName}</Badge>
                    </div>

                    <div style={S.mapBody}>
                        {isLoadingTheme ? (
                            <div style={{ padding: 40, textAlign: 'center' }}>
                                <Spinner size="large" />
                                <p style={{ marginTop: 16, color: '#64748b' }}>Scanning {getActiveLabel()}...</p>
                            </div>
                        ) : themeError ? (
                            <div style={S.errorBox}>
                                <p style={{ fontWeight: 600 }}>Error loading template</p>
                                <p>{themeError}</p>
                            </div>
                        ) : themeSections.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                                <p style={{ marginBottom: 16 }}>No sections found in this template.</p>
                                <button onClick={handleAddSection} style={S.addBtnLarge}>
                                    <Icon name="plus" size={18} color="#fff" /> Add First Section
                                </button>
                            </div>
                        ) : (
                            <div style={S.nodeList}>
                                {themeSections.map((section) => (
                                    <div key={section.id} style={{
                                        ...S.nodeCard,
                                        borderLeft: section.isCF ? '4px solid #8b5cf6' : '4px solid #e2e8f0',
                                        background: section.isCF ? '#faf5ff' : '#ffffff',
                                        opacity: section.disabled ? 0.5 : 1
                                    }}>
                                        <div style={{
                                            ...S.nodeIcon,
                                            background: section.isCF ? '#f3e8ff' : '#f1f5f9'
                                        }}>
                                            <Icon name={section.isCF ? 'zap' : getIconForType(section.type)} size={18} color={section.isCF ? '#8b5cf6' : '#64748b'} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={S.nodeName}>
                                                {section.name}
                                                {section.isCF && <span style={S.cfBadge}>CF Premium</span>}
                                                {section.disabled && <span style={S.disabledBadge}>Hidden</span>}
                                            </div>
                                            <div style={S.nodeType}>{section.type}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => handleReplace(section.id)} style={S.actionBtn} title="Replace">
                                                <Icon name="swap" size={14} color="#fff" /> Replace
                                            </button>
                                            <button onClick={() => handleRemoveSection(section.id)} style={S.removeBtn} title="Remove">
                                                <Icon name="trash" size={14} color="#ef4444" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Add Section Button at bottom */}
                                <button onClick={handleAddSection} style={S.addBtnDashed}>
                                    <Icon name="plus" size={16} color="#8b5cf6" />
                                    <span>Add New Section</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Instructions */}
                <div style={S.instructionContainer}>
                    <div style={S.instructionCard}>
                        <div style={S.instructionIcon}><Icon name="zap" size={24} color="#8b5cf6" /></div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px', color: '#1e293b' }}>How to use the Theme Builder</h2>
                        <ol style={S.instructionList}>
                            <li>Select a <strong>page tab</strong> above (Homepage, Product, Collection, etc.)</li>
                            <li>Click <strong>Replace</strong> next to any section to swap it with a premium ConvertFlow AI section.</li>
                            <li>Click <strong>Add New Section</strong> to insert a new section at the bottom.</li>
                            <li>Click the <strong>trash icon</strong> to remove sections you don't need.</li>
                            <li>Changes go live <strong>immediately</strong> on your active theme!</li>
                        </ol>

                        <div style={S.statsCard}>
                            <div style={S.statItem}>
                                <div style={S.statNum}>{templates.length}</div>
                                <div style={S.statLabel}>Page Templates</div>
                            </div>
                            <div style={S.statItem}>
                                <div style={S.statNum}>{cfSections.length}</div>
                                <div style={S.statLabel}>Premium Sections</div>
                            </div>
                            <div style={S.statItem}>
                                <div style={S.statNum}>{categories.length}</div>
                                <div style={S.statLabel}>Categories</div>
                            </div>
                        </div>

                        <div style={{ marginTop: 20, padding: 14, background: '#fffbeb', borderRadius: 8, border: '1px solid #fef3c7' }}>
                            <p style={{ margin: 0, fontSize: 13, color: '#92400e', fontWeight: 500 }}>
                                ⚡ Changes made here go live immediately on your active theme.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════ SECTION PICKER MODAL ══════ */}
            {pickerOpen && (
                <div style={S.modalOverlay}>
                    <div style={S.modalContent}>
                        <div style={S.modalHeader}>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                                {pickerMode === 'replace' ? 'Select Replacement Section' : 'Add New Section'}
                            </h2>
                            <button onClick={() => setPickerOpen(false)} style={S.closeBtn}>
                                <Icon name="close" size={20} />
                            </button>
                        </div>

                        <div style={S.modalBody}>
                            {/* Left Filters */}
                            <div style={S.modalSidebar}>
                                <div style={S.searchBox}>
                                    <Icon name="search" size={14} color="#94a3b8" />
                                    <input
                                        type="text"
                                        placeholder="Search sections..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        style={S.searchInput}
                                    />
                                </div>

                                <h3 style={S.filterTitle}>Categories</h3>
                                <div style={S.categoryList}>
                                    <button
                                        onClick={() => setActiveCategory("All")}
                                        style={{ ...S.catBtn, ...(activeCategory === "All" ? S.catBtnActive : {}) }}
                                    >
                                        All Sections <span style={S.catCount}>{cfSections.length}</span>
                                    </button>

                                    {categories.map(c => (
                                        <button
                                            key={c.category}
                                            onClick={() => setActiveCategory(c.category)}
                                            style={{ ...S.catBtn, ...(activeCategory === c.category ? S.catBtnActive : {}) }}
                                        >
                                            {c.category} <span style={S.catCount}>{c.count}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Right Grid */}
                            <div style={S.modalGrid}>
                                {displaySections.length === 0 ? (
                                    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No sections match your search.</div>
                                ) : (
                                    <div style={S.gridLayout}>
                                        {displaySections.map(section => (
                                            <div key={section.id} style={S.cfSectionCard}>
                                                <div style={S.cfSectionPreview}>
                                                    {section.html_code ? (
                                                        <iframe
                                                            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0;overflow:hidden;font-family:'Inter',system-ui,sans-serif;}</style></head><body>${section.html_code}</body></html>`}
                                                            style={{
                                                                width: '200%', height: '200%', border: 'none',
                                                                transform: 'scale(0.5)', transformOrigin: 'top left',
                                                                pointerEvents: 'none',
                                                            }}
                                                            sandbox="allow-same-origin"
                                                            title={section.name}
                                                        />
                                                    ) : (
                                                        <div style={S.wireframeBox}>
                                                            <Icon name="layout" size={32} color="#cbd5e1" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={S.cfSectionInfo}>
                                                    <div style={S.cfSectionName}>{section.name}</div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                                        <span style={S.cfConversionScore}>Score: {section.conversion_score}%</span>
                                                        <button onClick={() => handleSelectCFSection(section)} style={S.selectBtn}>
                                                            {pickerMode === 'replace' ? 'Replace' : 'Add'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════ NOTIFICATION TOAST ══════ */}
            {notification && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                    padding: '14px 24px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                    color: '#fff', display: 'flex', alignItems: 'center', gap: 10,
                    background: notification.type === 'success' ? '#059669' : notification.type === 'error' ? '#dc2626' : '#2563eb',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    animation: 'cfSlideUp 0.3s ease-out'
                }}>
                    {notification.type === 'loading' && <Spinner size="small" />}
                    {notification.text}
                </div>
            )}

            <style>{`@keyframes cfSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        </div>
    );
}

// ═══════ STYLES ═══════
const S = {
    root: { minHeight: '100vh', background: '#f8fafc', fontFamily: "system-ui, -apple-system, sans-serif" },

    // Header
    header: {
        background: '#fff', padding: '24px 32px', borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    pageTitle: { margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' },
    pageSubtitle: { margin: 0, fontSize: 14, color: '#64748b' },
    refreshBtn: {
        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
        background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8,
        fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer'
    },

    // Template Tabs
    tabBar: {
        background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch'
    },
    tabScroll: { display: 'flex', gap: 0, minWidth: 'max-content' },
    tab: {
        display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px',
        background: 'transparent', border: 'none', borderBottom: '3px solid transparent',
        fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer',
        transition: 'all 0.2s', whiteSpace: 'nowrap'
    },
    tabActive: {
        color: '#6366f1', borderBottom: '3px solid #6366f1', background: '#f5f3ff'
    },

    // Main Layout
    mainLayout: { display: 'flex', gap: 24, padding: '24px 32px', maxWidth: 1400, margin: '0 auto', alignItems: 'flex-start' },

    // Section Map
    mapContainer: {
        flex: 1.5, background: '#fff', borderRadius: 12,
        border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        overflow: 'hidden'
    },
    mapHeader: {
        padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    mapBody: { padding: 16, minHeight: 300 },
    errorBox: { padding: 20, background: '#fee2e2', color: '#b91c1c', borderRadius: 8 },

    nodeList: { display: 'flex', flexDirection: 'column', gap: 8 },
    nodeCard: {
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        border: '1px solid #e2e8f0', borderRadius: 10, gap: 12,
        transition: 'all 0.2s', position: 'relative'
    },
    nodeIcon: {
        width: 38, height: 38, borderRadius: 10, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0
    },
    nodeName: {
        fontSize: 14, fontWeight: 600, color: '#1e293b', margin: '0 0 2px',
        display: 'flex', alignItems: 'center', gap: 8
    },
    cfBadge: {
        fontSize: 10, background: '#8b5cf6', color: '#fff', padding: '2px 6px',
        borderRadius: 12, fontWeight: 700, textTransform: 'uppercase'
    },
    disabledBadge: {
        fontSize: 10, background: '#f1f5f9', color: '#94a3b8', padding: '2px 6px',
        borderRadius: 12, fontWeight: 600
    },
    nodeType: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' },

    actionBtn: {
        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
        background: '#1e293b', color: '#fff', border: 'none', borderRadius: 6,
        fontSize: 12, fontWeight: 600, cursor: 'pointer'
    },
    removeBtn: {
        display: 'flex', alignItems: 'center', padding: '6px 8px',
        background: '#fff', border: '1px solid #fecaca', borderRadius: 6,
        cursor: 'pointer'
    },
    addBtnDashed: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '16px', borderRadius: 10, border: '2px dashed #c4b5fd',
        background: '#faf5ff', color: '#8b5cf6', fontSize: 14, fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.2s', marginTop: 4
    },
    addBtnLarge: {
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px',
        background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 10,
        fontSize: 14, fontWeight: 700, cursor: 'pointer'
    },

    // Instructions
    instructionContainer: { flex: 1, maxWidth: 400, position: 'sticky', top: 24 },
    instructionCard: {
        background: '#fff', borderRadius: 12, padding: 28,
        border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)'
    },
    instructionIcon: {
        width: 48, height: 48, borderRadius: 12, background: '#f5f3ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
    },
    instructionList: { margin: 0, paddingLeft: 20, color: '#475569', fontSize: 14, lineHeight: 1.8 },

    statsCard: {
        display: 'flex', gap: 16, marginTop: 20, padding: '16px 0',
        borderTop: '1px solid #f1f5f9'
    },
    statItem: { flex: 1, textAlign: 'center' },
    statNum: { fontSize: 24, fontWeight: 800, color: '#6366f1' },
    statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },

    // Modal
    modalOverlay: {
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
        backdropFilter: 'blur(4px)'
    },
    modalContent: {
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 1200, height: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
    },
    modalHeader: {
        padding: '18px 24px', borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    closeBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 },

    modalBody: { flex: 1, display: 'flex', overflow: 'hidden' },
    modalSidebar: {
        width: 260, background: '#f8fafc', borderRight: '1px solid #e2e8f0',
        padding: 16, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto'
    },
    searchBox: {
        display: 'flex', alignItems: 'center', background: '#fff',
        border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 12px', gap: 8
    },
    searchInput: { border: 'none', outline: 'none', padding: '10px 0', fontSize: 14, width: '100%', background: 'transparent' },

    filterTitle: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', margin: 0 },
    categoryList: { display: 'flex', flexDirection: 'column', gap: 2 },
    catBtn: {
        padding: '8px 12px', background: 'transparent', border: 'none', borderRadius: 6,
        textAlign: 'left', fontSize: 13, color: '#334155', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    catBtnActive: { background: '#ede9fe', fontWeight: 600, color: '#6366f1' },
    catCount: { fontSize: 11, background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 10 },

    modalGrid: { flex: 1, padding: 24, overflowY: 'auto', background: '#fff' },
    gridLayout: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },

    cfSectionCard: {
        border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s'
    },
    cfSectionPreview: { height: 160, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', overflow: 'hidden', position: 'relative' },
    wireframeBox: {
        width: '100%', height: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f8fafc'
    },
    cfSectionInfo: { padding: 14 },
    cfSectionName: { fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    cfConversionScore: { fontSize: 11, fontWeight: 600, color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: 4 },

    selectBtn: {
        background: '#8b5cf6', color: '#fff', border: 'none', padding: '6px 16px',
        borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer'
    }
};
