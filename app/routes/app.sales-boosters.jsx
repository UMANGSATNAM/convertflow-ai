import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { Spinner } from "@shopify/polaris";

// ═══════ SVG ICON HELPER ═══════
const Icon = ({ svg, size = 24 }) => (
    <span style={{ display: 'inline-flex', width: size, height: size, alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: svg }} />
);

// ═══════ DEBUTIFY-STYLE ICONS ═══════
const ICONS = {
    gift: `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
    arrowUp: `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`, // House/Arrow up variation
    cookie: `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0-3 18.5"/><path d="M12 2a10 10 0 0 1 3 18.5"/><circle cx="9" cy="14" r="1"/><circle cx="14" cy="11" r="1"/><circle cx="15" cy="16" r="1"/><circle cx="9.5" cy="9" r="1"/></svg>`, // Cookie-ish
    clock: `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    megaphone: `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5c-4 0-7 2.69-7 6 0 1.25.4 2.42 1.09 3.38L4 18l3.62-1.09A6.974 6.974 0 0 0 11 17c4 0 7-2.69 7-6s-3-2.69-7-6z"/><path d="M20.59 13.41l-2.09 2.09"/><path d="M22 9h-3"/><path d="M20.59 4.59l-2.09 2.09"/></svg>`,
    tag: `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
    wheel: `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="4.93" y1="19.07" x2="19.07" y2="4.93"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`,
    check: `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    arrowRight: `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>`
};

// ═══════ WIDGET CONFIG (7 APPS FROM PRD) ═══════
const WIDGETS = [
    {
        id: 'spending-goal',
        name: 'ConvertFlow Spending Goal',
        icon: ICONS.gift,
        desc: 'Encourage bigger purchases',
        color: '#8b5cf6',
        fields: [
            { key: 'goal', label: 'Goal Threshold ($)', type: 'number', default: 50 },
            { key: 'color', label: 'Progress Color', type: 'color', default: '#8b5cf6' },
        ]
    },
    {
        id: 'back-to-top',
        name: 'ConvertFlow Back To Top',
        icon: ICONS.arrowUp,
        desc: 'Quick-scroll navigation button',
        color: '#8b5cf6',
        fields: [
            { key: 'color', label: 'Button Color', type: 'color', default: '#8b5cf6' },
        ]
    },
    {
        id: 'gdpr-cookie',
        name: 'ConvertFlow GDPR Cookie Consent Banner',
        icon: ICONS.cookie,
        desc: 'Display cookie consent notices',
        color: '#8b5cf6',
        fields: [
            { key: 'color', label: 'Accept Button Color', type: 'color', default: '#8b5cf6' },
        ]
    },
    {
        id: 'urgency-timer',
        name: 'ConvertFlow Urgency Countdown Timer',
        icon: ICONS.clock,
        desc: 'Create time-sensitive urgency',
        color: '#8b5cf6',
        fields: [
            { key: 'minutes', label: 'Countdown (Minutes)', type: 'number', default: 15 },
            { key: 'color', label: 'Accent Color', type: 'color', default: '#ef4444' },
        ]
    },
    {
        id: 'announcement-bar',
        name: 'ConvertFlow Announcement Bar & Banner',
        icon: ICONS.megaphone,
        desc: 'Share updates with storefront banners',
        color: '#8b5cf6',
        fields: [
            { key: 'text', label: 'Announcement Text', type: 'text', default: '🔥 HUGE SALE: 50% OFF EVERYTHING TODAY ONLY!' },
            { key: 'bgColor', label: 'Background Color', type: 'color', default: '#0f172a' },
            { key: 'textColor', label: 'Text Color', type: 'color', default: '#ffffff' },
        ]
    },
    {
        id: 'volume-discounts',
        name: 'ConvertFlow Volume Discount Bundles',
        icon: ICONS.tag,
        desc: 'Reward multi-item purchases',
        color: '#8b5cf6',
        fields: [
            { key: 'color', label: 'Active Choice Color', type: 'color', default: '#3b82f6' },
        ]
    },
    {
        id: 'spin-wheel',
        name: 'ConvertFlow Spin Wheel Email Pop Up',
        icon: ICONS.wheel,
        desc: 'Gamify email capture strategy',
        color: '#8b5cf6',
        fields: [
            { key: 'color', label: 'Theme Color', type: 'color', default: '#ec4899' },
        ]
    }
];

