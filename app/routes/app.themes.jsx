import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { installRealTheme } from "../utils/real-theme-installer.server";
import { NICHE_THEMES } from "../sections/liquid/themes-config";

export const loader = async ({ request }) => {
    await authenticate.admin(request);
    return json({ themes: NICHE_THEMES });
};

export const action = async ({ request }) => {
    try {
        const { session, admin } = await authenticate.admin(request);
        const formData = await request.formData();
        const themeName = formData.get("themeName");
        const themeConfig = NICHE_THEMES.find(t => t.name === themeName);

        if (!themeConfig) {
            return json({ success: false, message: `Theme "${themeName}" not found.` });
        }
        const result = await installRealTheme(admin, session, themeConfig);

        return json(result);
    } catch (error) {
        console.error("Theme Install Error:", error);
        return json({ success: false, message: error.message });
    }
};

const ICONS = {
    Fitness: "💪", Beauty: "💄", Pets: "🐾", Tech: "⚡",
    Fashion: "👗", Accessories: "💎", Home: "🏡", Health: "🌿",
    Food: "☕", Kids: "🧸", Outdoors: "🏔️", Automotive: "🏎️",
    Hobbies: "🎨", Sports: "🏆", Gaming: "🎮", Misc: "🚀",
};

export default function ThemesBrowser() {
    const { themes } = useLoaderData();
    const navigate = useNavigate();
    const fetcher = useFetcher();

    const [filter, setFilter] = useState('All');
    const [installingIdx, setInstallingIdx] = useState(null);
    const [installedIdx, setInstalledIdx] = useState(null);

    const categories = ['All', ...new Set(themes.map(t => t.niche_category))].sort();
    const filtered = filter === 'All' ? themes : themes.filter(t => t.niche_category === filter);

    const handleInstall = (theme, idx) => {
        if (installingIdx !== null) return;
        setInstallingIdx(idx);
        const fd = new FormData();
        fd.append("themeName", theme.name);
        fetcher.submit(fd, { method: "POST" });
    };

    if (fetcher.state === 'idle' && installingIdx !== null && fetcher.data) {
        if (fetcher.data.success) {
            setInstalledIdx(installingIdx);
        }
        setInstallingIdx(null);
    }

    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .nt-root { font-family: 'Inter', sans-serif; background: #0a0a0f; min-height: 100vh; color: #fff; padding: 0; }
        .nt-header { background: linear-gradient(135deg, #1a0533 0%, #0d1f3c 100%); padding: 32px 32px 0; border-bottom: 1px solid #ffffff12; }
        .nt-header__back { background: none; border: 1px solid #ffffff22; color: #9ca3af; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-family: 'Inter', sans-serif; transition: all .2s; margin-bottom: 20px; display: inline-flex; align-items: center; gap: 6px; }
        .nt-header__back:hover { border-color: #ffffff44; color: #fff; }
        .nt-header__top { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 0; }
        .nt-header__title { font-size: 28px; font-weight: 900; color: #fff; display: flex; align-items: center; gap: 10px; }
        .nt-header__sub { color: #9ca3af; font-size: 14px; margin-top: 6px; }
        .nt-header__edit-btn { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 14px; font-family: 'Inter', sans-serif; transition: opacity .2s; white-space: nowrap; }
        .nt-header__edit-btn:hover { opacity: .85; }
        .nt-cats { display: flex; gap: 8px; padding: 16px 0 0; overflow-x: auto; scrollbar-width: none; padding-bottom: 1px; }
        .nt-cats::-webkit-scrollbar { display: none; }
        .nt-cat { background: none; border: none; padding: 8px 18px; border-radius: 50px; cursor: pointer; font-size: 13px; font-weight: 600; color: #9ca3af; transition: all .2s; font-family: 'Inter', sans-serif; white-space: nowrap; border-bottom: 2px solid transparent; border-radius: 0; }
        .nt-cat.active { color: #a78bfa; border-bottom-color: #a78bfa; }
        .nt-cat:hover:not(.active) { color: #e5e7eb; }
        .nt-body { padding: 32px; }
        .nt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .nt-card { background: #111118; border: 1px solid #ffffff0f; border-radius: 16px; overflow: hidden; transition: transform .25s, box-shadow .25s, border-color .25s; position: relative; cursor: default; }
        .nt-card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.4); border-color: #ffffff1a; }
        .nt-card.installed { border-color: #4ade8055; }
        .nt-card__preview { height: 160px; display: flex; align-items: flex-end; justify-content: flex-start; padding: 16px; position: relative; overflow: hidden; }
        .nt-card__hero-mock {
            position: absolute; inset: 0;
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 20px;
        }
        .nt-card__hero-title { font-size: 13px; font-weight: 800; text-align: center; line-height: 1.2; opacity: 0.9; }
        .nt-card__hero-btn { font-size: 10px; padding: 5px 14px; border-radius: 20px; font-weight: 700; }
        .nt-card__hero-products { display: flex; gap: 4px; margin-top: 4px; }
        .nt-card__hero-prod { width: 32px; height: 32px; border-radius: 6px; opacity: 0.7; }
        .nt-card__badge { position: absolute; top: 10px; right: 10px; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px; }
        .nt-card__badge.installed { background: #4ade8033; color: #4ade80; border: 1px solid #4ade8055; }
        .nt-card__badge.new { background: #60a5fa22; color: #60a5fa; border: 1px solid #60a5fa44; }
        .nt-card__body { padding: 16px; }
        .nt-card__niche { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #6b7280; margin-bottom: 4px; display: flex; align-items: center; gap: 5px; }
        .nt-card__name { font-size: 16px; font-weight: 800; color: #f1f5f9; margin-bottom: 6px; }
        .nt-card__desc { font-size: 12px; color: #6b7280; line-height: 1.5; margin-bottom: 14px; min-height: 36px; }
        .nt-card__fonts { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
        .nt-card__font-tag { font-size: 10px; padding: 2px 8px; border-radius: 4px; background: #1f2937; color: #9ca3af; border: 1px solid #ffffff09; }
        .nt-card__actions { display: flex; gap: 8px; }
        .nt-card__install-btn { flex: 1; padding: 10px; border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer; border: none; transition: all .2s; font-family: 'Inter', sans-serif; }
        .nt-card__install-btn.primary { color: #000; }
        .nt-card__install-btn.primary:hover { filter: brightness(1.1); }
        .nt-card__install-btn.loading { background: #374151; color: #9ca3af; cursor: not-allowed; }
        .nt-card__install-btn.done { background: #4ade8022; color: #4ade80; border: 1px solid #4ade8055; }
        .nt-card__edit-btn { padding: 10px 12px; border-radius: 10px; background: #1f2937; color: #9ca3af; border: 1px solid #ffffff0f; cursor: pointer; font-size: 13px; transition: all .2s; font-family: 'Inter', sans-serif; }
        .nt-card__edit-btn:hover { background: #374151; color: #fff; border-color: #6366f1; }
        .nt-success-toast { position: fixed; bottom: 32px; right: 32px; background: #4ade80; color: #022c22; padding: 14px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; z-index: 9999; box-shadow: 0 8px 30px rgba(74,222,128,.3); animation: slide-in .3s ease; }
        @keyframes slide-in { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @media(max-width: 660px) { .nt-body { padding: 16px; } .nt-header { padding: 20px 16px 0; } .nt-header__title { font-size: 20px; } }
    `;

    return (
        <>
            <style>{styles}</style>
            <div className="nt-root">
                <div className="nt-header">
                    <button className="nt-header__back" onClick={() => navigate('/app')}>← Back to Dashboard</button>
                    <div className="nt-header__top">
                        <div>
                            <div className="nt-header__title">🎨 Real Niche Themes</div>
                            <div className="nt-header__sub">
                                {themes.length} complete themes — real Liquid code, product auto-fetch, 1-click install
                            </div>
                        </div>
                        <button className="nt-header__edit-btn" onClick={() => navigate('/app/theme-editor')}>
                            ✏️ Edit Installed Theme
                        </button>
                    </div>
                    <div className="nt-cats">
                        {categories.map(cat => (
                            <button key={cat} className={`nt-cat ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>
                                {cat !== 'All' && ICONS[cat] ? `${ICONS[cat]} ` : ''}{cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="nt-body">
                    {fetcher.data?.success === false && (
                        <div style={{ background: '#ef444422', border: '1px solid #ef444455', color: '#fca5a5', padding: '14px 20px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px' }}>
                            ❌ {fetcher.data.message || fetcher.data.error}
                        </div>
                    )}
                    <div className="nt-grid">
                        {filtered.map((theme, idx) => {
                            const realIdx = NICHE_THEMES.indexOf(theme);
                            const isInstalling = installingIdx === realIdx;
                            const isInstalled = installedIdx === realIdx;
                            const bg = theme.color_background;
                            const primary = theme.color_primary;
                            const text = theme.color_text;
                            const isDark = bg.length > 4 && bg !== '#ffffff' && bg !== '#fafafa' && bg !== '#f8fafc' && bg !== '#fff';

                            return (
                                <div key={realIdx} className={`nt-card ${isInstalled ? 'installed' : ''}`}>
                                    <div className="nt-card__preview" style={{ background: bg }}>
                                        <div className="nt-card__hero-mock">
                                            <div className="nt-card__hero-title" style={{ color: text, fontFamily: theme.font_heading + ', sans-serif' }}>
                                                {theme.name}
                                            </div>
                                            <div className="nt-card__hero-btn" style={{ background: primary, color: isDark ? '#000' : '#fff' }}>
                                                Shop Now →
                                            </div>
                                            <div className="nt-card__hero-products">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="nt-card__hero-prod" style={{ background: primary + '55' }} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className={`nt-card__badge ${isInstalled ? 'installed' : 'new'}`}>
                                            {isInstalled ? '✓ Installed' : 'Real Liquid'}
                                        </div>
                                    </div>
                                    <div className="nt-card__body">
                                        <div className="nt-card__niche">
                                            {ICONS[theme.niche_category]} {theme.niche_category}
                                        </div>
                                        <div className="nt-card__name">{theme.name}</div>
                                        <div className="nt-card__desc">{theme.description}</div>
                                        <div className="nt-card__fonts">
                                            <span className="nt-card__font-tag">{theme.font_heading}</span>
                                            <span className="nt-card__font-tag">{theme.font_body}</span>
                                            <span className="nt-card__font-tag" style={{ background: primary + '22', color: primary, borderColor: primary + '44' }}>
                                                10 Sections
                                            </span>
                                        </div>
                                        <div className="nt-card__actions">
                                            <button
                                                className={`nt-card__install-btn ${isInstalling ? 'loading' : isInstalled ? 'done' : 'primary'}`}
                                                style={!isInstalling && !isInstalled ? { background: primary } : {}}
                                                onClick={() => handleInstall(theme, realIdx)}
                                                disabled={isInstalling}
                                            >
                                                {isInstalling ? '⏳ Installing...' : isInstalled ? '✓ Installed!' : '🚀 Install Theme'}
                                            </button>
                                            <button className="nt-card__edit-btn" onClick={() => navigate('/app/theme-editor')}>
                                                ✏️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {fetcher.data?.success && (
                    <div className="nt-success-toast">
                        ✅ {fetcher.data.message || 'Theme installed successfully!'}
                    </div>
                )}
            </div>
        </>
    );
}
