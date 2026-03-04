import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { Spinner } from "@shopify/polaris";

// ═══════ THEME PRESETS ═══════
const PRESETS = [
    { name: "Modern Dark", colors: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#f59e0b', bg: '#0f172a', text: '#f1f5f9', btnBg: '#6366f1', btnText: '#ffffff' }, font: 'Inter' },
    { name: "Luxury Gold", colors: { primary: '#b8860b', secondary: '#d4a843', accent: '#1a1a2e', bg: '#fdfcf9', text: '#1a1a2e', btnBg: '#b8860b', btnText: '#ffffff' }, font: 'Playfair Display' },
    { name: "Clean Minimal", colors: { primary: '#111827', secondary: '#374151', accent: '#059669', bg: '#ffffff', text: '#111827', btnBg: '#111827', btnText: '#ffffff' }, font: 'Inter' },
    { name: "Ocean Breeze", colors: { primary: '#0ea5e9', secondary: '#06b6d4', accent: '#f97316', bg: '#f0f9ff', text: '#0c4a6e', btnBg: '#0ea5e9', btnText: '#ffffff' }, font: 'Outfit' },
    { name: "Rose Garden", colors: { primary: '#e11d48', secondary: '#f43f5e', accent: '#fbbf24', bg: '#fff1f2', text: '#4c0519', btnBg: '#e11d48', btnText: '#ffffff' }, font: 'DM Sans' },
    { name: "Forest", colors: { primary: '#16a34a', secondary: '#059669', accent: '#ea580c', bg: '#f0fdf4', text: '#14532d', btnBg: '#16a34a', btnText: '#ffffff' }, font: 'Nunito Sans' },
    { name: "Bold Neon", colors: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#22d3ee', bg: '#0a0a0a', text: '#fafafa', btnBg: '#8b5cf6', btnText: '#ffffff' }, font: 'Space Grotesk' },
    { name: "Earthy", colors: { primary: '#a16207', secondary: '#92400e', accent: '#0f766e', bg: '#fefce8', text: '#422006', btnBg: '#a16207', btnText: '#ffffff' }, font: 'Merriweather' },
];

const FONT_OPTIONS = [
    'Inter', 'Roboto', 'DM Sans', 'Outfit', 'Space Grotesk', 'Nunito Sans',
    'Playfair Display', 'Merriweather', 'Lora', 'Montserrat', 'Poppins',
    'Raleway', 'Oswald', 'PT Sans', 'Source Sans 3', 'Libre Baskerville',
    'Cormorant Garamond', 'Josefin Sans', 'Crimson Text', 'Work Sans'
];

const BUTTON_STYLES = [
    { name: 'Rounded', value: '8px' },
    { name: 'Pill', value: '999px' },
    { name: 'Square', value: '0px' },
    { name: 'Soft', value: '4px' },
    { name: 'Circle', value: '50px' },
];

// ═══════ LOADER ═══════
export const loader = async ({ request }) => {
    await authenticate.admin(request);
    return json({});
};

// ═══════ MAIN COMPONENT ═══════
export default function DesignSystem() {
    const fetcher = useFetcher();

    // Theme settings from API
    const [themeSettings, setThemeSettings] = useState(null);
    const [themeName, setThemeName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Editable colors
    const [colors, setColors] = useState({
        primary: '#6366f1', secondary: '#8b5cf6', accent: '#f59e0b',
        bg: '#ffffff', text: '#111827', btnBg: '#6366f1', btnText: '#ffffff'
    });

    const [headingFont, setHeadingFont] = useState('Inter');
    const [bodyFont, setBodyFont] = useState('Inter');
    const [buttonRadius, setButtonRadius] = useState('8px');

    const [notification, setNotification] = useState(null);
    const [activeTab, setActiveTab] = useState('presets');

    // Load theme settings on mount
    useEffect(() => {
        fetch('/api/design-system')
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setThemeSettings(data.settings);
                    setThemeName(data.themeName);
                    // Try to populate from existing settings
                    const s = data.settings;
                    if (s.colors_solid_button_labels) setColors(c => ({ ...c, btnText: s.colors_solid_button_labels }));
                    if (s.colors_accent_1) setColors(c => ({ ...c, primary: s.colors_accent_1 }));
                    if (s.colors_accent_2) setColors(c => ({ ...c, secondary: s.colors_accent_2 }));
                    if (s.colors_text) setColors(c => ({ ...c, text: s.colors_text }));
                    if (s.colors_background_1) setColors(c => ({ ...c, bg: s.colors_background_1 }));
                }
            })
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, []);

    const applyPreset = (preset) => {
        setColors(preset.colors);
        setHeadingFont(preset.font);
        setBodyFont(preset.font);
        setNotification({ type: 'info', text: `"${preset.name}" preset loaded — click Save to apply to your store.` });
        setTimeout(() => setNotification(null), 4000);
    };

    const handleSave = () => {
        setNotification({ type: 'loading', text: 'Saving to your live theme...' });
        const settings = {
            colors_accent_1: colors.primary,
            colors_accent_2: colors.secondary,
            colors_text: colors.text,
            colors_background_1: colors.bg,
            colors_solid_button_labels: colors.btnText,
            type_header_font: headingFont,
            type_body_font: bodyFont,
            buttons_border_radius: parseInt(buttonRadius) || 0
        };

        const fd = new FormData();
        fd.append("intent", "update_settings");
        fd.append("settings", JSON.stringify(settings));
        fetcher.submit(fd, { method: "post", action: "/api/design-system" });
    };

    useEffect(() => {
        if (fetcher.data && fetcher.state === 'idle') {
            if (fetcher.data.success) {
                setNotification({ type: 'success', text: '✅ Design saved! Your store is updated.' });
            } else {
                setNotification({ type: 'error', text: fetcher.data.error || 'Save failed' });
            }
            setTimeout(() => setNotification(null), 5000);
        }
    }, [fetcher.data, fetcher.state]);

    const setColor = (key, val) => setColors(c => ({ ...c, [key]: val }));

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <Spinner size="large" />
            </div>
        );
    }

    return (
        <div style={S.root}>
            {/* HEADER */}
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>🎨 Design System</h1>
                    <p style={S.subtitle}>Customize colors, fonts, and styles across your entire {themeName || 'store'} — no code needed.</p>
                </div>
                <button onClick={handleSave} disabled={fetcher.state !== 'idle'} style={S.saveBtn}>
                    {fetcher.state !== 'idle' ? <Spinner size="small" /> : '💾'} Save to Theme
                </button>
            </div>

            {/* TAB BAR */}
            <div style={S.tabBar}>
                {['presets', 'colors', 'typography', 'buttons'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{ ...S.tab, ...(activeTab === tab ? S.tabActive : {}) }}
                    >
                        {tab === 'presets' && '✨ '}{tab === 'colors' && '🎨 '}{tab === 'typography' && '🔤 '}{tab === 'buttons' && '🔘 '}
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            <div style={S.content}>
                <div style={S.mainPanel}>

                    {/* ═══ PRESETS TAB ═══ */}
                    {activeTab === 'presets' && (
                        <div>
                            <h2 style={S.sectionTitle}>Theme Presets</h2>
                            <p style={S.sectionDesc}>One-click design presets. Choose one and click Save to instantly transform your store.</p>
                            <div style={S.presetGrid}>
                                {PRESETS.map(preset => (
                                    <div key={preset.name} style={S.presetCard} onClick={() => applyPreset(preset)}>
                                        <div style={{ display: 'flex', height: 80, borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
                                            <div style={{ flex: 1, background: preset.colors.bg }} />
                                            <div style={{ flex: 1, background: preset.colors.primary }} />
                                            <div style={{ flex: 1, background: preset.colors.secondary }} />
                                            <div style={{ width: 30, background: preset.colors.accent }} />
                                        </div>
                                        <div style={S.presetInfo}>
                                            <div style={S.presetName}>{preset.name}</div>
                                            <div style={S.presetFont}>{preset.font}</div>
                                        </div>
                                        <div style={S.presetColors}>
                                            {Object.values(preset.colors).slice(0, 5).map((c, i) => (
                                                <div key={i} style={{ ...S.colorDot, background: c, border: c === '#ffffff' || c === '#fdfcf9' || c === '#fefce8' ? '1px solid #e5e7eb' : 'none' }} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══ COLORS TAB ═══ */}
                    {activeTab === 'colors' && (
                        <div>
                            <h2 style={S.sectionTitle}>Color Palette</h2>
                            <p style={S.sectionDesc}>Customize each color individually. Changes will be reflected across your entire store.</p>
                            <div style={S.colorGrid}>
                                {[
                                    { key: 'primary', label: 'Primary Color', desc: 'Main brand color — buttons, links, highlights' },
                                    { key: 'secondary', label: 'Secondary Color', desc: 'Supporting color — hover states, accents' },
                                    { key: 'accent', label: 'Accent Color', desc: 'Contrast color — badges, alerts, CTAs' },
                                    { key: 'bg', label: 'Background', desc: 'Main page background color' },
                                    { key: 'text', label: 'Text Color', desc: 'Default body text color' },
                                    { key: 'btnBg', label: 'Button Background', desc: 'Primary button fill color' },
                                    { key: 'btnText', label: 'Button Text', desc: 'Text color on primary buttons' },
                                ].map(item => (
                                    <div key={item.key} style={S.colorCard}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <label style={S.colorSwatchLabel}>
                                                <input
                                                    type="color"
                                                    value={colors[item.key]}
                                                    onChange={e => setColor(item.key, e.target.value)}
                                                    style={S.colorInput}
                                                />
                                                <div style={{ ...S.colorSwatch, background: colors[item.key], border: colors[item.key] === '#ffffff' ? '2px solid #e5e7eb' : '2px solid transparent' }} />
                                            </label>
                                            <div>
                                                <div style={S.colorLabel}>{item.label}</div>
                                                <div style={S.colorDesc}>{item.desc}</div>
                                            </div>
                                        </div>
                                        <div style={S.colorHex}>{colors[item.key]}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══ TYPOGRAPHY TAB ═══ */}
                    {activeTab === 'typography' && (
                        <div>
                            <h2 style={S.sectionTitle}>Typography</h2>
                            <p style={S.sectionDesc}>Choose fonts for your headings and body text. These will apply to your entire store.</p>

                            <div style={S.fontSection}>
                                <h3 style={S.fontSectionTitle}>Heading Font</h3>
                                <div style={S.fontGrid}>
                                    {FONT_OPTIONS.map(font => (
                                        <button
                                            key={font}
                                            onClick={() => setHeadingFont(font)}
                                            style={{
                                                ...S.fontCard,
                                                ...(headingFont === font ? S.fontCardActive : {}),
                                                fontFamily: `'${font}', sans-serif`
                                            }}
                                        >
                                            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Aa</div>
                                            <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'system-ui' }}>{font}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ ...S.fontSection, marginTop: 32 }}>
                                <h3 style={S.fontSectionTitle}>Body Font</h3>
                                <div style={S.fontGrid}>
                                    {FONT_OPTIONS.map(font => (
                                        <button
                                            key={font}
                                            onClick={() => setBodyFont(font)}
                                            style={{
                                                ...S.fontCard,
                                                ...(bodyFont === font ? S.fontCardActive : {}),
                                                fontFamily: `'${font}', sans-serif`
                                            }}
                                        >
                                            <div style={{ fontSize: 16, marginBottom: 6 }}>The quick brown fox</div>
                                            <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'system-ui' }}>{font}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ BUTTONS TAB ═══ */}
                    {activeTab === 'buttons' && (
                        <div>
                            <h2 style={S.sectionTitle}>Button Styles</h2>
                            <p style={S.sectionDesc}>Choose the corner radius for all buttons on your store.</p>
                            <div style={S.buttonGrid}>
                                {BUTTON_STYLES.map(bs => (
                                    <button
                                        key={bs.name}
                                        onClick={() => setButtonRadius(bs.value)}
                                        style={{
                                            ...S.buttonStyleCard,
                                            ...(buttonRadius === bs.value ? S.buttonCardActive : {})
                                        }}
                                    >
                                        <div style={{
                                            padding: '10px 28px', background: colors.btnBg, color: colors.btnText,
                                            borderRadius: bs.value, fontSize: 14, fontWeight: 600
                                        }}>
                                            Add to Cart
                                        </div>
                                        <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: '#64748b' }}>{bs.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* LIVE PREVIEW PANEL */}
                <div style={S.previewPanel}>
                    <div style={S.previewCard}>
                        <h3 style={S.previewTitle}>Live Preview</h3>
                        <div style={{
                            background: colors.bg, padding: 24, borderRadius: 12,
                            border: '1px solid #e2e8f0', minHeight: 300
                        }}>
                            <div style={{
                                fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
                                color: colors.primary, fontWeight: 700, marginBottom: 8,
                                fontFamily: `'${bodyFont}', sans-serif`
                            }}>Your Store</div>
                            <h2 style={{
                                fontSize: 28, fontWeight: 800, color: colors.text, margin: '0 0 8px',
                                fontFamily: `'${headingFont}', sans-serif`, letterSpacing: '-0.5px'
                            }}>Premium Collection</h2>
                            <p style={{
                                fontSize: 14, color: colors.text, opacity: 0.7, margin: '0 0 20px',
                                fontFamily: `'${bodyFont}', sans-serif`, lineHeight: 1.6
                            }}>Discover our handpicked selection of high-quality products designed for the modern lifestyle.</p>

                            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                                <button style={{
                                    padding: '10px 24px', background: colors.btnBg, color: colors.btnText,
                                    border: 'none', borderRadius: buttonRadius, fontSize: 13, fontWeight: 600,
                                    cursor: 'pointer', fontFamily: `'${bodyFont}', sans-serif`
                                }}>Shop Now</button>
                                <button style={{
                                    padding: '10px 24px', background: 'transparent', color: colors.primary,
                                    border: `2px solid ${colors.primary}`, borderRadius: buttonRadius,
                                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: `'${bodyFont}', sans-serif`
                                }}>Learn More</button>
                            </div>

                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12
                            }}>
                                {['Product A', 'Product B'].map(name => (
                                    <div key={name} style={{
                                        background: colors.bg === '#ffffff' ? '#f8fafc' : 'rgba(255,255,255,0.05)',
                                        borderRadius: 8, padding: 16, border: `1px solid ${colors.primary}22`
                                    }}>
                                        <div style={{
                                            height: 60, background: `${colors.secondary}22`, borderRadius: 6,
                                            marginBottom: 10, display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontSize: 24
                                        }}>🛍️</div>
                                        <div style={{
                                            fontSize: 13, fontWeight: 700, color: colors.text,
                                            fontFamily: `'${headingFont}', sans-serif`
                                        }}>{name}</div>
                                        <div style={{
                                            fontSize: 12, color: colors.accent, fontWeight: 700, marginTop: 4
                                        }}>$49.99</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* NOTIFICATION */}
            {notification && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                    padding: '14px 24px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                    color: '#fff', display: 'flex', alignItems: 'center', gap: 10,
                    background: notification.type === 'success' ? '#059669' : notification.type === 'error' ? '#dc2626' : notification.type === 'info' ? '#6366f1' : '#2563eb',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    animation: 'dsSlideUp 0.3s ease-out'
                }}>
                    {notification.type === 'loading' && <Spinner size="small" />}
                    {notification.text}
                </div>
            )}

            <style>{`@keyframes dsSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        </div>
    );
}

// ═══════ STYLES ═══════
const S = {
    root: { minHeight: '100vh', background: '#f8fafc', fontFamily: "system-ui, -apple-system, sans-serif" },

    header: {
        background: '#fff', padding: '24px 32px', borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    title: { margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' },
    subtitle: { margin: '6px 0 0', fontSize: 14, color: '#64748b' },
    saveBtn: {
        display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
        border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(99,102,241,0.4)'
    },

    tabBar: {
        background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px',
        display: 'flex', gap: 0
    },
    tab: {
        padding: '14px 20px', background: 'transparent', border: 'none',
        borderBottom: '3px solid transparent', fontSize: 14, fontWeight: 600,
        color: '#64748b', cursor: 'pointer', transition: 'all 0.2s'
    },
    tabActive: { color: '#6366f1', borderBottom: '3px solid #6366f1', background: '#f5f3ff' },

    content: {
        display: 'flex', gap: 24, padding: '24px 32px', maxWidth: 1400, margin: '0 auto',
        alignItems: 'flex-start'
    },
    mainPanel: { flex: 1 },

    sectionTitle: { fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' },
    sectionDesc: { fontSize: 14, color: '#64748b', margin: '0 0 24px' },

    // Presets
    presetGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
    presetCard: {
        background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden',
        cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    },
    presetInfo: { padding: '12px 14px 4px' },
    presetName: { fontSize: 14, fontWeight: 700, color: '#0f172a' },
    presetFont: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    presetColors: { display: 'flex', gap: 4, padding: '8px 14px 12px' },
    colorDot: { width: 16, height: 16, borderRadius: '50%' },

    // Colors
    colorGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
    colorCard: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#fff', padding: '16px 20px', borderRadius: 12,
        border: '1px solid #e2e8f0'
    },
    colorSwatchLabel: { position: 'relative', display: 'block', cursor: 'pointer' },
    colorInput: { position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' },
    colorSwatch: { width: 44, height: 44, borderRadius: 10, cursor: 'pointer' },
    colorLabel: { fontSize: 14, fontWeight: 700, color: '#0f172a' },
    colorDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    colorHex: { fontSize: 13, fontWeight: 600, color: '#64748b', fontFamily: 'monospace', background: '#f1f5f9', padding: '4px 10px', borderRadius: 6 },

    // Typography
    fontSection: {},
    fontSectionTitle: { fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' },
    fontGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 },
    fontCard: {
        padding: 16, background: '#fff', border: '2px solid #e2e8f0', borderRadius: 10,
        textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s'
    },
    fontCardActive: { borderColor: '#6366f1', background: '#f5f3ff', boxShadow: '0 0 0 3px rgba(99,102,241,0.15)' },

    // Buttons
    buttonGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 },
    buttonStyleCard: {
        padding: 24, background: '#fff', border: '2px solid #e2e8f0', borderRadius: 12,
        textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s'
    },
    buttonCardActive: { borderColor: '#6366f1', background: '#f5f3ff', boxShadow: '0 0 0 3px rgba(99,102,241,0.15)' },

    // Preview
    previewPanel: { width: 380, position: 'sticky', top: 24, flexShrink: 0 },
    previewCard: {
        background: '#fff', borderRadius: 12, padding: 20,
        border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
    },
    previewTitle: { fontSize: 14, fontWeight: 700, color: '#64748b', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1 }
};
