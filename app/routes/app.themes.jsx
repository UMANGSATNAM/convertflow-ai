import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher, useNavigation } from "@remix-run/react";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { batchInstallStoreBuilder } from "../utils/theme-integration.server";
import db from "../db.server";

export const loader = async ({ request }) => {
    await authenticate.admin(request);

    // Fetch all themes from DB
    const themes = await db.themes.getAll();
    return json({ themes });
};

export const action = async ({ request }) => {
    try {
        const { session, admin } = await authenticate.admin(request);
        const formData = await request.formData();

        if (formData.get("_action") !== "install_theme") {
            return json({ success: false, message: "Invalid action" });
        }

        const themeId = formData.get("themeId");
        if (!themeId) return json({ success: false, message: "No theme selected." });

        const theme = await db.themes.getById(themeId);
        if (!theme) return json({ success: false, message: "Theme not found." });

        // Fetch top sections for this niche
        const allSections = await db.sections.getAll();

        const categories = [
            "Headers", "Hero Sections", "Trust Indicators", "Features & Benefits",
            "Products", "Social Proof", "FAQ & Accordions", "Call to Action", "Footers"
        ];

        const selectedSections = [];

        // 1. We create a "Theme Global Variables" section that applies the theme's colors and fonts globally
        const globalStyleSection = {
            name: "Theme Styles - " + theme.name,
            category: "Global Setup",
            conversion_score: 100,
            html_code: `
                <style>
                    :root {
                        --cf-primary: ${theme.color_primary};
                        --cf-secondary: ${theme.color_secondary};
                        --cf-background: ${theme.color_background};
                        --cf-text: ${theme.color_text};
                        --cf-font-heading: '${theme.font_heading}', sans-serif;
                        --cf-font-body: '${theme.font_body}', sans-serif;
                    }

                    .cf-section-wrapper h1, .cf-section-wrapper h2, .cf-section-wrapper h3 {
                        font-family: var(--cf-font-heading) !important;
                        color: var(--cf-text) !important;
                    }
                    
                    .cf-section-wrapper p, .cf-section-wrapper span, .cf-section-wrapper a {
                        font-family: var(--cf-font-body) !important;
                        color: var(--cf-text) !important;
                    }

                    .cf-section-wrapper button {
                        background: var(--cf-primary) !important;
                        color: #ffffff !important;
                        border-radius: 8px !important;
                        font-family: var(--cf-font-heading) !important;
                    }
                </style>
                <div style="display:none;">ConvertFlow Theme Styles Engine Active</div>
            `
        };
        selectedSections.push(globalStyleSection);

        for (const cat of categories) {
            const matches = allSections
                .filter(s => s.category.includes(cat) || cat.includes(s.category))
                .sort((a, b) => b.conversion_score - a.conversion_score);

            if (matches.length > 0) {
                // Try to find a niche specific one
                let bestMatch = matches[0];
                const nicheMatches = matches.filter(s => s.name.toLowerCase().includes(theme.niche_category.toLowerCase()));
                if (nicheMatches.length > 0) {
                    bestMatch = nicheMatches[0];
                }

                // Deep copy
                const cloned = JSON.parse(JSON.stringify(bestMatch));

                // If theme has a specific background color logic, we can apply it.
                // For now, we rely on the global CSS vars above to cascade down.
                selectedSections.push(cloned);
            }
        }

        // Install to Active Theme
        const installResult = await batchInstallStoreBuilder(admin, session, selectedSections);

        if (installResult.success) {
            return json({
                success: true,
                message: `Successfully installed the "${theme.name}" Theme architecture.`
            });
        } else {
            return json({ success: false, message: installResult.error || "Batch installation failed." });
        }

    } catch (error) {
        console.error("API / Theme Install error:", error);
        return json({ success: false, message: error.message || "An unexpected error occurred." });
    }
};

