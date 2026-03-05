import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";

// ═══════ ICONS ═══════
const ICONS = {
    wand: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>`,
    layout: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>`,
    click: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 9c0-1.1.9-2 2-2h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/><path d="M9 3H5a2 2 0 0 0-2 2v4"/><path d="M15 3h4a2 2 0 0 1 2 2v4"/><path d="M9 21H5a2 2 0 0 1-2-2v-4"/><path d="M15 21h4a2 2 0 0 0 2-2v-4"/></svg>`,
    ai: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2A10 10 0 1 0 22 12 10 10 0 0 0 12 2Z" opacity="0.4"/><path d="M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4Z"/></svg>`
};

function SVG({ name, color = 'currentColor' }) {
    return <span style={{ color, display: 'inline-flex' }} dangerouslySetInnerHTML={{ __html: ICONS[name] }} />;
}

// ═══════ LOADER ═══════
export const loader = async ({ request }) => {
    await authenticate.admin(request);
    return json({});
};

// ═══════ COMPONENT ═══════
export default function BuilderHub() {
    const navigate = useNavigate();

    return (
        <div style={S.root}>
            <div style={S.container}>
                <div style={S.header}>
                    <h1 style={S.title}>Store & Theme Builder Hub</h1>
                    <p style={S.subtitle}>Choose how you want to build and customize your Shopify store today.</p>
                </div>

                <div style={{ ...S.grid, gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {/* ⭐ AI Store Builder (The 1-Click Engine) */}
                    <div style={{ ...S.card, gridColumn: '1 / -1', flexDirection: 'row', gap: 40, background: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 100%)', border: '1px solid #6366f1' }} onClick={() => navigate('/app/ai-builder')}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', background: '#ec4899', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 100, letterSpacing: 1, marginBottom: 20, textTransform: 'uppercase' }}>
                                🚀 The 60-Second Magic
                            </div>
                            <div style={{ ...S.iconBox, background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', width: 56, height: 56 }}>
                                <SVG name="ai" color="#fff" />
                            </div>
                            <h2 style={{ ...S.cardTitle, fontSize: 28 }}>1-Click AI Store Builder</h2>
                            <p style={{ ...S.cardDesc, maxWidth: 500 }}>
                                Tell us your product and niche. Our AI engine builds an entire conversion-optimized, responsive homepage with intelligently written copy, pre-configured layouts, and dynamic conversion boosters — in exactly 60 seconds.
                            </p>
                            <button style={{ ...S.cardBtn, maxWidth: 260, background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', boxShadow: '0 4px 15px rgba(236,72,153,0.4)' }}>Generate Store Instance ✨</button>
                        </div>
                        <ul style={{ ...S.featureList, margin: 'auto 0', minWidth: 250, color: '#fbcfe8' }}>
                            <li>🧠 AI-generated conversion copy</li>
                            <li>🔄 Automated optimal layout selection</li>
                            <li>⚡ Built in under 60 seconds</li>
                            <li>🤖 Target audience-tailored tones</li>
                            <li>🛡️ Injects winning layouts automatically</li>
                        </ul>
                    </div>

                    {/* Live Section Picker */}
                    <div style={S.card} onClick={() => navigate('/app/live-builder')}>
                        <div style={{ ...S.iconBox, background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                            <SVG name="click" color="#fff" />
                        </div>
                        <h2 style={S.cardTitle}>Live Section Picker</h2>
                        <p style={S.cardDesc}>
                            Click any section on your theme and instantly browse premium alternative designs — one-click apply to the live theme.
                        </p>
                        <ul style={S.featureList}>
                            <li>👆 Click & swap visual editor</li>
                            <li>🎨 10–20 premium designs per type</li>
                        </ul>
                        <button style={{ ...S.cardBtn, background: '#6366f1' }}>Open Live Builder</button>
                    </div>

                    {/* Option 1: 13-Step Store Builder */}
                    <div style={S.card} onClick={() => navigate('/app/page-builder')}>
                        <div style={{ ...S.iconBox, background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' }}>
                            <SVG name="layout" color="#fff" />
                        </div>
                        <h2 style={S.cardTitle}>Full Page Builder</h2>
                        <p style={S.cardDesc}>
                            Pick from 20 complete page designs for each page type — Home, Product, Collection, Blog, Cart & more.
                            Plus inject custom Liquid code into any page.
                        </p>
                        <ul style={S.featureList}>
                            <li>📄 20 designs per page type</li>
                            <li>🔄 Replace entire pages in one click</li>
                            <li>{'{ }'} Custom Liquid code injector</li>
                        </ul>
                        <button style={{ ...S.cardBtn, background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>Open Page Builder</button>
                    </div>

                    {/* Option 1: 13-Step Manual Builder */}
                    <div style={S.card} onClick={() => navigate('/app/store-builder')}>
                        <div style={{ ...S.iconBox, background: 'linear-gradient(135deg, #4ade80 0%, #10b981 100%)' }}>
                            <SVG name="wand" color="#fff" />
                        </div>
                        <h2 style={S.cardTitle}>13-Step Manual Builder</h2>
                        <p style={S.cardDesc}>
                            Use our guided 13-step wizard to manually assemble a high-converting homepage section by section.
                        </p>
                        <ul style={S.featureList}>
                            <li>✨ Guided step-by-step workflow</li>
                            <li>🎨 Total control of the architecture</li>
                            <li>💼 Best for Agencies</li>
                        </ul>
                        <button style={{ ...S.cardBtn, background: '#10b981' }}>Launch Manual Builder</button>
                    </div>

                    {/* Option 0b: Page Builder */}
                    <div style={S.card} onClick={() => navigate('/app/page-builder')}>
                        <div style={{ ...S.iconBox, background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' }}>
                            <SVG name="layout" color="#fff" />
                        </div>
                        <h2 style={S.cardTitle}>Full Page Builder</h2>
                        <p style={S.cardDesc}>
                            Pick from 20 complete page designs for Home, Product, Collection, Blog, Cart & more.
                        </p>
                        <ul style={S.featureList}>
                            <li>📄 20 designs per page type</li>
                            <li>🔄 Entire page replacements</li>
                        </ul>
                        <button style={{ ...S.cardBtn, background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>Open Page Builder</button>
                    </div>

                    {/* Option 2: Theme Builder (Visual Editor) */}
                    <div style={S.card} onClick={() => navigate('/app/visual-editor')}>
                        <div style={{ ...S.iconBox, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                            <SVG name="layout" color="#fff" />
                        </div>
                        <h2 style={S.cardTitle}>Visual Theme Editor</h2>
                        <p style={S.cardDesc}>
                            Map out your existing theme pages and swap, add, or delete individual sections.
                            Better for surgically upgrading specific parts of your current design.
                        </p>
                        <ul style={S.featureList}>
                            <li>🗺️ See your entire theme structure</li>
                            <li>🔄 Swap sections in one click</li>
                            <li>📱 Works on any page (Product, Collection, etc.)</li>
                        </ul>
                        <button style={{ ...S.cardBtn, background: '#10b981' }}>Open Theme Editor</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════ STYLES ═══════
const S = {
    root: { minHeight: '100vh', background: '#09090b', color: '#fff', fontFamily: "system-ui, -apple-system, sans-serif" },
    container: { maxWidth: 1000, margin: '0 auto', padding: '60px 32px' },

    header: { textAlign: 'center', marginBottom: 60 },
    title: { fontSize: 36, fontWeight: 800, margin: '0 0 16px', letterSpacing: '-1px' },
    subtitle: { fontSize: 16, color: '#a1a1aa', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 32 },

    card: {
        background: '#111114', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40,
        display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.3s ease',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden'
    },
    iconBox: {
        width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24, boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
    },
    cardTitle: { fontSize: 24, fontWeight: 700, margin: '0 0 16px', color: '#fff' },
    cardDesc: { color: '#a1a1aa', fontSize: 14, lineHeight: 1.6, marginBottom: 32, flex: 1 },

    featureList: { listStyle: 'none', padding: 0, margin: '0 0 40px', display: 'flex', flexDirection: 'column', gap: 12 },

    cardBtn: {
        width: '100%', padding: '16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12,
        fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'transform 0.2s', textAlign: 'center'
    }
};
