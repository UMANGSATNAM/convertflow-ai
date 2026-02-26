import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { Page, Layout, Card, BlockStack, Text, Button, Badge, Spinner, Box, Icon as PolarisIcon } from "@shopify/polaris";
import db from "../db.server";

// We import the same icons from the dashboard for consistency
const ICONS = {
    layout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>`,
    image: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    text: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>`,
    list: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>`,
    zap: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    close: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>`,
    search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
};

function CustomIcon({ name, size = 16, color = 'currentColor', className = '' }) {
    return <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, color }}
        dangerouslySetInnerHTML={{ __html: ICONS[name] || ICONS.layout }} />;
}

export const loader = async ({ request }) => {
    await authenticate.admin(request);

    // We fetch categories for the section picker modal
    const categoriesRows = await db.sections.getCategories();

    // Convert BigInt rows to standard objects and parse
    const categories = categoriesRows.map(row => ({
        category: row.category,
        count: Number(row.section_count)
    }));

    // Fetch CF sections directly to feed the picker
    const allSections = await db.sections.getAll();

    return json({ categories, cfSections: allSections });
};


export default function VisualEditor() {
    const { categories, cfSections } = useLoaderData();
    const fetcher = useFetcher();
    const navigate = useNavigate();

    const [themeData, setThemeData] = useState(null);
    const [isLoadingTheme, setIsLoadingTheme] = useState(true);
    const [themeError, setThemeError] = useState(null);

    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeBlockToReplace, setActiveBlockToReplace] = useState(null);
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const [notification, setNotification] = useState(null);

    // Initial load of theme structure
    useEffect(() => {
        loadThemeStructure();
    }, []);

    const loadThemeStructure = () => {
        setIsLoadingTheme(true);
        fetch('/api/theme-editor')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setThemeData(data);
                    setThemeError(null);
                } else {
                    setThemeError(data.error || "Failed to parse theme structure");
                }
            })
            .catch(err => {
                setThemeError("Network error: " + err.message);
            })
            .finally(() => {
                setIsLoadingTheme(false);
            });
    };

    const handleReplaceClick = (blockId) => {
        setActiveBlockToReplace(blockId);
        setPickerOpen(true);
    };

    const handleSelectCFSection = (cfSection) => {
        setPickerOpen(false);

        // Show loading notification
        setNotification({ type: 'loading', text: `Replacing section with ${cfSection.name}...` });

        // Call action to replace
        const formData = new FormData();
        formData.append("_action", "replace_section");
        formData.append("oldBlockId", activeBlockToReplace);
        formData.append("newSectionId", cfSection.id);

        fetcher.submit(formData, { method: "post", action: "/api/theme-editor" });
    };

    // Watch for fetcher completion (replacement success/fail)
    useEffect(() => {
        if (fetcher.data && fetcher.state === 'idle') {
            if (fetcher.data.success) {
                setNotification({ type: 'success', text: fetcher.data.message });
                // Reload theme map to reflect changes!
                loadThemeStructure();
            } else {
                setNotification({ type: 'error', text: fetcher.data.error || "Replacement failed" });
            }

            setTimeout(() => setNotification(null), 5000);
        }
    }, [fetcher.data, fetcher.state]);

    // Derived state for section picker
    const displaySections = cfSections.filter(s => {
        const matchesCat = activeCategory === "All" || s.category === activeCategory;
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    const getIconForType = (type) => {
        if (type.includes('image') || type.includes('banner')) return 'image';
        if (type.includes('text') || type.includes('rich')) return 'text';
        if (type.includes('list') || type.includes('collection')) return 'list';
        return 'layout';
    };

    return (
        <div style={S.root}>
            {/* Header */}
            <div style={S.header}>
                <div>
                    <h1 style={S.pageTitle}>Theme Map Visual Editor</h1>
                    <p style={S.pageSubtitle}>
                        Directly replace sections on your live homepage ({themeData?.themeName || 'Loading...'}) without leaving the app.
                    </p>
                </div>
                <Button onClick={loadThemeStructure} disabled={isLoadingTheme}>Refresh Map</Button>
            </div>

            <div style={S.mainLayout}>
                {/* Left side: Theme Map */}
                <div style={S.mapContainer}>
                    <div style={S.mapHeader}>
                        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Homepage Layout</h2>
                        <Badge tone={themeData?.success ? "success" : "critical"}>
                            {themeData?.themeName || "Active Theme"}
                        </Badge>
                    </div>

                    <div style={S.mapBody}>
                        {isLoadingTheme ? (
                            <div style={{ padding: 40, textAlign: 'center' }}>
                                <Spinner size="large" />
                                <p style={{ marginTop: 16, color: '#64748b' }}>Scanning theme structure...</p>
                            </div>
                        ) : themeError ? (
                            <div style={{ padding: 20, background: '#fee2e2', color: '#b91c1c', borderRadius: 8 }}>
                                <p style={{ fontWeight: 600 }}>Error loading theme</p>
                                <p>{themeError}</p>
                            </div>
                        ) : themeData?.sections?.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                                <p>No sections found on the homepage.</p>
                            </div>
                        ) : (
                            <div style={S.nodeList}>
                                {themeData?.sections?.map((section, idx) => (
                                    <div key={section.id} style={{
                                        ...S.nodeCard,
                                        borderLeft: section.isCF ? '4px solid #8b5cf6' : '4px solid #cbd5e1',
                                        background: section.isCF ? '#f5f3ff' : '#ffffff'
                                    }}>
                                        <div style={S.nodeIcon}>
                                            <CustomIcon name={section.isCF ? 'zap' : getIconForType(section.type)} size={18} color={section.isCF ? '#8b5cf6' : '#64748b'} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={S.nodeName}>
                                                {section.name}
                                                {section.isCF && <span style={S.cfBadge}>Premium</span>}
                                            </div>
                                            <div style={S.nodeType}>Theme ID: {section.type}</div>
                                        </div>

                                        <button
                                            onClick={() => handleReplaceClick(section.id)}
                                            style={S.replaceBtn}
                                        >
                                            Replace
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side: Instructions or CF Preview */}
                <div style={S.instructionContainer}>
                    <div style={S.instructionCard}>
                        <div style={S.instructionIcon}><CustomIcon name="zap" size={24} color="#8b5cf6" /></div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px', color: '#1e293b' }}>How to use the Visual Editor</h2>

                        <ol style={S.instructionList}>
                            <li>The <strong>Theme Map</strong> on the left shows the exact order of sections currently on your live homepage.</li>
                            <li>Click the <strong>Replace</strong> button next to any boring section you want to upgrade.</li>
                            <li>Choose a high-converting <strong>ConvertFlow AI</strong> section from our premium library.</li>
                            <li>We'll instantly swap the code in your active theme — no manual coding required!</li>
                        </ol>

                        <div style={{ marginTop: 24, padding: 16, background: '#fffbeb', borderRadius: 8, border: '1px solid #fef3c7' }}>
                            <p style={{ margin: 0, fontSize: 13, color: '#92400e', fontWeight: 500 }}>
                                💡 Notice: Changes made here go live immediately on your active theme.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SELECTION MODAL (Hand-rolled for maximum control over layout) */}
            {pickerOpen && (
                <div style={S.modalOverlay}>
                    <div style={S.modalContent}>
                        <div style={S.modalHeader}>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Select Replacement Section</h2>
                            <button onClick={() => setPickerOpen(false)} style={S.closeBtn}>
                                <CustomIcon name="close" size={20} />
                            </button>
                        </div>

                        <div style={S.modalBody}>
                            {/* Left Filters */}
                            <div style={S.modalSidebar}>
                                <div style={S.searchBox}>
                                    <CustomIcon name="search" size={14} color="#94a3b8" />
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
                                                    <div style={S.wireframeBox}>
                                                        <CustomIcon name="layout" size={32} color="#cbd5e1" />
                                                    </div>
                                                </div>
                                                <div style={S.cfSectionInfo}>
                                                    <div style={S.cfSectionName}>{section.name}</div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                                        <span style={S.cfConversionScore}>Score: {section.conversion_score}%</span>
                                                        <button
                                                            onClick={() => handleSelectCFSection(section)}
                                                            style={S.selectBtn}
                                                        >Select</button>
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

            {/* Notification Toast */}
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

            <style>{`
                @keyframes cfSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}

// ═════ STYLES ═════
const S = {
    root: { minHeight: '100vh', background: '#f8fafc', padding: '0 0 40px', fontFamily: "system-ui, -apple-system, sans-serif" },
    header: {
        background: '#fff', padding: '24px 40px', borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    pageTitle: { margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: '#0f172a' },
    pageSubtitle: { margin: 0, fontSize: 14, color: '#64748b' },

    mainLayout: { display: 'flex', gap: 24, padding: '32px 40px', maxWidth: 1400, margin: '0 auto', alignItems: 'flex-start' },

    mapContainer: {
        flex: 1, minWidth: 400, background: '#fff', borderRadius: 12,
        border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
    },
    mapHeader: { padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    mapBody: { padding: 20, minHeight: 400 },

    nodeList: { display: 'flex', flexDirection: 'column', gap: 12 },
    nodeCard: {
        display: 'flex', alignItems: 'center', padding: '16px 20px',
        border: '1px solid #e2e8f0', borderRadius: 8, gap: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'relative'
    },
    nodeIcon: { width: 40, height: 40, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    nodeName: { fontSize: 15, fontWeight: 600, color: '#1e293b', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 },
    cfBadge: { fontSize: 10, background: '#8b5cf6', color: '#fff', padding: '2px 6px', borderRadius: 12, fontWeight: 700, textTransform: 'uppercase' },
    nodeType: { fontSize: 12, color: '#64748b', fontFamily: 'monospace' },

    replaceBtn: {
        background: '#1e293b', color: '#fff', border: 'none', padding: '8px 16px',
        borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        transition: 'background 0.2s'
    },

    instructionContainer: { flex: 1, maxWidth: 500, position: 'sticky', top: 32 },
    instructionCard: { background: '#fff', borderRadius: 12, padding: 32, border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' },
    instructionIcon: { width: 48, height: 48, borderRadius: 12, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    instructionList: { margin: 0, paddingLeft: 20, color: '#475569', fontSize: 14, lineHeight: 1.7 },

    // Modal Styles
    modalOverlay: {
        position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, backdropFilter: 'blur(4px)'
    },
    modalContent: {
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 1200, height: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
    },
    modalHeader: { padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    closeBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 },

    modalBody: { flex: 1, display: 'flex', overflow: 'hidden' },
    modalSidebar: { width: 280, background: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: 20, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' },
    searchBox: { display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 12px', gap: 8 },
    searchInput: { border: 'none', outline: 'none', padding: '10px 0', fontSize: 14, width: '100%', background: 'transparent' },

    filterTitle: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', margin: 0 },
    categoryList: { display: 'flex', flexDirection: 'column', gap: 4 },
    catBtn: {
        padding: '8px 12px', background: 'transparent', border: 'none', borderRadius: 6,
        textAlign: 'left', fontSize: 14, color: '#334155', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    catBtnActive: { background: '#ebebeb', fontWeight: 600, color: '#0f172a' },
    catCount: { fontSize: 12, background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 10 },

    modalGrid: { flex: 1, padding: 32, overflowY: 'auto', background: '#fff' },
    gridLayout: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 },

    cfSectionCard: {
        border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s', ':hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }
    },
    cfSectionPreview: { height: 140, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    wireframeBox: { width: 120, height: 80, background: '#fff', border: '2px dashed #cbd5e1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    cfSectionInfo: { padding: 16 },
    cfSectionName: { fontSize: 14, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    cfConversionScore: { fontSize: 12, fontWeight: 600, color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: 4 },

    selectBtn: {
        background: '#8b5cf6', color: '#fff', border: 'none', padding: '6px 16px',
        borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer'
    }
};