export default function ThemesBrowser() {
    const { themes } = useLoaderData();
    const navigate = useNavigate();
    const fetcher = useFetcher();

    const [filterMenu, setFilterMenu] = useState('All');

    // Group themes by category
    const categories = ['All', ...new Set(themes.map(t => t.niche_category))].sort();

    const filteredThemes = filterMenu === 'All'
        ? themes
        : themes.filter(t => t.niche_category === filterMenu);

    const isInstalling = fetcher.state !== "idle";

    useEffect(() => {
        if (fetcher.data && fetcher.state === 'idle') {
            if (fetcher.data.success) {
                alert("✨ Magic Complete! Your Theme is ready!\\n\\n" + fetcher.data.message);
            } else {
                alert("Error: " + fetcher.data.message);
            }
        }
    }, [fetcher.data, fetcher.state]);

    const handleInstall = (themeId) => {
        if (confirm("This will configure your homepage with sections optimized for this theme. Continue?")) {
            fetcher.submit(
                { themeId, _action: "install_theme" },
                { method: "post" }
            );
        }
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
                            <span style={{ color: '#ec4899' }}>🎨</span> Premium Niche Themes
                        </h1>
                        <p style={{ fontSize: 13, color: '#a1a1aa', margin: '4px 0 0' }}>Browse 50+ conversion-optimized themes for specific industries.</p>
                    </div>
                </div>
            </div>

            <div style={{ padding: '40px 32px', maxWidth: 1400, margin: '0 auto' }}>

                {/* Filters */}
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterMenu(cat)}
                            style={{
                                padding: '8px 16px', borderRadius: 100, border: '1px solid',
                                borderColor: filterMenu === cat ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                background: filterMenu === cat ? 'rgba(99,102,241,0.1)' : 'transparent',
                                color: filterMenu === cat ? '#fff' : '#a1a1aa',
                                fontWeight: filterMenu === cat ? 600 : 400,
                                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {isInstalling ? (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <div className="ai-loader" style={{ width: 80, height: 80, margin: '0 auto 32px', border: '4px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 16px', background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Installing Theme Architecture...
                        </h2>
                        <p style={{ fontSize: 16, color: '#a1a1aa' }}>Injecting premium layouts and configuring global color/font variables to your store.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                        {filteredThemes.map(theme => (
                            <div key={theme.id} style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                {/* Preview Banner using Theme Colors */}
                                <div style={{ height: 160, background: theme.color_background, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: 1, textTransform: 'uppercase' }}>
                                        {theme.niche_category}
                                    </div>
                                    <h3 style={{ fontFamily: `"${theme.font_heading}", sans-serif`, color: theme.color_text, margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: '-1px' }}>
                                        {theme.name}
                                    </h3>
                                    {/* Abstract shapes for decoration based on primary color */}
                                    <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: theme.color_primary, opacity: 0.2, filter: 'blur(10px)' }} />
                                    <div style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: '50%', background: theme.color_secondary, opacity: 0.3, filter: 'blur(5px)' }} />
                                </div>

                                <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h4 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>{theme.name}</h4>
                                    <p style={{ fontSize: 14, color: '#a1a1aa', margin: '0 0 24px', lineHeight: 1.5, flex: 1 }}>{theme.description}</p>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                        <div style={{ fontSize: 12, color: '#71717a', fontWeight: 600, textTransform: 'uppercase' }}>Colors:</div>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: theme.color_primary, border: '1px solid rgba(255,255,255,0.2)' }} title="Primary" />
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: theme.color_secondary, border: '1px solid rgba(255,255,255,0.2)' }} title="Secondary" />
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: theme.color_background, border: '1px solid rgba(255,255,255,0.2)' }} title="Background" />
                                        </div>
                                    </div>

                                    <button
                                        className="theme-install-btn"
                                        onClick={() => handleInstall(theme.id)}
                                        style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))', border: '1px solid rgba(99,102,241,0.3)', color: '#c4b5fd', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        1-Click Install Theme
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                button.theme-install-btn:hover { background: #6366f1 !important; color: #fff !important; }
                button:hover { filter: brightness(1.2); }
            `}</style>
        </div>
    );
}
