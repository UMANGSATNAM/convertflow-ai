import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { useState, useEffect, useRef } from "react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { hasActiveSubscription } from "../utils/billing.server";
import { installSectionToTheme } from "../utils/theme-integration.server";

export const loader = async ({ request, params }) => {
    const { session, admin } = await authenticate.admin(request);
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
    const existingCustomization = customizations.find(c => c.section_id === parseInt(id));

    let defaultSettings = {};
    try {
        const schema = typeof section.schema_json === 'string'
            ? JSON.parse(section.schema_json)
            : section.schema_json;
        defaultSettings = schema?.settings || {};
    } catch (e) { }

    let savedSettings = null;
    if (existingCustomization?.custom_settings) {
        try {
            savedSettings = typeof existingCustomization.custom_settings === 'string'
                ? JSON.parse(existingCustomization.custom_settings)
                : existingCustomization.custom_settings;
        } catch (e) { }
    }

    return json({
        section,
        shopId: shopRecord.id,
        existingSettings: savedSettings || defaultSettings || {},
    });
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
        return json({ success: true, message: "Settings saved successfully!" });
    }

    if (actionType === "install") {
        try {
            const section = await db.sections.getById(id);
            if (!section) {
                return json({ success: false, message: "Section not found." });
            }

            const customSettings = {};
            try {
                const settingsStr = formData.get("settings");
                if (settingsStr) Object.assign(customSettings, JSON.parse(settingsStr));
            } catch (e) { }

            const result = await installSectionToTheme(admin, section, customSettings);

            if (result.success) {
                return json({
                    success: true,
                    message: result.message || `Section "${section.name}" installed to "${result.themeName}"!`,
                    sectionFile: result.sectionFile,
                });
            } else {
                return json({ success: false, message: result.error || "Installation failed." });
            }
        } catch (error) {
            console.error("Install action error:", error);
            return json({ success: false, message: error.message || "Unexpected error during installation." });
        }
    }

    return json({ success: false, message: "Invalid action" });
};

