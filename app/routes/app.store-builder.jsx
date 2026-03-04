import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { useState, useMemo, useEffect } from "react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { hasActiveSubscription } from "../utils/billing.server";

// ═══════════════════════════════════════════════════════════
// SVG ICONS
// ═══════════════════════════════════════════════════════════
const ICONS = {
    back: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>`,
    check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`,
    play: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>`,
    sparkle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3v18"/><path d="M3 9h18"/><path d="M14.5 14.5L21 21"/><path d="M9.5 9.5L3 3"/><path d="M14.5 9.5L21 3"/><path d="M9.5 14.5L3 21"/></svg>`, // modified star
};

function Icon({ name, size = 16, color = 'currentColor', className = '' }) {
    return <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, color }}
        dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }} />;
}

// ═══════════════════════════════════════════════════════════
// LOADER
// ═══════════════════════════════════════════════════════════
export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const hasSubscription = await hasActiveSubscription(shop);
    if (!hasSubscription) {
        return json({ requiresSubscription: true });
    }

    const allSections = await db.sections.getAll();
    return json({ sections: allSections, shop });
};

// ═══════════════════════════════════════════════════════════
// STEPS CONFIGURATION
// ═══════════════════════════════════════════════════════════
const BUILDER_STEPS = [
    { id: 'announcement', label: 'Announcement Bar', filter: 'Announcement Bars' },
    { id: 'header', label: 'Header / Nav', filter: 'Headers' },
    { id: 'hero', label: 'Hero Section', filter: 'Hero Sections' },
    { id: 'trust', label: 'Trust Indicators', filter: 'Trust Indicators' },
    { id: 'features', label: 'Featured USP', filter: 'Features & Benefits' },
    { id: 'category', label: 'Shop by Category', filter: 'Category Sections' },
    { id: 'products', label: 'Product Showcase', filter: 'Products' }, // Or hero if missing
    { id: 'urgency', label: 'Sales Boosters', filter: 'Urgency Tools' },
    { id: 'story', label: 'Brand Story', filter: 'Features & Benefits' },
    { id: 'social', label: 'Social Proof', filter: 'Social Proof' },
    { id: 'faq', label: 'FAQ', filter: 'FAQ & Accordions' },
    { id: 'lead', label: 'Lead Capture', filter: 'Call to Action' },
    { id: 'footer', label: 'Store Footer', filter: 'Footers' },
];

