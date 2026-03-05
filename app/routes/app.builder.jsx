import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";

// ═══════ ICONS ═══════
const ICONS = {
    wand: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>`,
    layout: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>`,
    click: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 9c0-1.1.9-2 2-2h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/><path d="M9 3H5a2 2 0 0 0-2 2v4"/><path d="M15 3h4a2 2 0 0 1 2 2v4"/><path d="M9 21H5a2 2 0 0 1-2-2v-4"/><path d="M15 21h4a2 2 0 0 0 2-2v-4"/></svg>`,
    ai: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity="0.3"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`
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

    const tools = [
        {
            key: 'ai', icon: 'ai', color: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
            badge: '🚀 60-Second Magic',
            title: '1-Click AI Store Builder',
            desc: 'Tell us your product and niche. Our AI generates a complete, conversion-optimized homepage with tailored copy and premium sections — in 60 seconds.',
            features: ['🧠 AI-generated conversion copy', '🔄 Optimal layout selection', '⚡ Built in under 60 seconds', '🛡️ Auto-installs winning sections'],
            btn: 'Generate My Store ✨',
            path: '/app/ai-builder',
            featured: true,
        },
        {
            key: 'page', icon: 'layout', color: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            title: 'Full Page Builder',
            desc: 'Pick from 20+ complete page designs for Home, Product, Collection, Blog, Cart & more. Or inject custom Liquid code into any page.',
            features: ['📄 20+ designs per page type', '🔄 Replace entire pages in one click', '{ } Custom Liquid code injector'],
            btn: 'Open Page Builder',
            path: '/app/page-builder',
        },
        {
            key: 'themes', icon: 'wand', color: 'linear-gradient(135deg, #ec4899, #f43f5e)',
            title: '50 Prebuilt Niche Themes',
            desc: '1-click install a complete premium store tailored for specific industries — Fitness, Beauty, Tech, Pets, and 46 more niches.',
            features: ['🛍️ 50 unique niches', '🎨 Global color & font injection', '⚡ Installs all recommended sections'],
            btn: 'Browse Themes Gallery',
            path: '/app/themes',
        },
        {
            key: 'live', icon: 'click', color: 'linear-gradient(135deg, #6366f1, #a855f7)',
            title: 'Live Section Picker',
            desc: 'Click any section on your theme and instantly browse premium alternative designs — one-click apply to your live theme.',
            features: ['👆 Click & swap visual editor', '🎨 10–20 premium designs per type', '📱 Works on all devices'],
            btn: 'Open Live Builder',
            path: '/app/live-builder',
        },
    ];

    return (
        <div style={S.root}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                .cf-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
                .cf-card:hover { transform: translateY(-4px); box-shadow: 0 32px 60px rgba(0,0,0,0.4) !important; }
                .cf-btn:hover { opacity: 0.88; }
                @media (max-width: 768px) {
                    .cf-grid { grid-template-columns: 1fr !important; }
                    .cf-hero { flex-direction: column !important; gap: 24px !important; }
                    .cf-header h1 { font-size: 28px !important; }
                    .cf-container { padding: 32px 16px !important; }
                }
            `}</style>

            <div className="cf-container" style={S.container}>
                {/* Header */}
                <div className="cf-header" style={S.header}>
                    <div style={S.pill}>⚡ ConvertFlow Builder Hub</div>
                    <h1 style={S.title}>Build Your Perfect Shopify Store</h1>
                    <p style={S.subtitle}>Four powerful tools to create, customize, and optimize your store — without writing a single line of code.</p>
                </div>

                {/* Cards Grid */}
                <div className="cf-grid" style={S.grid}>
                    {tools.map((tool, i) => (
                        <div
                            key={tool.key}
                            className="cf-card"
                            style={{
                                ...S.card,
                                ...(tool.featured ? S.featuredCard : {}),
                            }}
                            onClick={() => navigate(tool.path)}
                        >
                            {tool.badge && (
                                <div style={S.badge}>{tool.badge}</div>
                            )}
                            <div className="cf-hero" style={tool.featured ? S.heroRow : {}}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ ...S.iconBox, background: tool.color }}>
                                        <SVG name={tool.icon} color="#fff" />
                                    </div>
                                    <h2 style={{ ...S.cardTitle, fontSize: tool.featured ? 26 : 20 }}>{tool.title}</h2>
                                    <p style={S.cardDesc}>{tool.desc}</p>
                                    <ul style={S.featureList}>
                                        {tool.features.map(f => <li key={f} style={S.featureItem}>{f}</li>)}
                                    </ul>
                                    <button className="cf-btn" style={{ ...S.cardBtn, background: tool.color }}>{tool.btn}</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom tips */}
                <div style={S.footer}>
                    <span style={{ color: '#52525b', fontSize: 13 }}>💡 Tip: Start with the AI Builder for the fastest store launch, then use Page Builder & Themes to refine.</span>
                </div>
            </div>
        </div>
    );
}

// ═══════ STYLES ═══════
const S = {
    root: {
        minHeight: '100vh', background: '#09090b', color: '#fff',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    },
    container: { maxWidth: 1040, margin: '0 auto', padding: '56px 28px' },

    header: { textAlign: 'center', marginBottom: 56 },
    pill: {
        display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
        textTransform: 'uppercase', padding: '6px 16px', borderRadius: 100,
        background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)',
        marginBottom: 24
    },
    title: { fontSize: 38, fontWeight: 900, letterSpacing: '-1.5px', margin: '0 0 16px', lineHeight: 1.1 },
    subtitle: { fontSize: 16, color: '#71717a', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 40 },

    card: {
        background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24,
        padding: 36, display: 'flex', flexDirection: 'column', cursor: 'pointer',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)', position: 'relative', overflow: 'hidden'
    },
    featuredCard: {
        gridColumn: '1 / -1', background: 'linear-gradient(135deg, #0c0c14 0%, #1a1040 100%)',
        border: '1px solid rgba(99,102,241,0.4)',
        boxShadow: '0 10px 40px rgba(99,102,241,0.15)'
    },
    heroRow: { display: 'flex', flexDirection: 'row', gap: 32 },
    badge: {
        display: 'inline-block', fontSize: 10, fontWeight: 800, letterSpacing: 1,
        textTransform: 'uppercase', background: '#ec4899', color: '#fff',
        padding: '4px 12px', borderRadius: 100, marginBottom: 20
    },
    iconBox: {
        width: 56, height: 56, borderRadius: 14, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 20, boxShadow: '0 8px 20px rgba(0,0,0,0.25)'
    },
    cardTitle: { fontWeight: 800, margin: '0 0 12px', color: '#f4f4f5', lineHeight: 1.2 },
    cardDesc: { color: '#71717a', fontSize: 14, lineHeight: 1.7, marginBottom: 24 },
    featureList: { listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10 },
    featureItem: { fontSize: 13, color: '#a1a1aa' },
    cardBtn: {
        display: 'block', width: '100%', padding: '14px 20px', color: '#fff', border: 'none',
        borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'center',
        letterSpacing: 0.2
    },
    footer: {
        textAlign: 'center', padding: '20px 0',
        borderTop: '1px solid rgba(255,255,255,0.05)'
    }
};
