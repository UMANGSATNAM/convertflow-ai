import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { Spinner } from "@shopify/polaris";

// ═══════ WIDGET CONFIG ═══════
const WIDGETS = [
    {
        id: 'shipping-bar',
        name: 'Free Shipping Bar',
        icon: '🚚',
        desc: 'Show a fixed bottom bar encouraging larger orders with free shipping threshold.',
        color: '#059669',
        fields: [
            { key: 'threshold', label: 'Threshold ($)', type: 'number', default: 50 },
            { key: 'message', label: 'Message', type: 'text', default: 'Free shipping on orders over $${threshold}!' },
            { key: 'barColor', label: 'Bar Color', type: 'color', default: '#059669' },
            { key: 'textColor', label: 'Text Color', type: 'color', default: '#ffffff' },
        ]
    },
    {
        id: 'countdown-timer',
        name: 'Countdown Timer',
        icon: '⏳',
        desc: 'Create urgency with a countdown timer banner at the top of your store.',
        color: '#dc2626',
        fields: [
            { key: 'title', label: 'Title', type: 'text', default: 'Flash Sale Ends In' },
            { key: 'endDate', label: 'End Date', type: 'datetime-local', default: '' },
            { key: 'barColor', label: 'Bar Color', type: 'color', default: '#dc2626' },
            { key: 'textColor', label: 'Text Color', type: 'color', default: '#ffffff' },
        ]
    },
    {
        id: 'trust-badges',
        name: 'Trust Badges',
        icon: '🛡️',
        desc: 'Add trust badges (Secure Checkout, Free Shipping, Returns) below the Add to Cart button.',
        color: '#6366f1',
        fields: [
            { key: 'position', label: 'Position', type: 'select', options: ['below_atc', 'footer'], default: 'below_atc' },
        ]
    },
    {
        id: 'social-proof',
        name: 'Social Proof Popup',
        icon: '🔔',
        desc: 'Show "Someone just purchased..." notifications to increase buyer confidence and FOMO.',
        color: '#f59e0b',
        fields: [
            { key: 'interval', label: 'Show every (ms)', type: 'number', default: 8000 },
            { key: 'bgColor', label: 'Background Color', type: 'color', default: '#ffffff' },
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
    const [installed, setInstalled] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [themeName, setThemeName] = useState('');
    const [configs, setConfigs] = useState({});
    const [notification, setNotification] = useState(null);
    const [expandedWidget, setExpandedWidget] = useState(null);

    useEffect(() => {
        fetch('/api/sales-boosters')
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setInstalled(data.installed || {});
                    setThemeName(data.themeName);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        // Init default configs
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
    };

    const handleUninstall = (widgetId) => {
        if (!confirm("Remove this widget from your store?")) return;
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
                // Refresh installed status
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
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>💰 Sales Boosters</h1>
                    <p style={S.subtitle}>One-click widgets to increase conversions on your {themeName || 'store'}.</p>
                </div>
            </div>

            <div style={S.content}>
                <div style={S.grid}>
                    {WIDGETS.map(widget => {
                        const isInstalled = installed[widget.id];
                        const isExpanded = expandedWidget === widget.id;

                        return (
                            <div key={widget.id} style={{
                                ...S.card,
                                borderTop: `4px solid ${widget.color}`
                            }}>
                                <div style={S.cardHeader}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ ...S.cardIcon, background: `${widget.color}15` }}>
                                            <span style={{ fontSize: 28 }}>{widget.icon}</span>
                                        </div>
                                        <div>
                                            <h3 style={S.cardName}>{widget.name}</h3>
                                            <p style={S.cardDesc}>{widget.desc}</p>
                                        </div>
                                    </div>
                                    <div style={S.statusBadge(isInstalled)}>
                                        {isInstalled ? '✓ Active' : 'Inactive'}
                                    </div>
                                </div>

                                {/* Config: show on expand */}
                                <button onClick={() => setExpandedWidget(isExpanded ? null : widget.id)} style={S.expandBtn}>
                                    {isExpanded ? '▲ Hide Settings' : '▼ Configure & Install'}
                                </button>

                                {isExpanded && (
                                    <div style={S.configSection}>
                                        {widget.fields.map(field => (
                                            <div key={field.key} style={S.fieldRow}>
                                                <label style={S.fieldLabel}>{field.label}</label>
                                                {field.type === 'select' ? (
                                                    <select
                                                        value={configs[widget.id]?.[field.key] || field.default}
                                                        onChange={e => updateConfig(widget.id, field.key, e.target.value)}
                                                        style={S.fieldInput}
                                                    >
                                                        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        value={configs[widget.id]?.[field.key] || field.default}
                                                        onChange={e => updateConfig(widget.id, field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                                                        style={field.type === 'color' ? S.colorInputField : S.fieldInput}
                                                    />
                                                )}
                                            </div>
                                        ))}

                                        <div style={S.actionRow}>
                                            <button onClick={() => handleInstall(widget.id)} style={S.installBtn(widget.color)}>
                                                {isInstalled ? '🔄 Reinstall' : '⚡ Install to Store'}
                                            </button>
                                            {isInstalled && (
                                                <button onClick={() => handleUninstall(widget.id)} style={S.uninstallBtn}>
                                                    🗑️ Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Right info panel */}
                <div style={S.infoPanel}>
                    <div style={S.infoCard}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: '#1e293b' }}>⚡ How It Works</h3>
                        <ol style={{ margin: 0, paddingLeft: 20, color: '#475569', fontSize: 14, lineHeight: 2 }}>
                            <li>Expand a widget card</li>
                            <li>Configure colors and settings</li>
                            <li>Click <strong>Install to Store</strong></li>
                            <li>Widget goes live immediately!</li>
                        </ol>
                    </div>
                    <div style={{ ...S.infoCard, background: '#fffbeb', border: '1px solid #fef3c7', marginTop: 16 }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#92400e', fontWeight: 500 }}>
                            ⚠️ All widgets inject directly into your active theme. Click "Remove" to cleanly uninstall.
                        </p>
                    </div>
                    <div style={{ ...S.infoCard, marginTop: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {WIDGETS.map(w => (
                                <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                    <span>{w.icon}</span>
                                    <span style={{ flex: 1, color: '#334155', fontWeight: 600 }}>{w.name}</span>
                                    <span style={{
                                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                                        background: installed[w.id] ? '#d1fae5' : '#f1f5f9',
                                        color: installed[w.id] ? '#059669' : '#94a3b8'
                                    }}>
                                        {installed[w.id] ? 'Active' : 'Off'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                    padding: '14px 24px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                    color: '#fff', display: 'flex', alignItems: 'center', gap: 10,
                    background: notification.type === 'success' ? '#059669' : notification.type === 'error' ? '#dc2626' : '#2563eb',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
                }}>
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
    header: { background: '#fff', padding: '24px 32px', borderBottom: '1px solid #e2e8f0' },
    title: { margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' },
    subtitle: { margin: '6px 0 0', fontSize: 14, color: '#64748b' },

    content: { display: 'flex', gap: 24, padding: '24px 32px', maxWidth: 1400, margin: '0 auto', alignItems: 'flex-start' },
    grid: { flex: 1, display: 'flex', flexDirection: 'column', gap: 16 },

    card: {
        background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    },
    cardHeader: { padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardIcon: { width: 52, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    cardName: { margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' },
    cardDesc: { margin: '4px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 },

    statusBadge: (active) => ({
        padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 700,
        background: active ? '#d1fae5' : '#f1f5f9', color: active ? '#059669' : '#94a3b8'
    }),

    expandBtn: {
        width: '100%', padding: '10px 24px', background: '#f8fafc', border: 'none',
        borderTop: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600,
        color: '#6366f1', cursor: 'pointer', textAlign: 'center'
    },

    configSection: { padding: '20px 24px', background: '#fafbfc', borderTop: '1px solid #e2e8f0' },
    fieldRow: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 },
    fieldLabel: { fontSize: 13, fontWeight: 600, color: '#374151', minWidth: 140 },
    fieldInput: {
        flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8,
        fontSize: 14, fontFamily: 'inherit', outline: 'none'
    },
    colorInputField: { width: 44, height: 36, border: '1px solid #d1d5db', borderRadius: 8, padding: 2, cursor: 'pointer' },

    actionRow: { display: 'flex', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0' },
    installBtn: (color) => ({
        flex: 1, padding: '12px 20px', background: color, color: '#fff',
        border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer'
    }),
    uninstallBtn: {
        padding: '12px 20px', background: '#fff', color: '#dc2626',
        border: '1px solid #fecaca', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer'
    },

    infoPanel: { width: 320, position: 'sticky', top: 24, flexShrink: 0 },
    infoCard: {
        background: '#fff', borderRadius: 12, padding: 20,
        border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }
};
