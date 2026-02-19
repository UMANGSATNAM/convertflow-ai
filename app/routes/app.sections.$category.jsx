import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState, useMemo } from "react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { hasActiveSubscription } from "../utils/billing.server";

export const loader = async ({ request, params }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const { category } = params;

    const hasSubscription = await hasActiveSubscription(shop);

    // Decode URL-style category back to DB category name
    const allCategories = await db.sections.getCategories();

    // Find the matching category by normalizing both sides
    const normalize = (str) => str.toLowerCase().replace(/[&]/g, '').replace(/\s+/g, '-');
    const matchedCategory = allCategories.find(c => normalize(c.category) === normalize(category));

    const categoryName = matchedCategory ? matchedCategory.category : category.replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const sections = await db.sections.getByCategory(categoryName);

    return json({
        category: categoryName,
        sections,
        hasSubscription,
        stats: matchedCategory || { section_count: sections.length, avg_score: 0 },
    });
};

export default function CategorySections() {
    const { category, sections, hasSubscription, stats } = useLoaderData();
    const navigate = useNavigate();
    const [sortBy, setSortBy] = useState('variation'); // variation, score-high, score-low
    const [previewId, setPreviewId] = useState(null);

    const sortedSections = useMemo(() => {
        const sorted = [...sections];
        if (sortBy === 'score-high') sorted.sort((a, b) => (b.conversion_score || 0) - (a.conversion_score || 0));
        if (sortBy === 'score-low') sorted.sort((a, b) => (a.conversion_score || 0) - (b.conversion_score || 0));
        return sorted;
    }, [sections, sortBy]);

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #f59e0b, #6366f1)',
                    backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite',
                }} />
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <button
                                onClick={() => navigate('/app/dashboard')}
                                style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: 18,
                                }}
                            >
                                ←
                            </button>
                            <div>
                                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
                                    {getCategoryIcon(category)} {category}
                                </h1>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                                        {sections.length} sections
                                    </span>
                                    <span style={{
                                        padding: '2px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                                        background: 'rgba(99,102,241,0.15)', color: '#a78bfa',
                                    }}>
                                        avg {stats.avg_score}% conversion
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Sort + Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                style={{
                                    padding: '8px 16px', background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                                    color: '#fff', fontSize: 13, outline: 'none', cursor: 'pointer',
                                }}
                            >
                                <option value="variation" style={{ background: '#1a1a2e' }}>Default Order</option>
                                <option value="score-high" style={{ background: '#1a1a2e' }}>Highest Score First</option>
                                <option value="score-low" style={{ background: '#1a1a2e' }}>Lowest Score First</option>
                            </select>

                            {!hasSubscription && (
                                <button
                                    onClick={() => navigate('/app/subscribe')}
                                    style={{
                                        padding: '8px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        color: '#fff', border: 'none', borderRadius: 8,
                                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                    }}
                                >
                                    🔒 Unlock All
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Banner */}
            {!hasSubscription && (
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 32px 0' }}>
                    <div style={{
                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                        <span style={{ fontSize: 18 }}>🔒</span>
                        <div>
                            <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 14 }}>Premium Collection</span>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginLeft: 8 }}>
                                Preview available —
                                <span onClick={() => navigate('/app/subscribe')} style={{ color: '#fbbf24', cursor: 'pointer', fontWeight: 600 }}> upgrade to customize & install</span>
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Sections Grid */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px 80px' }}>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20,
                }}>
                    {sortedSections.map((section) => (
                        <div
                            key={section.id}
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 16, overflow: 'hidden',
                                transition: 'all 0.3s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {/* HTML Preview */}
                            <div style={{
                                height: 220, overflow: 'hidden', position: 'relative',
                                background: '#111', cursor: 'pointer',
                            }}
                                onClick={() => setPreviewId(previewId === section.id ? null : section.id)}
                            >
                                {section.html_code ? (
                                    <div
                                        style={{
                                            transform: 'scale(0.4)', transformOrigin: 'top left',
                                            width: '250%', height: '250%', pointerEvents: 'none',
                                        }}
                                        dangerouslySetInnerHTML={{ __html: section.html_code }}
                                    />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 40, opacity: 0.15 }}>
                                        ✦
                                    </div>
                                )}
                                {/* Score Badge */}
                                <div style={{
                                    position: 'absolute', top: 10, right: 10,
                                    padding: '5px 12px', background: 'rgba(0,0,0,0.7)',
                                    backdropFilter: 'blur(8px)', borderRadius: 100,
                                    display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                    <span style={{
                                        color: section.conversion_score >= 93 ? '#4ade80' : section.conversion_score >= 88 ? '#fbbf24' : '#94a3b8',
                                        fontSize: 12, fontWeight: 800,
                                    }}>
                                        {section.conversion_score}%
                                    </span>
                                </div>

                                {/* Hover overlay */}
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    opacity: 0, transition: 'opacity 0.2s',
                                }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                                >
                                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
                                        Click to expand preview
                                    </span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{
                                        color: '#fff', fontWeight: 700, fontSize: 15, margin: 0, marginBottom: 4,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {section.name}
                                    </h3>
                                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                                        Variation #{section.variation_number} • {section.is_premium ? 'PRO' : 'Free'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => hasSubscription ? navigate(`/app/sections/${section.id}/customize`) : navigate('/app/subscribe')}
                                    style={{
                                        padding: '8px 20px',
                                        background: hasSubscription ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)',
                                        color: hasSubscription ? '#a78bfa' : '#fbbf24',
                                        border: '1px solid ' + (hasSubscription ? 'rgba(99,102,241,0.3)' : 'rgba(245,158,11,0.3)'),
                                        borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {hasSubscription ? 'Customize →' : '🔒 Unlock'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {sections.length === 0 && (
                    <div style={{
                        textAlign: 'center', padding: '80px 0',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px dashed rgba(255,255,255,0.1)',
                        borderRadius: 16,
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
                        <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>Collection Empty</h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                            No sections found for this category. Run the seed command.
                        </p>
                    </div>
                )}
            </div>

            {/* Full-screen Preview Modal */}
            {previewId && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 100,
                        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                        display: 'flex', flexDirection: 'column',
                    }}
                    onClick={() => setPreviewId(null)}
                >
                    <div style={{
                        padding: '16px 24px', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <div>
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
                                {sections.find(s => s.id === previewId)?.name}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginLeft: 12 }}>
                                Full Preview
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {hasSubscription && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/app/sections/${previewId}/customize`);
                                    }}
                                    style={{
                                        padding: '8px 20px', background: '#6366f1', color: '#fff',
                                        border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                    }}
                                >
                                    Customize This →
                                </button>
                            )}
                            <button
                                onClick={() => setPreviewId(null)}
                                style={{
                                    padding: '8px 16px', background: 'rgba(255,255,255,0.1)',
                                    border: 'none', borderRadius: 8, color: '#fff', fontSize: 18, cursor: 'pointer',
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    <div
                        style={{ flex: 1, overflow: 'auto', background: '#fff' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            dangerouslySetInnerHTML={{
                                __html: sections.find(s => s.id === previewId)?.html_code || ''
                            }}
                        />
                    </div>
                </div>
            )}

            {/* CSS */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @keyframes shimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
                * { box-sizing: border-box; }
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
