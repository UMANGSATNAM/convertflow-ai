import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { useState, useEffect, useRef, useMemo } from "react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { hasActiveSubscription } from "../utils/billing.server";
import { installSectionToTheme } from "../utils/theme-integration.server";

/* ═══════════════════════════════════════════════════════════
   INLINE SVG ICONS — premium, consistent, no emojis
   ═══════════════════════════════════════════════════════════ */
const ICONS = {
    back: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>`,
    desktop: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>`,
    tablet: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 18h.01"/></svg>`,
    mobile: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>`,
    code: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    save: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
    check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    install: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    copy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    eye: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    palette: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
    edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    mapPin: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    alert: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    spinner: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
    info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
};

function Icon({ name, size = 16, color = 'currentColor', className = '' }) {
    return <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, color }}
        dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }} />;
}

/* ═══════════════════════════════════════════════════════════
   LOADER & ACTION
   ═══════════════════════════════════════════════════════════ */
export const loader = async ({ request, params }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const { id } = params;

    const hasSubscription = await hasActiveSubscription(shop);
    if (!hasSubscription) throw new Response("Subscription required", { status: 403 });

    const section = await db.sections.getById(id);
    if (!section) throw new Response("Section not found", { status: 404 });

    const shopRecord = await db.shops.findByDomain(shop);
    const customizations = await db.customizations.getByShop(shopRecord.id);
    const existing = customizations.find(c => c.section_id === parseInt(id));

    let savedSettings = {};
    if (existing?.custom_settings) {
        try { savedSettings = typeof existing.custom_settings === 'string' ? JSON.parse(existing.custom_settings) : existing.custom_settings; } catch (e) { }
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
        return json({ _action: "save", success: true, message: "Settings saved successfully!" });
    }

    if (actionType === "install") {
        try {
            const section = await db.sections.getById(id);
            if (!section) return json({ _action: "install", success: false, message: "Section not found." });

            let customSettings = {};
            try { customSettings = JSON.parse(formData.get("settings") || '{}'); } catch (e) { }
            const placement = formData.get("placement") || 'homepage';

            const result = await installSectionToTheme(admin, session, section, customSettings, placement);

            return json({
                _action: "install",
                success: result.success,
                message: result.success ? result.message : result.error,
                placement: result.placement,
            });
        } catch (error) {
            console.error("Install error:", error);
            return json({ _action: "install", success: false, message: error.message || "Installation failed." });
        }
    }

    return json({ success: false, message: "Invalid action" });
};

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function SectionCustomize() {
    const { section, shopId, savedSettings } = useLoaderData();
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const iframeRef = useRef(null);

    const [settings, setSettings] = useState({
        heading: '', description: '', buttonText: '',
        primaryColor: '#6366f1', textColor: '#111111', backgroundColor: '#ffffff',
        paddingTop: 0, paddingBottom: 0, borderRadius: 8,
        placement: 'homepage',
        ...savedSettings,
    });

    const [activeTab, setActiveTab] = useState('design');
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

    // ══════════════════════════════════════════
    // Build live preview HTML — applies ALL settings in real-time
    // ══════════════════════════════════════════
    const previewHtml = useMemo(() => {
        let html = section.html_code || '';

        // Build override CSS for colors
        const overrideCSS = `
            .cf-section-wrapper {
                padding-top: ${settings.paddingTop}px !important;
                padding-bottom: ${settings.paddingBottom}px !important;
                border-radius: ${settings.borderRadius}px !important;
                overflow: hidden;
            }
        `;

        // Script to apply text replacements in the iframe
        const textReplacementScript = `
        <script>
        (function() {
            const heading = ${JSON.stringify(settings.heading || '')};
            const description = ${JSON.stringify(settings.description || '')};
            const buttonText = ${JSON.stringify(settings.buttonText || '')};

            if (heading) {
                const h = document.querySelector('h1') || document.querySelector('h2');
                if (h) h.textContent = heading;
            }
            if (description) {
                const ps = document.querySelectorAll('p');
                for (const p of ps) {
                    if (p.textContent.length > 20 && !p.closest('style') && !p.closest('script')) {
                        p.textContent = description;
                        break;
                    }
                }
            }
            if (buttonText) {
                const btn = document.querySelector('button') || document.querySelector('a[class*="btn"]');
                if (btn) btn.textContent = buttonText;
            }
        })();
        </script>`;

        return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; overflow-x: hidden; }
    ${overrideCSS}
</style>
</head>
<body>
<div class="cf-section-wrapper">
${html}
</div>
${textReplacementScript}
</body>
</html>`;
    }, [section.html_code, settings.paddingTop, settings.paddingBottom, settings.borderRadius,
    settings.heading, settings.description, settings.buttonText]);

    // Update iframe content
    useEffect(() => {
        if (iframeRef.current) {
            const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
            if (doc) { doc.open(); doc.write(previewHtml); doc.close(); }
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
        formData.append("placement", settings.placement);
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
            setTimeout(() => setNotification(null), 8000);
        }
    }, [fetcher.data, fetcher.state]);

    const scoreColor = section.conversion_score >= 93 ? '#4ade80' : section.conversion_score >= 88 ? '#fbbf24' : '#94a3b8';
    const previewWidth = previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '768px' : '375px';

    const tabs = [
        { id: 'design', label: 'Design', icon: 'palette' },
        { id: 'content', label: 'Content', icon: 'edit' },
        { id: 'install', label: 'Install', icon: 'mapPin' },
    ];

    return (
        <div style={S.root}>
            {/* ═══ TOP BAR ═══ */}
            <div style={S.topBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate(-1)} style={S.backBtn}>
                        <Icon name="back" size={16} />
                    </button>
                    <div>
                        <h1 style={S.title}>{section.name}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                            <span style={S.subtitle}>{section.category} #{section.variation_number}</span>
                            <span style={{ ...S.scoreBadge, background: `${scoreColor}22`, color: scoreColor }}>
                                {section.conversion_score}%
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Device Toggle */}
                    <div style={S.toggleGroup}>
                        {[{ id: 'desktop', icon: 'desktop' }, { id: 'tablet', icon: 'tablet' }, { id: 'mobile', icon: 'mobile' }].map(m => (
                            <button key={m.id} onClick={() => setPreviewMode(m.id)} style={{
                                ...S.toggleBtn,
                                background: previewMode === m.id ? 'rgba(99,102,241,0.3)' : 'transparent',
                            }}><Icon name={m.icon} size={14} color={previewMode === m.id ? '#a78bfa' : 'rgba(255,255,255,0.4)'} /></button>
                        ))}
                    </div>

                    <button onClick={() => setShowCode(!showCode)} style={{
                        ...S.actionBtn,
                        background: showCode ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
                        color: showCode ? '#a78bfa' : '#fff',
                    }}><Icon name="code" size={14} /> Code</button>

                    <button onClick={handleSave} disabled={!hasChanges} style={{
                        ...S.actionBtn,
                        background: hasChanges ? '#6366f1' : 'rgba(255,255,255,0.06)',
                        color: hasChanges ? '#fff' : 'rgba(255,255,255,0.3)',
                        cursor: hasChanges ? 'pointer' : 'default',
                    }}>
                        <Icon name={hasChanges ? 'save' : 'check'} size={14} />
                        {hasChanges ? ' Save' : ' Saved'}
                    </button>
                </div>
            </div>

            {/* ═══ MAIN ═══ */}
            <div style={S.main}>
                {/* Side Panel */}
                <div style={S.sidebar}>
                    <div style={S.tabBar}>
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                                ...S.tabBtn,
                                color: activeTab === tab.id ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                                borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                            }}>
                                <Icon name={tab.icon} size={13} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
                        {activeTab === 'design' && (
                            <div>
                                <ControlGroup label="Spacing">
                                    <RangeInput label="Padding Top" value={settings.paddingTop} min={0} max={200} onChange={v => updateSetting('paddingTop', v)} />
                                    <RangeInput label="Padding Bottom" value={settings.paddingBottom} min={0} max={200} onChange={v => updateSetting('paddingBottom', v)} />
                                    <RangeInput label="Border Radius" value={settings.borderRadius} min={0} max={50} onChange={v => updateSetting('borderRadius', v)} />
                                </ControlGroup>
                                <ControlGroup label="Colors">
                                    <ColorInput label="Primary Color" value={settings.primaryColor} onChange={v => updateSetting('primaryColor', v)} />
                                    <ColorInput label="Text Color" value={settings.textColor} onChange={v => updateSetting('textColor', v)} />
                                    <ColorInput label="Background" value={settings.backgroundColor} onChange={v => updateSetting('backgroundColor', v)} />
                                </ControlGroup>
                                <Hint text="Spacing & border radius update the preview in real-time. Colors are saved and fully editable in your Shopify theme customizer after install." />
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div>
                                <ControlGroup label="Text Content">
                                    <TextInput label="Heading" value={settings.heading} placeholder="Leave empty for default..." onChange={v => updateSetting('heading', v)} />
                                    <TextAreaInput label="Description" value={settings.description} placeholder="Leave empty for default..." onChange={v => updateSetting('description', v)} />
                                    <TextInput label="Button Text" value={settings.buttonText} placeholder="Leave empty for default..." onChange={v => updateSetting('buttonText', v)} />
                                </ControlGroup>
                                <Hint text="Type your custom text and see it update in the live preview instantly. Leave fields empty to keep the original text." />
                            </div>
                        )}

                        {activeTab === 'install' && (
                            <div>
                                <ControlGroup label="Install Location">
                                    <SelectInput label="Where to add this section?"
                                        value={settings.placement}
                                        options={[
                                            { value: 'homepage', label: 'Home Page' },
                                            { value: 'product', label: 'Product Page' },
                                            { value: 'collection', label: 'Collection Page' },
                                            { value: 'blog', label: 'Blog Page' },
                                            { value: 'all', label: 'All Pages (Global)' },
                                        ]}
                                        onChange={v => updateSetting('placement', v)}
                                    />
                                </ControlGroup>

                                <div style={S.installCard}>
                                    <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>Ready to install?</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6, margin: '0 0 20px' }}>
                                        This will create a Liquid section file in your active theme.
                                        You can then position it using Shopify's theme editor.
                                    </p>
                                    <button onClick={handleInstall} disabled={isInstalling} style={S.installBtnLarge}>
                                        {isInstalling ? (
                                            <><Icon name="spinner" size={16} /> Installing...</>
                                        ) : (
                                            <><Icon name="install" size={16} /> Install to Theme</>
                                        )}
                                    </button>
                                </div>

                                <Hint text="After installing, go to Online Store → Customize → select the page → Add Section → search for 'CF:' prefix to find your section." />
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Area */}
                <div style={S.previewArea}>
                    {showCode ? (
                        <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>HTML / CSS Source Code</span>
                                <button onClick={handleCopyCode} style={S.copyBtn}>
                                    <Icon name="copy" size={13} /> {copyMsg || 'Copy Code'}
                                </button>
                            </div>
                            <pre style={S.codeBlock}>{section.html_code || '<!-- No HTML code -->'}</pre>
                        </div>
                    ) : (
                        <div style={{
                            width: previewWidth, maxWidth: '100%', transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
                            borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.3)', margin: '0 auto',
                        }}>
                            {/* Browser Chrome */}
                            <div style={S.browserChrome}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <div style={{ ...S.dot, background: '#ef4444' }} />
                                    <div style={{ ...S.dot, background: '#f59e0b' }} />
                                    <div style={{ ...S.dot, background: '#22c55e' }} />
                                </div>
                                <div style={S.urlBar}>your-store.myshopify.com</div>
                                <div style={{ width: 48 }} />
                            </div>
                            <iframe ref={iframeRef} title="Section Preview" sandbox="allow-same-origin allow-scripts"
                                style={{ width: '100%', minHeight: 480, border: 'none', background: '#fff', display: 'block' }} />
                        </div>
                    )}
                    <div style={{ marginTop: 14, textAlign: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                            {showCode ? 'Source Code View' : `Live Preview — ${previewMode}`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                    padding: '14px 24px', borderRadius: 12, fontWeight: 600, fontSize: 13,
                    color: '#fff', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 500,
                    background: notification.type === 'success' ? '#059669' : '#dc2626',
                    boxShadow: `0 8px 30px ${notification.type === 'success' ? 'rgba(5,150,105,0.35)' : 'rgba(220,38,38,0.35)'}`,
                    animation: 'cfSlideUp 0.3s ease-out',
                }}>
                    <Icon name={notification.type === 'success' ? 'success' : 'alert'} size={16} />
                    {notification.text}
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                * { box-sizing: border-box; }
                @keyframes cfSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes cfSpin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

/* ═══ STYLES ═══ */
const S = {
    root: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#09090b', fontFamily: "'Inter', system-ui, sans-serif" },
    topBar: {
        background: '#111114', borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 20px', height: 56, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30,
    },
    backBtn: {
        width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: 15, fontWeight: 700, color: '#f4f4f5', margin: 0 },
    subtitle: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
    scoreBadge: { padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 800 },
    toggleGroup: { display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.06)' },
    toggleBtn: { padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer' },
    actionBtn: {
        padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
    },
    main: { flex: 1, display: 'flex', overflow: 'hidden' },
    sidebar: {
        width: 320, background: '#111114', borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
    },
    tabBar: { display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 8px' },
    tabBtn: {
        flex: 1, padding: '12px 0', border: 'none', background: 'transparent',
        cursor: 'pointer', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    },
    previewArea: {
        flex: 1, background: '#18181b', overflow: 'auto', display: 'flex',
        flexDirection: 'column', alignItems: 'center', padding: 24,
    },
    browserChrome: {
        background: '#f4f4f5', padding: '8px 14px',
        display: 'flex', alignItems: 'center',
    },
    dot: { width: 10, height: 10, borderRadius: '50%' },
    urlBar: {
        flex: 1, background: '#fff', borderRadius: 6, padding: '5px 14px', margin: '0 12px',
        fontSize: 11, color: '#71717a', textAlign: 'center', border: '1px solid #e4e4e7',
    },
    copyBtn: {
        padding: '6px 14px', background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
        color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
    },
    codeBlock: {
        background: '#0c0c0f', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, padding: 20, overflow: 'auto',
        color: '#d4d4d8', fontSize: 12, lineHeight: 1.6,
        maxHeight: 'calc(100vh - 180px)', fontFamily: "'Fira Code', 'Cascadia Code', monospace",
        whiteSpace: 'pre-wrap', wordBreak: 'break-all',
    },
    installCard: {
        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 12, padding: 20, marginTop: 16,
    },
    installBtnLarge: {
        width: '100%', padding: '14px 24px', borderRadius: 10, border: 'none',
        background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff',
        fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 4px 20px rgba(34,197,94,0.25)', transition: 'all 0.3s',
    },
};

/* ═══ REUSABLE COMPONENTS ═══ */
function ControlGroup({ label, children }) {
    return (
        <div style={{ marginBottom: 24 }}>
            <h3 style={{
                color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 14px',
            }}>{label}</h3>
            <div style={{ display: 'grid', gap: 16 }}>{children}</div>
        </div>
    );
}

function ColorInput({ label, value, onChange }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="color" value={value} onChange={e => onChange(e.target.value)}
                    style={{ width: 30, height: 30, border: '2px solid rgba(255,255,255,0.1)', borderRadius: 6, cursor: 'pointer', padding: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontFamily: "'Fira Code', monospace" }}>{value}</span>
            </div>
        </div>
    );
}

function RangeInput({ label, value, min, max, onChange }) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{label}</span>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, fontFamily: "'Fira Code', monospace" }}>{value}px</span>
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
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>{label}</label>
            <input type="text" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
                style={{
                    width: '100%', padding: '10px 14px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, color: '#f4f4f5', fontSize: 13, outline: 'none',
                    transition: 'border-color 0.2s',
                }} />
        </div>
    );
}

function TextAreaInput({ label, value, placeholder, onChange }) {
    return (
        <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>{label}</label>
            <textarea value={value} placeholder={placeholder} rows={3} onChange={e => onChange(e.target.value)}
                style={{
                    width: '100%', padding: '10px 14px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, color: '#f4f4f5', fontSize: 13, outline: 'none', resize: 'vertical',
                }} />
        </div>
    );
}

function SelectInput({ label, value, options, onChange }) {
    return (
        <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)}
                style={{
                    width: '100%', padding: '10px 14px',
                    background: '#18181b', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: '#f4f4f5', fontSize: 13, outline: 'none',
                    cursor: 'pointer', appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
                }}>
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );
}

function Hint({ text }) {
    return (
        <div style={{
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)',
            borderRadius: 10, padding: 14, marginTop: 16, display: 'flex', gap: 8,
        }}>
            <Icon name="info" size={14} color="rgba(167,139,250,0.7)" />
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{text}</p>
        </div>
    );
}