export default function SectionCustomize() {
    const { section, shopId, existingSettings } = useLoaderData();
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const iframeRef = useRef(null);

    const [settings, setSettings] = useState(existingSettings);
    const [activeTab, setActiveTab] = useState('preview');
    const [previewMode, setPreviewMode] = useState('desktop');
    const [hasChanges, setHasChanges] = useState(false);
    const [showSaveNotif, setShowSaveNotif] = useState(false);
    const [showCode, setShowCode] = useState(false);
    const [copyMsg, setCopyMsg] = useState('');
    const [installMsg, setInstallMsg] = useState(null); // { type: 'success'|'error', text }

    const updateSetting = (key, value) => {
        setSettings({ ...settings, [key]: value });
        setHasChanges(true);
    };

    const handleSave = () => {
        const formData = new FormData();
        formData.append("_action", "save");
        formData.append("settings", JSON.stringify(settings));
        fetcher.submit(formData, { method: "post" });
        setHasChanges(false);
        setShowSaveNotif(true);
        setTimeout(() => setShowSaveNotif(false), 3000);
    };

    const handleInstall = () => {
        const formData = new FormData();
        formData.append("_action", "install");
        formData.append("settings", JSON.stringify(settings));
        fetcher.submit(formData, { method: "post" });
    };

    // Handle install API response
    useEffect(() => {
        if (fetcher.data && fetcher.data.message && fetcher.state === 'idle') {
            if (fetcher.data._action !== 'save') {
                setInstallMsg({
                    type: fetcher.data.success ? 'success' : 'error',
                    text: fetcher.data.message,
                });
                setTimeout(() => setInstallMsg(null), 6000);
            }
        }
    }, [fetcher.data, fetcher.state]);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(section.html_code || '');
        setCopyMsg('Copied!');
        setTimeout(() => setCopyMsg(''), 2000);
    };

    const scoreColor = section.conversion_score >= 93 ? '#4ade80' : section.conversion_score >= 88 ? '#fbbf24' : '#94a3b8';

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* — TOP BAR — */}
            <div style={{
                background: '#111118', borderBottom: '1px solid rgba(255,255,255,0.08)',
                padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 30,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 16,
                        }}
                    >
                        ←
                    </button>
                    <div>
                        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                            {section.name}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                                {section.category} • #{section.variation_number}
                            </span>
                            <span style={{
                                padding: '1px 8px', borderRadius: 100, fontSize: 10, fontWeight: 800,
                                background: `${scoreColor}22`, color: scoreColor,
                            }}>
                                {section.conversion_score}% score
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Preview Mode */}
                    <div style={{
                        display: 'flex', gap: 2, background: 'rgba(255,255,255,0.06)',
                        borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                        {[
                            { id: 'desktop', label: '🖥️' },
                            { id: 'tablet', label: '📱' },
                            { id: 'mobile', label: '📲' },
                        ].map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setPreviewMode(mode.id)}
                                style={{
                                    padding: '6px 10px', borderRadius: 6, border: 'none',
                                    background: previewMode === mode.id ? 'rgba(99,102,241,0.3)' : 'transparent',
                                    color: previewMode === mode.id ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer', fontSize: 14,
                                }}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowCode(!showCode)}
                        style={{
                            padding: '8px 14px', borderRadius: 8,
                            background: showCode ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
                            border: '1px solid ' + (showCode ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'),
                            color: showCode ? '#a78bfa' : '#fff', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600,
                        }}
                    >
                        {'</>'} Code
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        style={{
                            padding: '8px 18px', borderRadius: 8,
                            background: hasChanges ? '#6366f1' : 'rgba(255,255,255,0.06)',
                            color: hasChanges ? '#fff' : 'rgba(255,255,255,0.3)',
                            border: 'none', fontSize: 13, fontWeight: 700, cursor: hasChanges ? 'pointer' : 'default',
                        }}
                    >
                        {hasChanges ? '💾 Save' : '✓ Saved'}
                    </button>

                    <button
                        onClick={handleInstall}
                        style={{
                            padding: '8px 18px', borderRadius: 8,
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 2px 12px rgba(34,197,94,0.3)',
                        }}
                    >
                        🚀 Install to Theme
                    </button>
                </div>
            </div>

            {/* — MAIN CONTENT — */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Left Sidebar - Controls */}
                <div style={{
                    width: 340, background: '#111118', borderRight: '1px solid rgba(255,255,255,0.08)',
                    overflowY: 'auto',
                }}>
                    {/* Tabs */}
                    <div style={{
                        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
                        padding: '0 16px',
                    }}>
                        {[
                            { id: 'preview', label: 'Preview', icon: '👁️' },
                            { id: 'design', label: 'Design', icon: '🎨' },
                            { id: 'content', label: 'Content', icon: '📝' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    flex: 1, padding: '14px 0', border: 'none',
                                    background: 'transparent', cursor: 'pointer',
                                    color: activeTab === tab.id ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                                    fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                                    borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                                }}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ padding: 20 }}>
                        {/* Preview tab — section info */}
                        {activeTab === 'preview' && (
                            <div>
                                <div style={{
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 12, padding: 20, marginBottom: 16,
                                }}>
                                    <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>Section Details</h3>
                                    <div style={{ display: 'grid', gap: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Category</span>
                                            <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{section.category}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Variation</span>
                                            <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>#{section.variation_number}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Conversion Score</span>
                                            <span style={{ color: scoreColor, fontSize: 12, fontWeight: 800 }}>{section.conversion_score}%</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Status</span>
                                            <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 600 }}>Ready to install</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                                    borderRadius: 12, padding: 16,
                                }}>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                                        This section is optimized for high conversion rates. Click <strong style={{ color: '#a78bfa' }}>Install to Theme</strong> to add it directly to your Shopify store, or use the <strong style={{ color: '#a78bfa' }}>Design</strong> and <strong style={{ color: '#a78bfa' }}>Content</strong> tabs to customize first.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Design tab */}
                        {activeTab === 'design' && (
                            <div>
                                <ControlGroup label="Colors">
                                    <ColorInput label="Primary Color" value={settings.primaryColor || '#6366f1'} onChange={(v) => updateSetting('primaryColor', v)} />
                                    <ColorInput label="Text Color" value={settings.textColor || '#ffffff'} onChange={(v) => updateSetting('textColor', v)} />
                                    <ColorInput label="Background" value={settings.backgroundColor || '#0a0a0a'} onChange={(v) => updateSetting('backgroundColor', v)} />
                                </ControlGroup>

                                <ControlGroup label="Spacing">
                                    <RangeInput label="Padding Top" value={settings.paddingTop || 80} min={0} max={200} onChange={(v) => updateSetting('paddingTop', v)} />
                                    <RangeInput label="Padding Bottom" value={settings.paddingBottom || 80} min={0} max={200} onChange={(v) => updateSetting('paddingBottom', v)} />
                                    <RangeInput label="Border Radius" value={settings.borderRadius || 8} min={0} max={50} onChange={(v) => updateSetting('borderRadius', v)} />
                                </ControlGroup>
                            </div>
                        )}

                        {/* Content tab */}
                        {activeTab === 'content' && (
                            <div>
                                <ControlGroup label="Text Content">
                                    <TextInput label="Heading" value={settings.heading || ''} placeholder="Enter heading..." onChange={(v) => updateSetting('heading', v)} />
                                    <TextAreaInput label="Description" value={settings.description || ''} placeholder="Enter description..." onChange={(v) => updateSetting('description', v)} />
                                    <TextInput label="Button Text" value={settings.buttonText || ''} placeholder="Shop Now" onChange={(v) => updateSetting('buttonText', v)} />
                                </ControlGroup>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right - Preview Area */}
                <div style={{
                    flex: 1, background: '#1a1a2e', overflow: 'auto', display: 'flex',
                    flexDirection: 'column', alignItems: 'center', padding: '24px',
                }}>
                    {showCode ? (
                        /* Code View */
                        <div style={{ width: '100%', maxWidth: 900 }}>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                marginBottom: 12,
                            }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>HTML / CSS Source</span>
                                <button
                                    onClick={handleCopyCode}
                                    style={{
                                        padding: '6px 16px', background: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                                        color: '#fff', fontSize: 12, cursor: 'pointer',
                                    }}
                                >
                                    {copyMsg || '📋 Copy Code'}
                                </button>
                            </div>
                            <pre style={{
                                background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 12, padding: 20, overflow: 'auto',
                                color: '#e2e8f0', fontSize: 12, lineHeight: 1.6,
                                maxHeight: 'calc(100vh - 200px)', fontFamily: "'Fira Code', monospace",
                            }}>
                                {section.html_code || '<!-- No HTML code available -->'}
                            </pre>
                        </div>
                    ) : (
                        /* Live Preview */
                        <div style={{
                            width: previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? 768 : 375,
                            maxWidth: '100%',
                            transition: 'width 0.3s ease',
                            background: '#fff', borderRadius: 12, overflow: 'hidden',
                            boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
                        }}>
                            {/* Browser Chrome */}
                            <div style={{
                                background: '#e5e7eb', padding: '8px 12px',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <div style={{ display: 'flex', gap: 5 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                                </div>
                                <div style={{
                                    flex: 1, background: '#fff', borderRadius: 4, padding: '4px 12px',
                                    fontSize: 11, color: '#6b7280', textAlign: 'center',
                                }}>
                                    your-store.myshopify.com
                                </div>
                            </div>
                            {/* Content */}
                            <div
                                dangerouslySetInnerHTML={{ __html: section.html_code || '<div style="padding:60px;text-align:center;color:#999">No preview available</div>' }}
                            />
                        </div>
                    )}

                    {/* Preview label */}
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                            {showCode ? 'Source Code View' : `Live Preview • ${previewMode.charAt(0).toUpperCase() + previewMode.slice(1)}`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Save Notification */}
            {showSaveNotif && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 50,
                    padding: '12px 24px', background: '#22c55e', color: '#fff',
                    borderRadius: 10, fontWeight: 700, fontSize: 14,
                    boxShadow: '0 8px 30px rgba(34,197,94,0.4)',
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    ✓ Settings saved successfully!
                </div>
            )}

            {/* Install Notification */}
            {installMsg && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 50,
                    padding: '14px 24px',
                    background: installMsg.type === 'success' ? '#22c55e' : '#ef4444',
                    color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: 14,
                    boxShadow: `0 8px 30px ${installMsg.type === 'success' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                    display: 'flex', alignItems: 'center', gap: 8, maxWidth: 500,
                }}>
                    <span>{installMsg.type === 'success' ? '🚀' : '⚠️'}</span>
                    {installMsg.text}
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                * { box-sizing: border-box; }
            `}</style>
        </div>
    );
}

/* — Reusable Control Components — */

function ControlGroup({ label, children }) {
    return (
        <div style={{ marginBottom: 24 }}>
            <h3 style={{
                color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 14px',
            }}>
                {label}
            </h3>
            <div style={{ display: 'grid', gap: 14 }}>{children}</div>
        </div>
    );
}

function ColorInput({ label, value, onChange }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={{ width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                />
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
            <input
                type="range"
                min={min} max={max} value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1' }}
            />
        </div>
    );
}

function TextInput({ label, value, placeholder, onChange }) {
    return (
        <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>
                {label}
            </label>
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%', padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none',
                }}
            />
        </div>
    );
}

function TextAreaInput({ label, value, placeholder, onChange }) {
    return (
        <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>
                {label}
            </label>
            <textarea
                value={value}
                placeholder={placeholder}
                rows={4}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%', padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical',
                }}
            />
        </div>
    );
}