// ═══════ LOADER ═══════
export const loader = async ({ request }) => {
    await authenticate.admin(request);
    return json({});
};

// ═══════ MAIN COMPONENT ═══════
export default function SalesBoosters() {
    const fetcher = useFetcher();
    const navigate = useNavigate();
    const [installed, setInstalled] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [configs, setConfigs] = useState({});
    const [notification, setNotification] = useState(null);
    const [configModal, setConfigModal] = useState(null); // Which widget is currently being configured?

    useEffect(() => {
        fetch('/api/sales-boosters')
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setInstalled(data.installed || {});
                }
            })
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        const c = {};
        WIDGETS.forEach(w => {
            c[w.id] = {};
            w.fields.forEach(f => { c[w.id][f.key] = f.default; });
        });
        setConfigs(c);
    }, []);

    const handleInstall = (widgetId) => {
        setNotification({ type: 'loading', text: `Installing ${widgetId}...` });
        const fd = new FormData();
        fd.append("intent", "install");
        fd.append("widgetId", widgetId);
        fd.append("config", JSON.stringify(configs[widgetId] || {}));
        fetcher.submit(fd, { method: "post", action: "/api/sales-boosters" });
        setConfigModal(null);
    };

    const handleUninstall = (widgetId) => {
        if (!window.confirm("Remove this widget from your store?")) return;
        setNotification({ type: 'loading', text: `Removing ${widgetId}...` });
        const fd = new FormData();
        fd.append("intent", "uninstall");
        fd.append("widgetId", widgetId);
        fetcher.submit(fd, { method: "post", action: "/api/sales-boosters" });
    };

    useEffect(() => {
        if (fetcher.data && fetcher.state === 'idle') {
            if (fetcher.data.success) {
                setNotification({ type: 'success', text: fetcher.data.message });
                fetch('/api/sales-boosters').then(r => r.json()).then(d => { if (d.success) setInstalled(d.installed || {}); });
            } else {
                setNotification({ type: 'error', text: fetcher.data.error || 'Action failed' });
            }
            setTimeout(() => setNotification(null), 5000);
        }
    }, [fetcher.data, fetcher.state]);

    const updateConfig = (widgetId, key, value) => {
        setConfigs(prev => ({
            ...prev,
            [widgetId]: { ...(prev[widgetId] || {}), [key]: value }
        }));
    };

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><Spinner size="large" /></div>;
    }

    return (
        <div style={S.root}>
            <style>{`
                * { box-sizing: border-box; }
                .sb-topbar { flex-wrap: wrap; }
                @media (max-width: 600px) {
                    .sb-topbar h1 { font-size: 16px !important; }
                    .sb-grid { grid-template-columns: 1fr !important; }
                }
                @media (min-width: 601px) and (max-width: 900px) {
                    .sb-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
            `}</style>
            {/* ══ TOP BAR ══ */}
            <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <button onClick={() => navigate('/app/builder')} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0 }}>←</button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Conversion Booster Apps</h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>One-click widgets to increase your store's conversion rate instantly.</p>
                </div>
            </div>

            <div style={S.content}>
                <div style={S.grid}>
                    {WIDGETS.map(widget => {
                        const isInstalled = installed[widget.id];

                        return (
                            <div key={widget.id} style={S.card}>
                                {isInstalled && <div style={S.activeBadge}><Icon svg={ICONS.check} size={14} /> Installed</div>}

                                <div style={S.cardIconWrap}>
                                    <Icon svg={widget.icon} size={28} />
                                </div>
                                <h3 style={S.cardName}>{widget.name}</h3>
                                <p style={S.cardDesc}>{widget.desc}</p>

                                {isInstalled ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginTop: 24 }}>
                                        <button onClick={() => setConfigModal(widget)} style={{ ...S.installBtn, background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }}>
                                            Configure Settings
                                        </button>
                                        <button onClick={() => handleUninstall(widget.id)} style={{ ...S.installBtn, background: '#fff', color: '#ef4444', border: '1px solid #fee2e2' }}>
                                            Uninstall
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button onClick={() => setConfigModal(widget)} style={S.installBtn}>
                                            Install <Icon svg={ICONS.arrowRight} size={16} style={{ marginLeft: 6 }} />
                                        </button>
                                        <a href="#" onClick={(e) => { e.preventDefault(); setConfigModal(widget); }} style={S.learnMoreLink}>
                                            Learn More
                                        </a>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Config Modal */}
            {configModal && (
                <div style={S.modalOverlay} onClick={() => setConfigModal(null)}>
                    <div style={S.modal} onClick={e => e.stopPropagation()}>
                        <div style={S.modalHeader}>
                            <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ color: '#8b5cf6' }}><Icon svg={configModal.icon} size={24} /></span>
                                {configModal.name} Configure
                            </h2>
                            <button onClick={() => setConfigModal(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b' }}>&times;</button>
                        </div>
                        <div style={S.modalBody}>
                            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>{configModal.desc}. Configure your settings below before installing.</p>

                            {configModal.fields.map(field => (
                                <div key={field.key} style={S.fieldRow}>
                                    <label style={S.fieldLabel}>{field.label}</label>
                                    <input
                                        type={field.type}
                                        value={configs[configModal.id]?.[field.key] || field.default}
                                        onChange={e => updateConfig(configModal.id, field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                                        style={field.type === 'color' ? S.colorInputField : S.fieldInput}
                                    />
                                </div>
                            ))}
                        </div>
                        <div style={S.modalFooter}>
                            <button onClick={() => setConfigModal(null)} style={{ padding: '10px 16px', borderRadius: 8, background: '#f1f5f9', color: '#64748b', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => handleInstall(configModal.id)} style={{ padding: '10px 24px', borderRadius: 8, background: '#8b5cf6', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                                {installed[configModal.id] ? 'Save & Reinstall' : 'Install Widget'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification */}
            {notification && (
                <div style={S.toast(notification.type)}>
                    {notification.type === 'loading' && <Spinner size="small" />}
                    {notification.text}
                </div>
            )}
        </div>
    );
}

// ═══════ STYLES ═══════
const S = {
    root: { minHeight: '100vh', background: '#f8fafc', fontFamily: "system-ui, -apple-system, sans-serif" },
    content: { padding: 'clamp(20px, 4vw, 40px) clamp(16px, 3vw, 32px)', maxWidth: 1200, margin: '0 auto' },

    // Grid matches Debutify screenshot: 4 columns
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 },

    // Card matches Debutify styling: tall white card, centered text, purple icon block
    card: {
        background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
        padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)'
    },

    activeBadge: {
        position: 'absolute', top: 12, right: 12, background: '#d1fae5', color: '#059669',
        padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4
    },

    cardIconWrap: {
        width: 48, height: 48, borderRadius: 12, background: '#8b5cf6', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20
    },
    cardName: { margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 },
    cardDesc: { margin: '0 0 28px', fontSize: 14, color: '#64748b', lineHeight: 1.5, flex: 1 },

    // The [ Install -> ] button
    installBtn: {
        width: '140px', padding: '10px 0', background: 'transparent',
        border: '1.5px solid #a78bfa', borderRadius: '30px', color: '#0f172a',
        fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.2s', margin: '0 auto 16px'
    },

    learnMoreLink: {
        color: '#0f172a', fontSize: 13, fontWeight: 700, textDecoration: 'underline',
        textUnderlineOffset: 4, decorationThickness: 2
    },

    // Modal
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#fff', borderRadius: 16, width: 440, maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    modalHeader: { padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalBody: { padding: '24px' },
    modalFooter: { padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#f8fafc', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },

    fieldRow: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 },
    fieldLabel: { fontSize: 13, fontWeight: 600, color: '#334155' },
    fieldInput: { padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, outline: 'none' },
    colorInputField: { width: 60, height: 40, border: '1px solid #cbd5e1', borderRadius: 8, padding: 3, cursor: 'pointer' },

    // Toast
    toast: (type) => ({
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        padding: '14px 24px', borderRadius: 12, fontWeight: 600, fontSize: 14,
        color: '#fff', display: 'flex', alignItems: 'center', gap: 10,
        background: type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#2563eb',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
    })
};
