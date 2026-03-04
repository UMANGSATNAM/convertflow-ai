import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { createSubscription, SUBSCRIPTION_PLAN } from "../utils/billing.server";

export const loader = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    return json({ shop: session.shop, plan: SUBSCRIPTION_PLAN });
};

export const action = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    try {
        const { confirmationUrl } = await createSubscription(admin, session.shop);
        return redirect(confirmationUrl);
    } catch (error) {
        return json({ error: error.message }, { status: 500 });
    }
};

const Icon = ({ svg, size = 20 }) => (
    <span style={{ display: 'inline-flex', width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />
);

const ICONS = {
    check: `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    zap: `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    shield: `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    star: `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
};

const FEATURES = [
    { text: '237+ Premium Sections' },
    { text: 'Full Theme Customization' },
    { text: 'One-Click Installation' },
    { text: 'Zero Theme Conflicts' },
    { text: 'Mobile Responsive Designs' },
    { text: 'Color & Font Editor' },
    { text: 'Conversion Optimized' },
    { text: 'Sales Booster Widgets' },
    { text: 'Regular Updates' },
    { text: 'Priority Support' },
];

export default function Subscribe() {
    const { shop, plan } = useLoaderData();

    return (
        <div style={S.root}>
            <div style={S.container}>
                <div style={S.header}>
                    <div style={S.badge}>PREMIUM</div>
                    <h1 style={S.title}>Unlock All Features</h1>
                    <p style={S.subtitle}>Get instant access to everything ConvertFlow AI has to offer</p>
                </div>

                <div style={S.card}>
                    <div style={S.cardTop}>
                        <div>
                            <h2 style={S.planName}>{plan.name}</h2>
                            <p style={S.planDesc}>Everything you need to boost conversions</p>
                        </div>
                        <div style={S.priceBox}>
                            <span style={S.price}>${plan.price}</span>
                            <span style={S.period}>/month</span>
                        </div>
                    </div>

                    <div style={S.features}>
                        <h3 style={S.featuresTitle}>What's Included:</h3>
                        <div style={S.featureGrid}>
                            {FEATURES.map((f, i) => (
                                <div key={i} style={S.featureItem}>
                                    <Icon svg={ICONS.check} size={18} />
                                    <span style={S.featureText}>{f.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={S.categories}>
                        <h3 style={S.featuresTitle}>Section Categories:</h3>
                        <div style={S.catGrid}>
                            {['Hero Sections', 'Product Pages', 'Collection Pages', 'Announcement Bars',
                                'Trust Badges', 'CTA Sections', 'Testimonials', 'Headers & Nav',
                                'Footer Sections', 'Feature Sections', 'Product Grids', 'Stats & Metrics', 'And More...'].map((c, i) => (
                                    <span key={i} style={S.catBadge}>{c}</span>
                                ))}
                        </div>
                    </div>

                    <form method="post">
                        <button type="submit" style={S.cta}>
                            <Icon svg={ICONS.zap} size={20} />
                            Subscribe Now — ${plan.price}/month
                        </button>
                    </form>
                    <p style={S.note}>Cancel anytime. No hidden fees. 3-day free trial.</p>
                </div>

                <a href="/app" style={S.backLink}>← Back to Dashboard</a>
            </div>
        </div>
    );
}

const S = {
    root: {
        minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #fff 40%, #f5f0ff 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    container: { maxWidth: 560, width: '100%', textAlign: 'center' },
    header: { marginBottom: 32 },
    badge: {
        display: 'inline-block', padding: '4px 14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#fff', borderRadius: 100, fontSize: 11, fontWeight: 800, letterSpacing: 2, marginBottom: 16
    },
    title: { fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: -1 },
    subtitle: { fontSize: 16, color: '#64748b', margin: 0 },

    card: {
        background: '#fff', borderRadius: 20, boxShadow: '0 4px 40px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0', overflow: 'hidden', textAlign: 'left'
    },
    cardTop: {
        padding: '28px 32px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff'
    },
    planName: { fontSize: 20, fontWeight: 800, margin: '0 0 4px' },
    planDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0 },
    priceBox: { textAlign: 'right' },
    price: { fontSize: 36, fontWeight: 900 },
    period: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },

    features: { padding: '28px 32px', borderBottom: '1px solid #f1f5f9' },
    featuresTitle: { fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' },
    featureGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    featureItem: { display: 'flex', alignItems: 'center', gap: 8 },
    featureText: { fontSize: 14, color: '#334155', fontWeight: 500 },

    categories: { padding: '20px 32px 24px' },
    catGrid: { display: 'flex', flexWrap: 'wrap', gap: 6 },
    catBadge: {
        padding: '5px 12px', background: '#f1f5f9', color: '#475569', borderRadius: 6,
        fontSize: 12, fontWeight: 600
    },

    cta: {
        width: 'calc(100% - 64px)', margin: '0 32px 16px', padding: '16px 24px',
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff',
        border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: '0 4px 20px rgba(79,70,229,0.3)'
    },
    note: { fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '0 32px 24px', margin: 0 },
    backLink: {
        display: 'inline-block', marginTop: 20, fontSize: 14, color: '#64748b',
        textDecoration: 'none'
    }
};