// ═══════════════════════════════════════════════════════════
// UI COMPONENT
// ═══════════════════════════════════════════════════════════
export default function StoreBuilder() {
    const data = useLoaderData();
    const navigate = useNavigate();

    // If no subscription, show lock screen
    if (data?.requiresSubscription) {
        return (
            <div style={{ height: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter' }}>
                <div style={{ textAlign: 'center', maxWidth: 400 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Premium Feature</h1>
                    <p style={{ color: '#a1a1aa', marginBottom: 24, lineHeight: 1.6 }}>The comprehensive 13-step Store Builder engine requires an active ConvertFlow AI Premium subscription.</p>
                    <button onClick={() => navigate('/app/subscribe')} style={{ padding: '14px 28px', background: '#6366f1', color: '#fff', borderRadius: 10, border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                        Upgrade Now
                    </button>
                    <div style={{ marginTop: 12 }}>
                        <button onClick={() => navigate('/app')} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>Go Back</button>
                    </div>
                </div>
            </div>
        );
    }

    const sections = data.sections || [];

    // State
    const [activeStep, setActiveStep] = useState(0);
    const [selections, setSelections] = useState({}); // { stepId: sectionObject }
    const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
    const [previewSection, setPreviewSection] = useState(null); // The section currently hovered or selected

    // Current step info
    const step = BUILDER_STEPS[activeStep];
    const stepSections = useMemo(() => {
        let matched = sections.filter(s => s.category?.includes(step.filter) || step.filter.includes(s.category));
        // Fallback safely if no exact match (like 'Products')
        if (matched.length === 0) matched = sections.filter(s => s.category?.includes('Features'));
        return matched.sort((a, b) => b.conversion_score - a.conversion_score);
    }, [sections, step.filter]);

    const fetcher = useFetcher();

    const handleSelect = (section) => {
        setSelections({ ...selections, [step.id]: section });
        setPreviewSection(section);
        // Add a slight delay before auto-advancing
        setTimeout(() => {
            if (activeStep < BUILDER_STEPS.length - 1) {
                setActiveStep(activeStep + 1);
                setPreviewSection(null);
            }
        }, 600);
    };

    const handleBuildStore = () => {
        const selectedIds = Object.values(selections).map(s => s.id);
        if (selectedIds.length === 0) return;

        const fd = new FormData();
        fd.append("_action", "batch_install");
        fd.append("sectionIds", JSON.stringify(selectedIds));
        fetcher.submit(fd, { method: "post", action: "/api/store-builder" });
    };

    const handleHover = (section) => setPreviewSection(section);
    const handleHoverOut = () => setPreviewSection(selections[step.id] || null);

    const progress = ((Object.keys(selections).length) / BUILDER_STEPS.length) * 100;
    const isBuilding = fetcher.state !== "idle";

    // Watch for success
    useEffect(() => {
        if (fetcher.data && fetcher.state === 'idle') {
            if (fetcher.data.success) {
                alert(fetcher.data.message + "\\n\\nYour new store homepage is live!");
                navigate('/app');
            } else {
                alert("Error: " + fetcher.data.message);
            }
        }
    }, [fetcher.data, fetcher.state]);

    return (
        <div style={S.root}>
            {/* ═══ Header ═══ */}
            <div style={S.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => navigate(-1)} style={S.iconBtn}><Icon name="back" size={18} /></button>
                    <div>
                        <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Ultimate Store Builder</h1>
                        <p style={{ fontSize: 12, color: '#71717a', margin: '2px 0 0' }}>Step {activeStep + 1} of {BUILDER_STEPS.length}: {step.label}</p>
                    </div>
                </div>
                <div style={{ width: 300 }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7)', width: `${progress}%`, height: '100%', transition: 'width 0.4s' }} />
                    </div>
                </div>
                <button
                    onClick={handleBuildStore}
                    disabled={Object.keys(selections).length === 0 || isBuilding}
                    style={{
                        ...S.buildBtn,
                        opacity: (Object.keys(selections).length === 0 || isBuilding) ? 0.3 : 1,
                        cursor: (Object.keys(selections).length === 0 || isBuilding) ? 'default' : 'pointer',
                    }}
                >
                    {isBuilding ? 'Building...' : 'Build Store ✨'}
                </button>
            </div>

            <div style={S.main}>
                {/* ═══ Left Sidebar: Steps ═══ */}
                <div style={S.sidebar}>
                    {BUILDER_STEPS.map((s, idx) => {
                        const isDone = !!selections[s.id];
                        const isActive = idx === activeStep;
                        return (
                            <div
                                key={s.id}
                                onClick={() => setActiveStep(idx)}
                                style={{
                                    ...S.stepItem,
                                    borderLeftColor: isActive ? '#6366f1' : 'transparent',
                                    background: isActive ? 'rgba(255,255,255,0.02)' : 'transparent',
                                }}
                            >
                                <div style={{
                                    width: 24, height: 24, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: isDone ? '#22c55e' : isActive ? '#6366f1' : 'rgba(255,255,255,0.05)',
                                    color: (isDone || isActive) ? '#fff' : '#71717a', fontSize: 11, fontWeight: 700
                                }}>
                                    {isDone ? <Icon name="check" size={12} /> : idx + 1}
                                </div>
                                <span style={{ fontSize: 13, color: isActive ? '#fff' : (isDone ? '#a1a1aa' : '#52525b'), fontWeight: isActive ? 600 : 400 }}>
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* ═══ Middle: Options Grid ═══ */}
                <div style={S.optionsArea}>
                    <div style={{ padding: '32px 40px', maxWidth: 800, margin: '0 auto' }}>
                        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>
                            Choose a {step.label}
                        </h2>
                        <p style={{ color: '#a1a1aa', marginBottom: 32, fontSize: 14 }}>
                            Select a design that fits your brand. All content and colors can be fully customized later in your Shopify theme editor.
                        </p>

                        <div style={S.grid}>
                            {stepSections.map(s => {
                                const isSelected = selections[step.id]?.id === s.id;
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => handleSelect(s)}
                                        onMouseEnter={() => handleHover(s)}
                                        onMouseLeave={handleHoverOut}
                                        style={{
                                            ...S.card,
                                            borderColor: isSelected ? '#6366f1' : 'rgba(255,255,255,0.08)',
                                            background: isSelected ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)',
                                        }}
                                    >
                                        <div style={S.cardPreview}>
                                            {s.html_code ? (
                                                <div dangerouslySetInnerHTML={{ __html: s.html_code }}
                                                    style={{ transform: 'scale(0.25)', transformOrigin: 'top left', width: '400%', height: '400%', pointerEvents: 'none', background: '#fff' }} />
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.1 }}><Icon name="play" size={32} /></div>
                                            )}
                                            {isSelected && (
                                                <div style={S.cardSelectedBadge}>
                                                    <Icon name="check" size={14} /> Selected
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: 12 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5', marginBottom: 4 }}>{s.name}</div>
                                            <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>{s.conversion_score}% CV Score</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ═══ Right: Live Preview ═══ */}
                <div style={S.previewArea}>
                    {(previewSection || selections[step.id]) ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 12, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Live Preview</span>
                            </div>
                            <div style={{ flex: 1, padding: 24, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                                <div style={{
                                    width: '100%', maxWidth: 768, border: '1px solid #e4e4e7',
                                    borderRadius: 12, overflow: 'hidden', background: '#fff',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                                }}>
                                    {/* Browser bar mini */}
                                    <div style={{ background: '#f4f4f5', padding: '10px 16px', borderBottom: '1px solid #e4e4e7', display: 'flex', gap: 6 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: 5, background: '#ef4444' }} />
                                        <div style={{ width: 10, height: 10, borderRadius: 5, background: '#f59e0b' }} />
                                        <div style={{ width: 10, height: 10, borderRadius: 5, background: '#22c55e' }} />
                                    </div>
                                    <div dangerouslySetInnerHTML={{ __html: (previewSection || selections[step.id]).html_code }} style={{ pointerEvents: 'none' }} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#52525b' }}>
                            <Icon name="play" size={48} className="spin-slow" />
                            <p style={{ marginTop: 16, fontSize: 13 }}>Hover over a design to preview</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 8px; height: 8px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
                .spin-slow { animation: spin 4s linear infinite; opacity: 0.2; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

const S = {
    root: { background: '#09090b', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" },
    header: { height: 60, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#111114' },
    iconBtn: { width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    buildBtn: { padding: '8px 20px', background: '#fff', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
    main: { display: 'flex', flex: 1, overflow: 'hidden' },
    sidebar: { width: 260, borderRight: '1px solid rgba(255,255,255,0.06)', background: '#111114', overflowY: 'auto' },
    stepItem: { padding: '16px 24px', borderLeft: '3px solid transparent', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.2s' },
    optionsArea: { flex: 1, overflowY: 'auto', background: '#09090b' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 },
    card: { border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' },
    cardPreview: { height: 120, background: '#18181b', overflow: 'hidden', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    cardSelectedBadge: { position: 'absolute', top: 8, right: 8, background: '#6366f1', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
    previewArea: { width: '45%', borderLeft: '1px solid rgba(255,255,255,0.06)', background: '#0c0c0f' },
};
