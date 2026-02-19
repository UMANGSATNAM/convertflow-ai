import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { hasActiveSubscription } from "../utils/billing.server";
import { installSectionToTheme } from "../utils/theme-integration.server";

export const loader = async ({ request, params }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const { id } = params;

    const hasSubscription = await hasActiveSubscription(shop);
    if (!hasSubscription) {
        throw new Response("Subscription required", { status: 403 });
    }

    const section = await db.sections.getById(id);
    if (!section) {
        throw new Response("Section not found", { status: 404 });
    }

    const shopRecord = await db.shops.findByDomain(shop);
    const customizations = await db.customizations.getByShop(shopRecord.id);
    const existing = customizations.find(c => c.section_id === parseInt(id));

    let savedSettings = {};
    if (existing?.custom_settings) {
        try {
            savedSettings = typeof existing.custom_settings === 'string'
                ? JSON.parse(existing.custom_settings)
                : existing.custom_settings;
        } catch (e) { }
    }

    return json({ section, shopId: shopRecord.id, savedSettings });
};

export const action = async ({ request, params }) => {
    const { session, admin } = await authenticate.admin(request);
    const shop = session.shop;
    const { id } = params;
    const formData = await request.formData();
    const actionType = formData.get("_action");
    const shopRecord = await db.shops.findByDomain(shop);

    if (actionType === "save") {
        const settings = JSON.parse(formData.get("settings"));
        await db.customizations.save(shopRecord.id, parseInt(id), settings);
        return json({ _action: "save", success: true, message: "Settings saved!" });
    }

    if (actionType === "install") {
        try {
            const section = await db.sections.getById(id);
            if (!section) return json({ _action: "install", success: false, message: "Section not found." });

            // Apply custom settings to HTML before installing
            let customHtml = section.html_code || '';
            try {
                const settingsStr = formData.get("settings");
                if (settingsStr) {
                    const settings = JSON.parse(settingsStr);
                    customHtml = applySettingsToHtml(customHtml, settings);
                }
            } catch (e) { }

            const modifiedSection = { ...section, html_code: customHtml };
            const result = await installSectionToTheme(admin, modifiedSection, {});

            return json({
                _action: "install",
                success: result.success,
                message: result.success ? result.message : result.error,
            });
        } catch (error) {
            console.error("Install error:", error);
            return json({ _action: "install", success: false, message: error.message || "Installation failed." });
        }
    }

    return json({ success: false, message: "Invalid action" });
};

/**
 * Apply customization settings to raw HTML before installing or previewing
 */
