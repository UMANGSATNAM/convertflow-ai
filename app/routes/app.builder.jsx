import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";

// ═══════ ICONS ═══════
const ICONS = {
    wand: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>`,
    layout: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>`
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

                <div style={S.grid}>
                    {/* Option 1: Store Builder */}
                    <div style={S.card} onClick={() => navigate('/app/store-builder')}>
                        <div style={{ ...S.iconBox, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                            <SVG name="wand" color="#fff" />
                        </div>
                        <h2 style={S.cardTitle}>Ultimate Store Builder</h2>
                        <p style={S.cardDesc}>
                            Use our guided 13-step wizard to quickly assemble a high-converting, beautiful homepage from scratch.
                            Perfect for starting fresh or doing a complete redesign.
                        </p>
                        <ul style={S.featureList}>
                            <li>✨ Guided step-by-step workflow</li>
                            <li>🚀 Builds full page in 5 minutes</li>
                            <li>🎨 Curated high-converting templates</li>
                        </ul>
                        <button style={S.cardBtn}>Launch Store Builder</button>
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
