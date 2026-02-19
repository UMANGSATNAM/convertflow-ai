import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState, useMemo } from "react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { hasActiveSubscription } from "../utils/billing.server";

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const hasSubscription = await hasActiveSubscription(shop);

    let shopRecord = await db.shops.findByDomain(shop);
    if (!shopRecord) {
        shopRecord = await db.shops.create(shop, session.accessToken);
    }

    // Get category stats + top converting sections
    const [categoryStats, topConverting, allSections] = await Promise.all([
        db.sections.getCategories(),
        db.sections.getTopConverting(6),
        db.sections.getAll(),
    ]);

    return json({
        shop: shopRecord,
        hasSubscription,
        categoryStats,
        topConverting,
        totalSections: allSections.length,
    });
};

export default function Dashboard() {
    const { shop, hasSubscription, categoryStats, topConverting, totalSections } = useLoaderData();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    // Client-side search across top converting (for instant feel)
    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults(null);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch(`/app/api/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.results || []);
            }
        } catch (e) {
            console.error("Search error:", e);
        }
        setIsSearching(false);
    };

    const avgConversionScore = categoryStats.length > 0
        ? Math.round(categoryStats.reduce((s, c) => s + (c.avg_score || 0), 0) / categoryStats.length)
        : 0;

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* — HEADER — */}
            <div style={{
                background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Animated gradient accent */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #f59e0b, #6366f1)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 3s linear infinite',
                }} />

                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 48px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                <span style={{ fontSize: 28, lineHeight: 1 }}>⚡</span>
                                <h1 style={{
                                    fontSize: 32, fontWeight: 800, color: '#fff',
                                    letterSpacing: '-1px', margin: 0,
                                    background: 'linear-gradient(135deg, #fff, #c4b5fd)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                }}>
                                    Conversion Engine
                                </h1>
                            </div>
                            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: 0, maxWidth: 480 }}>
                                {totalSections}+ premium, research-backed sections engineered to maximize conversions.
                            </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {hasSubscription ? (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '8px 20px', background: 'rgba(34,197,94,0.1)',
                                    border: '1px solid rgba(34,197,94,0.3)', borderRadius: 100,
                                }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                                    <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                                        Premium Active
                                    </span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => navigate('/app/subscribe')}
                                    style={{
                                        padding: '12px 28px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        color: '#fff', border: 'none', borderRadius: 12,
                                        fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                        boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                                    }}
                                >
                                    ✨ Unlock Premium
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
                        marginTop: 32,
                    }}>
                        {[
                            { label: 'Total Sections', value: `${totalSections}+`, icon: '🎨' },
                            { label: 'Categories', value: categoryStats.length, icon: '📂' },
                            { label: 'Avg. Score', value: `${avgConversionScore}%`, icon: '📈' },
                            { label: 'Updates', value: 'Weekly', icon: '🔄' },
                        ].map((stat, i) => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 16, padding: '20px 24px',
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 20, marginBottom: 8 }}>{stat.icon}</div>
                                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{stat.value}</div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* — SEARCH BAR — */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
                <div style={{
                    marginTop: -28, position: 'relative', zIndex: 10,
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 16, padding: '4px 4px 4px 20px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        backdropFilter: 'blur(20px)',
                    }}>
                        <span style={{ fontSize: 18, opacity: 0.5 }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search 200+ sections by name… (e.g. Hero, CTA, Footer)"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{
                                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                color: '#fff', fontSize: 15, padding: '16px 0',
                            }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(""); setSearchResults(null); }}
                                style={{
                                    padding: '8px 16px', background: 'rgba(255,255,255,0.1)',
                                    border: 'none', borderRadius: 10, color: '#fff',
                                    fontSize: 13, cursor: 'pointer',
                                }}
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {searchResults && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0,
                            marginTop: 8, background: '#1a1a2e',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 16, overflow: 'hidden',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            maxHeight: 400, overflowY: 'auto',
                        }}>
                            {searchResults.length === 0 ? (
                                <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                    No sections found for "{searchQuery}"
                                </div>
                            ) : (
                                searchResults.map((section) => (
                                    <div
                                        key={section.id}
                                        onClick={() => {
                                            if (hasSubscription) navigate(`/app/sections/${section.id}/customize`);
                                        }}
                                        style={{
                                            padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
                                            alignItems: 'center', cursor: hasSubscription ? 'pointer' : 'default',
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div>
                                            <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                                                {section.name}
                                            </div>
                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                                                {section.category}
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: '4px 12px', borderRadius: 100,
                                            background: section.conversion_score >= 90 ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                                            color: section.conversion_score >= 90 ? '#4ade80' : 'rgba(255,255,255,0.6)',
                                            fontSize: 12, fontWeight: 700,
                                        }}>
                                            {section.conversion_score}%
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* — TOP CONVERTING ROW — */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
                            🏆 Top Converting
                        </h2>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
                            Highest performing sections across all categories
                        </p>
                    </div>
                </div>

                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
                }}>
                    {topConverting.map((section, i) => (
                        <div
                            key={section.id}
                            onClick={() => hasSubscription && navigate(`/app/sections/${section.id}/customize`)}
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 16, overflow: 'hidden',
                                cursor: hasSubscription ? 'pointer' : 'default',
                                transition: 'all 0.3s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {/* Mini HTML Preview */}
                            <div style={{
                                height: 140, overflow: 'hidden', position: 'relative',
                                background: '#111',
                            }}>
                                {section.html_code ? (
                                    <div
                                        style={{ transform: 'scale(0.35)', transformOrigin: 'top left', width: '286%', height: '286%', pointerEvents: 'none' }}
                                        dangerouslySetInnerHTML={{ __html: section.html_code }}
                                    />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 32, opacity: 0.2 }}>
                                        ✦
                                    </div>
                                )}
                                {/* Score Badge */}
                                <div style={{
                                    position: 'absolute', top: 8, right: 8,
                                    padding: '4px 10px', background: 'rgba(0,0,0,0.7)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: 100, display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                    <span style={{ fontSize: 10 }}>🔥</span>
                                    <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 800 }}>
                                        {section.conversion_score}%
                                    </span>
                                </div>
                                {i < 3 && (
                                    <div style={{
                                        position: 'absolute', top: 8, left: 8,
                                        padding: '3px 8px', background: i === 0 ? '#fbbf24' : i === 1 ? '#d1d5db' : '#b87333',
                                        color: '#000', borderRadius: 6, fontSize: 10, fontWeight: 800,
                                    }}>
                                        #{i + 1}
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: '14px 16px' }}>
                                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {section.name}
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                                    {section.category}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* — CATEGORY GRID — */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px 80px' }}>
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
                        📂 Browse by Category
                    </h2>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
                        {categoryStats.length} curated collections, {totalSections}+ premium designs
                    </p>
                </div>

                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16,
                }}>
                    {categoryStats.map((cat) => (
                        <div
                            key={cat.category}
                            onClick={() => navigate(`/app/sections/${cat.category.toLowerCase().replace(/[&]/g, '').replace(/\s+/g, '-')}`)}
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 16, padding: '28px 24px',
                                cursor: 'pointer', transition: 'all 0.3s',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 12,
                                    background: getCategoryGradient(cat.category),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 22,
                                }}>
                                    {getCategoryIcon(cat.category)}
                                </div>
                                <div>
                                    <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0, marginBottom: 4 }}>
                                        {cat.category}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                                            {cat.section_count} sections
                                        </span>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                                            background: cat.avg_score >= 90 ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                                            color: cat.avg_score >= 90 ? '#4ade80' : '#a78bfa',
                                        }}>
                                            avg {cat.avg_score}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }}>→</div>
                        </div>
                    ))}
                </div>

                {categoryStats.length === 0 && (
                    <div style={{
                        textAlign: 'center', padding: '80px 0',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px dashed rgba(255,255,255,0.1)',
                        borderRadius: 16,
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
                        <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>Library Initializing...</h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                            Run the seed command to populate 200+ premium sections.
                        </p>
                    </div>
                )}
            </div>

            {/* — UPSELL BANNER (if no subscription) — */}
            {!hasSubscription && (
                <div style={{
                    maxWidth: 1200, margin: '0 auto 80px', padding: '0 32px',
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: 20, padding: '48px 40px',
                        textAlign: 'center', position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', inset: 0, opacity: 0.1,
                            background: 'radial-gradient(circle at 30% 50%, #fff 0%, transparent 50%), radial-gradient(circle at 70% 50%, #fff 0%, transparent 50%)',
                        }} />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
                                Unlock the Full Engine
                            </h2>
                            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 28, maxWidth: 500, margin: '0 auto 28px' }}>
                                Get instant access to all {totalSections}+ premium sections, live HTML preview, and one-click theme installation.
                            </p>
                            <button
                                onClick={() => navigate('/app/subscribe')}
                                style={{
                                    padding: '16px 40px', background: '#fff', color: '#6366f1',
                                    border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800,
                                    cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                }}
                            >
                                Get Started — $20/mo →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* — FOOTER — */}
            <div style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                padding: '24px 32px', textAlign: 'center',
            }}>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                    © {new Date().getFullYear()} ConvertFlow AI — Conversion Engine. Designed for results.
                </span>
            </div>

            {/* Global CSS Animations */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @keyframes shimmer {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
                * { box-sizing: border-box; }
                ::placeholder { color: rgba(255,255,255,0.3); }
            `}</style>
        </div>
    );
}