function applySettingsToHtml(html, settings) {
    let modified = html;

    // Apply background color
    if (settings.backgroundColor) {
        // Replace background colors in the outermost container
        modified = modified.replace(
            /(background\s*:\s*)([^;}"']+)/gi,
            (match, prefix, value) => {
                // Only replace if it looks like a solo background color (not gradients in inner elements)
                if (value.includes('gradient') || value.includes('url(')) return match;
                return `${prefix}${settings.backgroundColor}`;
            }
        );
    }

    return modified;
}

export default function SectionCustomize() {
    const { section, shopId, savedSettings } = useLoaderData();
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const iframeRef = useRef(null);

    // Settings state
    const [settings, setSettings] = useState({
        heading: '',
        description: '',
        buttonText: '',
        primaryColor: '#6366f1',
        textColor: '#ffffff',
        backgroundColor: '#ffffff',
        paddingTop: 0,
        paddingBottom: 0,
        borderRadius: 8,
        ...savedSettings,
    });

    const [activeTab, setActiveTab] = useState('preview');
    const [previewMode, setPreviewMode] = useState('desktop');
    const [hasChanges, setHasChanges] = useState(false);
    const [notification, setNotification] = useState(null);
    const [showCode, setShowCode] = useState(false);
    const [copyMsg, setCopyMsg] = useState('');
    const [isInstalling, setIsInstalling] = useState(false);

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    // Build the live preview HTML with settings applied
    const previewHtml = useMemo(() => {
        let html = section.html_code || '';

        // Wrap in a full HTML document for the iframe
        return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
  
  /* Custom overrides from settings panel */
  .cf-section-wrapper {
    padding-top: ${settings.paddingTop}px;
    padding-bottom: ${settings.paddingBottom}px;
  }
</style>
</head>
<body>
<div class="cf-section-wrapper">
${html}
</div>
</body>
</html>`;
    }, [section.html_code, settings]);

    // Update iframe whenever previewHtml changes
    useEffect(() => {
        if (iframeRef.current) {
            const iframe = iframeRef.current;
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (doc) {
                doc.open();
                doc.write(previewHtml);
                doc.close();
            }
        }
    }, [previewHtml]);

    const handleSave = () => {
        const formData = new FormData();
        formData.append("_action", "save");
        formData.append("settings", JSON.stringify(settings));
        fetcher.submit(formData, { method: "post" });
        setHasChanges(false);
    };

    const handleInstall = () => {
        setIsInstalling(true);
        const formData = new FormData();
        formData.append("_action", "install");
        formData.append("settings", JSON.stringify(settings));
        fetcher.submit(formData, { method: "post" });
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(section.html_code || '');
        setCopyMsg('Copied!');
        setTimeout(() => setCopyMsg(''), 2000);
    };

    // Handle API responses
    useEffect(() => {
        if (fetcher.data && fetcher.state === 'idle') {
            setIsInstalling(false);
            const type = fetcher.data.success ? 'success' : 'error';
            setNotification({ type, text: fetcher.data.message });
            setTimeout(() => setNotification(null), 6000);
        }
    }, [fetcher.data, fetcher.state]);

    const scoreColor = section.conversion_score >= 93 ? '#4ade80'
        : section.conversion_score >= 88 ? '#fbbf24' : '#94a3b8';

    const previewWidth = previewMode === 'desktop' ? '100%'
        : previewMode === 'tablet' ? '768px' : '375px';

    return (
        <div style={S.root}>
            {/* ═══ TOP BAR ═══ */}
            <div style={S.topBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate(-1)} style={S.backBtn}>←</button>
                    <div>
                        <h1 style={S.title}>{section.name}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                            <span style={S.subtitle}>{section.category} • #{section.variation_number}</span>
                            <span style={{ ...S.scoreBadge, background: `${scoreColor}22`, color: scoreColor }}>
                                {section.conversion_score}%
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Device Toggle */}
                    <div style={S.toggleGroup}>
                        {[
                            { id: 'desktop', icon: '🖥️' },
                            { id: 'tablet', icon: '📱' },
                            { id: 'mobile', icon: '📲' },
                        ].map(m => (
                            <button key={m.id}
                                onClick={() => setPreviewMode(m.id)}
                                style={{
                                    ...S.toggleBtn,
                                    background: previewMode === m.id ? 'rgba(99,102,241,0.3)' : 'transparent',
                                    color: previewMode === m.id ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                                }}
                            >{m.icon}</button>
                        ))}
                    </div>

                    <button onClick={() => setShowCode(!showCode)} style={{
                        ...S.actionBtn,
                        background: showCode ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
                        color: showCode ? '#a78bfa' : '#fff',
                    }}>{'</>'}</button>

                    <button onClick={handleSave} disabled={!hasChanges} style={{
                        ...S.actionBtn,
                        background: hasChanges ? '#6366f1' : 'rgba(255,255,255,0.06)',
                        color: hasChanges ? '#fff' : 'rgba(255,255,255,0.3)',
                        cursor: hasChanges ? 'pointer' : 'default',
                    }}>
                        {hasChanges ? '💾 Save' : '✓ Saved'}
                    </button>

                    <button onClick={handleInstall} disabled={isInstalling} style={S.installBtn}>
                        {isInstalling ? '⏳ Installing...' : '🚀 Install to Theme'}
                    </button>
                </div>
            </div>

            {/* ═══ MAIN AREA ═══ */}
            <div style={S.main}>
                {/* ─── Left Panel ─── */}
                <div style={S.sidebar}>
                    <div style={S.tabBar}>
                        {[
                            { id: 'preview', label: 'Preview', icon: '👁️' },
                            { id: 'design', label: 'Design', icon: '🎨' },
                            { id: 'content', label: 'Content', icon: '📝' },
                        ].map(tab => (
                            <button key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    ...S.tabBtn,
                                    color: activeTab === tab.id ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                                    borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                                }}
                            >{tab.icon} {tab.label}</button>
                        ))}
                    </div>

                    <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
                        {activeTab === 'preview' && (
                            <div>
                                <InfoCard label="Section Details">
                                    <InfoRow left="Category" right={section.category} />
                                    <InfoRow left="Variation" right={`#${section.variation_number}`} />
                                    <InfoRow left="Score" right={`${section.conversion_score}%`} rightColor={scoreColor} />
                                    <InfoRow left="Status" right="Ready to install" rightColor="#4ade80" />
                                </InfoCard>
                                <div style={S.infoBox}>
                                    <p style={S.infoText}>
                                        Use the <b style={{ color: '#a78bfa' }}>Design</b> tab to adjust colors & spacing.
                                        Use <b style={{ color: '#a78bfa' }}>Content</b> to edit text.
                                        Changes appear in the live preview instantly.
                                    </p>
                                    <p style={{ ...S.infoText, marginTop: 10 }}>
                                        Click <b style={{ color: '#4ade80' }}>Install to Theme</b> to add this section to your Shopify store.
                                        Then go to <b style={{ color: '#a78bfa' }}>Online Store → Customize</b> and search for <b>CF:</b> to find it.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'design' && (
                            <div>
                                <ControlGroup label="Spacing">
                                    <RangeInput label="Padding Top" value={settings.paddingTop}
                                        min={0} max={200} onChange={v => updateSetting('paddingTop', v)} />
                                    <RangeInput label="Padding Bottom" value={settings.paddingBottom}
                                        min={0} max={200} onChange={v => updateSetting('paddingBottom', v)} />
                                    <RangeInput label="Border Radius" value={settings.borderRadius}
                                        min={0} max={50} onChange={v => updateSetting('borderRadius', v)} />
                                </ControlGroup>

                                <ControlGroup label="Colors (applied at install)">
                                    <ColorInput label="Primary Color" value={settings.primaryColor}
                                        onChange={v => updateSetting('primaryColor', v)} />
                                    <ColorInput label="Text Color" value={settings.textColor}
                                        onChange={v => updateSetting('textColor', v)} />
                                    <ColorInput label="Background" value={settings.backgroundColor}
                                        onChange={v => updateSetting('backgroundColor', v)} />
                                </ControlGroup>

                                <div style={{ ...S.infoBox, marginTop: 16 }}>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                                        💡 <b>Spacing</b> changes update the preview in real-time.
                                        <b> Color</b> settings are saved and applied when you install to your theme.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div>
                                <ControlGroup label="Editable Text">
                                    <TextInput label="Custom Heading" value={settings.heading}
                                        placeholder="Leave empty to use default..."
                                        onChange={v => updateSetting('heading', v)} />
                                    <TextAreaInput label="Custom Description" value={settings.description}
                                        placeholder="Leave empty to use default..."
                                        onChange={v => updateSetting('description', v)} />
                                    <TextInput label="Custom Button Text" value={settings.buttonText}
                                        placeholder="Leave empty to use default..."
                                        onChange={v => updateSetting('buttonText', v)} />
                                </ControlGroup>

                                <div style={{ ...S.infoBox, marginTop: 16 }}>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                                        💡 Content settings are saved to your customization profile.
                                        After installing, you can edit text directly in Shopify's theme customizer.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Preview Area ─── */}
                <div style={S.previewArea}>
                    {showCode ? (
                        <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>HTML / CSS Source</span>
                                <button onClick={handleCopyCode} style={S.copyBtn}>
                                    {copyMsg || '📋 Copy Code'}
                                </button>
                            </div>
                            <pre style={S.codeBlock}>
                                {section.html_code || '<!-- No HTML code -->'}
                            </pre>
                        </div>
                    ) : (
                        <div style={{
                            width: previewWidth, maxWidth: '100%',
                            transition: 'width 0.3s ease',
                            borderRadius: 12, overflow: 'hidden',
                            boxShadow: '0 8px 40px rgba(0,0,0,0.3)', margin: '0 auto',
                        }}>
                            {/* Browser Chrome */}
                            <div style={S.browserChrome}>
                                <div style={{ display: 'flex', gap: 5 }}>
                                    <div style={{ ...S.dot, background: '#ef4444' }} />
                                    <div style={{ ...S.dot, background: '#f59e0b' }} />
                                    <div style={{ ...S.dot, background: '#22c55e' }} />
                                </div>
                                <div style={S.urlBar}>your-store.myshopify.com</div>
                            </div>
                            {/* Iframe Preview */}
                            <iframe
                                ref={iframeRef}
                                style={{
                                    width: '100%', minHeight: 500, border: 'none',
                                    background: '#fff', display: 'block',
                                }}
                                title="Section Preview"
                                sandbox="allow-same-origin"
                            />
                        </div>
                    )}
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                            {showCode ? 'Source Code View' : `Live Preview • ${previewMode.charAt(0).toUpperCase() + previewMode.slice(1)}`}
                        </span>
                    </div>
                </div>
            </div>

            {/* ═══ NOTIFICATIONS ═══ */}
            {notification && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 50,
                    padding: '14px 24px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                    color: '#fff', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 500,
                    background: notification.type === 'success' ? '#22c55e' : '#ef4444',
                    boxShadow: `0 8px 30px ${notification.type === 'success' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                    animation: 'slideUp 0.3s ease-out',
                }}>
                    <span>{notification.type === 'success' ? '🚀' : '⚠️'}</span>
                    {notification.text}
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                * { box-sizing: border-box; }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

/* ═══ STYLES ═══ */
const S = {
    root: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', fontFamily: "'Inter', system-ui, sans-serif" },
    topBar: {
        background: '#111118', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 20px', height: 60, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
    },
    title: { fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 },
    subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
    scoreBadge: { padding: '1px 8px', borderRadius: 100, fontSize: 10, fontWeight: 800 },
    toggleGroup: {
        display: 'flex', gap: 2, background: 'rgba(255,255,255,0.06)',
        borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.08)',
    },
    toggleBtn: { padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, background: 'transparent' },
    actionBtn: {
        padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer', fontSize: 12, fontWeight: 600,
    },
    installBtn: {
        padding: '8px 18px', borderRadius: 8, border: 'none',
        background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff',
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(34,197,94,0.3)',
    },
    main: { flex: 1, display: 'flex', overflow: 'hidden' },
    sidebar: {
        width: 340, background: '#111118', borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
    },
    tabBar: { display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 16px' },
    tabBtn: {
        flex: 1, padding: '14px 0', border: 'none', background: 'transparent',
        cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    previewArea: {
        flex: 1, background: '#1a1a2e', overflow: 'auto', display: 'flex',
        flexDirection: 'column', alignItems: 'center', padding: 24,
    },
    browserChrome: {
        background: '#e5e7eb', padding: '8px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
    },
    dot: { width: 10, height: 10, borderRadius: '50%' },
    urlBar: {
        flex: 1, background: '#fff', borderRadius: 4, padding: '4px 12px',
        fontSize: 11, color: '#6b7280', textAlign: 'center',
    },
    copyBtn: {
        padding: '6px 16px', background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
        color: '#fff', fontSize: 12, cursor: 'pointer',
    },
    codeBlock: {
        background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: 20, overflow: 'auto',
        color: '#e2e8f0', fontSize: 12, lineHeight: 1.6,
        maxHeight: 'calc(100vh - 200px)', fontFamily: "'Fira Code', monospace",
        whiteSpace: 'pre-wrap', wordBreak: 'break-all',
    },
    infoBox: {
        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 12, padding: 16,
    },
    infoText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6, margin: 0 },
};

/* ═══ COMPONENTS ═══ */
function InfoCard({ label, children }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: 20, marginBottom: 16,
        }}>
            <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>{label}</h3>
            <div style={{ display: 'grid', gap: 10 }}>{children}</div>
        </div>
    );
}

function InfoRow({ left, right, rightColor = '#fff' }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{left}</span>
            <span style={{ color: rightColor, fontSize: 12, fontWeight: 700 }}>{right}</span>
        </div>
    );
}

function ControlGroup({ label, children }) {
    return (
        <div style={{ marginBottom: 24 }}>
            <h3 style={{
                color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 14px',
            }}>{label}</h3>
            <div style={{ display: 'grid', gap: 14 }}>{children}</div>
        </div>
    );
}

function ColorInput({ label, value, onChange }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="color" value={value} onChange={e => onChange(e.target.value)}
                    style={{ width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }}>{value}</span>
            </div>
        </div>
    );
}

function RangeInput({ label, value, min, max, onChange }) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{label}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{value}px</span>
            </div>
            <input type="range" min={min} max={max} value={value}
                onChange={e => onChange(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1' }} />
        </div>
    );
}

function TextInput({ label, value, placeholder, onChange }) {
    return (
        <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>
                {label}
            </label>
            <input type="text" value={value} placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                style={{
                    width: '100%', padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none',
                }} />
        </div>
    );
}

function TextAreaInput({ label, value, placeholder, onChange }) {
    return (
        <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>
                {label}
            </label>
            <textarea value={value} placeholder={placeholder} rows={4}
                onChange={e => onChange(e.target.value)}
                style={{
                    width: '100%', padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical',
                }} />
        </div>
    );
}
