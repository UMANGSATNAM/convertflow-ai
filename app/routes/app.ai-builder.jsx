import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { hasActiveSubscription } from "../utils/billing.server";

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const hasSubscription = await hasActiveSubscription(shop);
    if (!hasSubscription) {
        return json({ requiresSubscription: true });
    }

    return json({ shop });
};

export default function AIBuilder() {
    const data = useLoaderData();
    const navigate = useNavigate();
    const fetcher = useFetcher();

    const [formData, setFormData] = useState({
        productName: "",
        niche: "Fitness",
        audience: "Millennials",
        tone: "Bold & Energetic",
    });

    const isGenerating = fetcher.state !== "idle";

    // Watch for success
    useEffect(() => {
        if (fetcher.data && fetcher.state === 'idle') {
            if (fetcher.data.success) {
                alert("✨ Magic Complete! Your Store is ready!\\n\\n" + fetcher.data.message);
                navigate('/app');
            } else {
                alert("Error: " + fetcher.data.message);
            }
        }
    }, [fetcher.data, fetcher.state, navigate]);

    if (data?.requiresSubscription) {
        return (
            <div style={{ height: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter' }}>
                <div style={{ textAlign: 'center', maxWidth: 400 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Premium Feature</h1>
                    <p style={{ color: '#a1a1aa', marginBottom: 24, lineHeight: 1.6 }}>The 1-Click AI Store Builder requires an active ConvertFlow AI Premium subscription.</p>
                    <button onClick={() => navigate('/app/subscribe')} style={{ padding: '14px 28px', background: '#ec4899', color: '#fff', borderRadius: 10, border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                        Upgrade Now
                    </button>
                    <div style={{ marginTop: 12 }}>
                        <button onClick={() => navigate('/app')} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>Go Back</button>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        fetcher.submit(
            { ...formData, _action: "generate_store" },
            { method: "post", action: "/api/ai-builder" }
        );
    };

    return (
        <div style={{ minHeight: '100vh', background: '#09090b', color: '#fff', fontFamily: "system-ui, -apple-system, sans-serif" }}>
            {/* Header */}
            <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: '#ec4899' }}>✨</span> AI Store Builder
                        </h1>
                        <p style={{ fontSize: 13, color: '#a1a1aa', margin: '4px 0 0' }}>Generate a conversion-optimized storefront in 60 seconds.</p>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 800, margin: '60px auto', padding: '0 32px' }}>
                <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 48, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>

                    {!isGenerating ? (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                                <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 16px' }}>Tell us about your brand</h2>
                                <p style={{ fontSize: 16, color: '#a1a1aa', lineHeight: 1.6, maxWidth: 500, margin: '0 auto' }}>
                                    Our AI engine will select the highest converting layouts and write tailored copy for your specific audience.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#e4e4e7' }}>Product or Brand Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Lumina Glow Serum or Titan Fitness"
                                        value={formData.productName}
                                        onChange={e => setFormData({ ...formData, productName: e.target.value })}
                                        style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 16, outline: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#e4e4e7' }}>Niche</label>
                                        <select
                                            value={formData.niche}
                                            onChange={e => setFormData({ ...formData, niche: e.target.value })}
                                            style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 16, outline: 'none', appearance: 'none' }}
                                        >
                                            <option value="Fitness">Fitness & Gym</option>
                                            <option value="Beauty">Beauty & Skincare</option>
                                            <option value="Pets">Pets & Accessories</option>
                                            <option value="Tech">Tech & Gadgets</option>
                                            <option value="Fashion">Apparel & Fashion</option>
                                            <option value="Home">Home & Decor</option>
                                            <option value="Supplements">Health Supplements</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#e4e4e7' }}>Target Audience</label>
                                        <select
                                            value={formData.audience}
                                            onChange={e => setFormData({ ...formData, audience: e.target.value })}
                                            style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 16, outline: 'none', appearance: 'none' }}
                                        >
                                            <option value="Gen Z">Gen Z (18-24)</option>
                                            <option value="Millennials">Millennials (25-40)</option>
                                            <option value="Parents">Parents</option>
                                            <option value="Professionals">Busy Professionals</option>
                                            <option value="Seniors">Seniors (65+)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#e4e4e7' }}>Brand Tone</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                                        {['Bold & Energetic', 'Luxury & Premium', 'Trustworthy & Clinical', 'Playful & Fun'].map(tone => (
                                            <button
                                                key={tone}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, tone })}
                                                style={{
                                                    padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                                    border: formData.tone === tone ? '2px solid #ec4899' : '1px solid rgba(255,255,255,0.1)',
                                                    background: formData.tone === tone ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.03)',
                                                    color: formData.tone === tone ? '#fbcfe8' : '#a1a1aa',
                                                    transition: 'all 0.2s', textAlign: 'center'
                                                }}
                                            >
                                                {tone}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!formData.productName}
                                    style={{
                                        marginTop: 24, width: '100%', padding: '20px',
                                        background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                                        color: '#fff', border: 'none', borderRadius: 16,
                                        fontSize: 18, fontWeight: 800, cursor: formData.productName ? 'pointer' : 'not-allowed',
                                        boxShadow: formData.productName ? '0 8px 25px rgba(236,72,153,0.4)' : 'none',
                                        opacity: formData.productName ? 1 : 0.5, transition: 'all 0.3s'
                                    }}
                                >
                                    Generate Storefront ✨
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <div className="ai-loader" style={{ width: 80, height: 80, margin: '0 auto 32px', border: '4px solid rgba(236,72,153,0.2)', borderTopColor: '#ec4899', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 16px', background: 'linear-gradient(to right, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Architecting Your Store...
                            </h2>
                            <p style={{ fontSize: 16, color: '#a1a1aa', maxWidth: 400, margin: '0 auto' }}>
                                Analyzing niche parameters, selecting premium conversion layouts, and generating tailored copy. This will take about 60 seconds.
                            </p>
                        </div>
                    )}

                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