function getCategoryIcon(category) {
    const icons = {
        'Hero Sections': '✨',
        'Announcement Bars': '📢',
        'Headers & Navigation': '🧭',
        'Feature Sections': '🔮',
        'Testimonials': '💬',
        'CTA Sections': '🎯',
        'Trust Badges': '🛡️',
        'Product Highlights': '🛍️',
        'Stats & Metrics': '📊',
        'Footer Sections': '📋',
    };
    return icons[category] || '📦';
}

function getCategoryGradient(category) {
    const gradients = {
        'Hero Sections': 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
        'Announcement Bars': 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(249,115,22,0.3))',
        'Headers & Navigation': 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(37,99,235,0.3))',
        'Feature Sections': 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(192,132,252,0.3))',
        'Testimonials': 'linear-gradient(135deg, rgba(236,72,153,0.3), rgba(244,114,182,0.3))',
        'CTA Sections': 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(16,185,129,0.3))',
        'Trust Badges': 'linear-gradient(135deg, rgba(20,184,166,0.3), rgba(6,182,212,0.3))',
        'Product Highlights': 'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(234,88,12,0.3))',
        'Stats & Metrics': 'linear-gradient(135deg, rgba(14,165,233,0.3), rgba(56,189,248,0.3))',
        'Footer Sections': 'linear-gradient(135deg, rgba(100,116,139,0.3), rgba(148,163,184,0.3))',
    };
    return gradients[category] || 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))';
}
