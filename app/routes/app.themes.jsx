import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { useState, useEffect, useRef } from "react";
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
        return json({ ...result, installedThemeName: themeName });
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
    const [installingName, setInstallingName] = useState(null);
    const [installedNames, setInstalledNames] = useState([]);
    const [toast, setToast] = useState(null);
    const prevFetcherState = useRef(fetcher.state);

    const categories = ['All', ...new Set(themes.map(t => t.niche_category))].sort();
    const filtered = filter === 'All' ? themes : themes.filter(t => t.niche_category === filter);

    // Handle fetcher result SAFELY via useEffect (not during render)
    useEffect(() => {
        if (prevFetcherState.current !== 'idle' && fetcher.state === 'idle' && fetcher.data) {
            if (fetcher.data.success) {
                const name = fetcher.data.installedThemeName;
                setInstalledNames(prev => [...prev, name]);
                setToast(fetcher.data.message || `✅ Theme installed!`);
                setTimeout(() => setToast(null), 5000);
            }
            setInstallingName(null);
        }
        prevFetcherState.current = fetcher.state;
    }, [fetcher.state, fetcher.data]);

    const handleInstall = (theme) => {
        if (installingName) return;
        setInstallingName(theme.name);
        const fd = new FormData();
        fd.append("themeName", theme.name);
        fetcher.submit(fd, { method: "POST" });
    };

    const isInstalling = fetcher.state !== 'idle';

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
        .nt-header__edit-btn { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 14px; font-family: 'Inter', sans-serif; transition: opacity .2s; white-space: nowrap; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
        .nt-header__edit-btn:hover { opacity: .85; }
        .nt-cats { display: flex; gap: 6px; padding: 20px 0 0; overflow-x: auto; scrollbar-width: none; padding-bottom: 1px; }
        .nt-cats::-webkit-scrollbar { display: none; }
        .nt-cat { background: none; border: none; padding: 8px 16px; cursor: pointer; font-size: 13px; font-weight: 600; color: #9ca3af; transition: all .2s; font-family: 'Inter', sans-serif; white-space: nowrap; border-bottom: 2px solid transparent; border-radius: 0; }
        .nt-cat.active { color: #a78bfa; border-bottom-color: #a78bfa; }
        .nt-cat:hover:not(.active) { color: #e5e7eb; }
        .nt-count { background: #1f2937; color: #9ca3af; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; }
        .nt-body { padding: 32px; }
        .nt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 20px; }
        .nt-card { background: #111118; border: 1px solid #ffffff0f; border-radius: 16px; overflow: hidden; transition: transform .25s, box-shadow .25s, border-color .25s; }
        .nt-card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.4); border-color: #ffffff1a; }
        .nt-card.installed { border-color: #4ade8044; box-shadow: 0 0 0 1px #4ade8022; }
        .nt-card__preview { height: 170px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 20px; position: relative; overflow: hidden; }
        .nt-card__hero-title { font-size: 14px; font-weight: 800; text-align: center; line-height: 1.2; }
        .nt-card__hero-sub { font-size: 10px; opacity: 0.6; text-align: center; }
        .nt-card__hero-btn { font-size: 10px; padding: 6px 16px; border-radius: 20px; font-weight: 700; display: inline-block; margin-top: 2px; }
        .nt-card__hero-products { display: flex; gap: 6px; margin-top: 6px; }
        .nt-card__hero-prod { width: 36px; height: 36px; border-radius: 8px; opacity: 0.5; }
        .nt-card__badge { position: absolute; top: 10px; right: 10px; font-size: 9px; font-weight: 700; padding: 3px 10px; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px; }
        .nt-card__badge--live { background: #4ade8022; color: #4ade80; border: 1px solid #4ade8044; }
        .nt-card__badge--real { background: #6366f122; color: #818cf8; border: 1px solid #6366f133; }
        .nt-card__body { padding: 16px; }
        .nt-card__niche { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #6b7280; margin-bottom: 4px; display: flex; align-items: center; gap: 5px; }
        .nt-card__name { font-size: 17px; font-weight: 800; color: #f1f5f9; margin-bottom: 6px; }
        .nt-card__desc { font-size: 12px; color: #6b7280; line-height: 1.5; margin-bottom: 14px; min-height: 36px; }
        .nt-card__tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
        .nt-card__tag { font-size: 10px; padding: 2px 8px; border-radius: 4px; background: #1f2937; color: #9ca3af; border: 1px solid #ffffff09; }
        .nt-card__tag--accent { border: 1px solid; }
        .nt-card__actions { display: flex; gap: 8px; }
        .nt-card__btn { flex: 1; padding: 11px; border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer; border: none; transition: all .2s; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .nt-card__btn--install { color: #000; }
        .nt-card__btn--install:hover { filter: brightness(1.1); transform: scale(1.02); }
        .nt-card__btn--loading { background: #1f2937 !important; color: #6b7280 !important; cursor: not-allowed; }
        .nt-card__btn--done { background: #4ade8018 !important; color: #4ade80 !important; border: 1px solid #4ade8033; }
        .nt-card__btn--edit { padding: 11px 14px; border-radius: 10px; background: #1f2937; color: #9ca3af; border: 1px solid #ffffff0f; cursor: pointer; font-size: 13px; transition: all .2s; font-family: 'Inter', sans-serif; }
        .nt-card__btn--edit:hover { background: #374151; color: #fff; }
        .nt-toast { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); background: #4ade80; color: #022c22; padding: 14px 28px; border-radius: 14px; font-weight: 700; font-size: 14px; z-index: 9999; box-shadow: 0 8px 30px rgba(74,222,128,.3); animation: toast-in .3s ease; white-space: nowrap; }
        @keyframes toast-in { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
        .nt-error { background: #ef444422; border: 1px solid #ef444455; color: #fca5a5; padding: 14px 20px; border-radius: 10px; margin-bottom: 20px; font-size: 14px; }
        .nt-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid #6b728044; border-top-color: #9ca3af; border-radius: 50%; animation: nt-spin .6s linear infinite; }
        @keyframes nt-spin { to { transform: rotate(360deg); } }
        @media(max-width: 660px) { .nt-body { padding: 16px; } .nt-header { padding: 20px 16px 0; } .nt-header__title { font-size: 20px; } .nt-grid { grid-template-columns: 1fr; } }
    `;

    return (
        <>
            <style>{styles}</style>
            <div className="nt-root">
                <div className="nt-header">
                    <button className="nt-header__back" onClick={() => navigate('/app')}>← Dashboard</button>
                    <div className="nt-header__top">
                        <div>
                            <div className="nt-header__title">🎨 Real Niche Themes</div>
                            <div className="nt-header__sub">
                                {themes.length} premium themes with real Liquid sections — products auto-fetch from your store
                            </div>
                        </div>
                        <button className="nt-header__edit-btn" onClick={() => navigate('/app/theme-editor')}>
                            ✏️ Drag & Drop Editor
                        </button>
                    </div>
                    <div className="nt-cats">
                        {categories.map(cat => (
                            <button key={cat} className={`nt-cat ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>
                                {cat !== 'All' && ICONS[cat] ? `${ICONS[cat]} ` : ''}{cat}
                                {cat !== 'All' && <span style={{ opacity: .5, marginLeft: 3 }}>({themes.filter(t => t.niche_category === cat).length})</span>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="nt-body">
                    {fetcher.data?.success === false && (
                        <div className="nt-error">
                            ❌ {fetcher.data.message || fetcher.data.error}
                        </div>
                    )}
                    <div className="nt-grid">
                        {filtered.map((theme, idx) => {
                            const isThisInstalling = installingName === theme.name;
                            const isThisInstalled = installedNames.includes(theme.name);
                            const bg = theme.color_background;
                            const primary = theme.color_primary;
                            const text = theme.color_text;
                            const isLightBg = ['#ffffff', '#fafafa', '#f8fafc', '#f0fdf4', '#fff1f2', '#fffbeb',
                                '#faf5ff', '#fdf8f0', '#ecfeff', '#f0f4ff', '#fff7ed', '#fdf4ff',
                                '#fdf2f8', '#f5f3ff', '#f0f9ff', '#f7fee7', '#fdfaf6', '#fff9f0',
                                '#fdf8f0', '#f0fdf4', '#fff8f1'].includes(bg);

                            return (
                                <div key={theme.name} className={`nt-card ${isThisInstalled ? 'installed' : ''}`}>
                                    <div className="nt-card__preview" style={{ background: bg }}>
                                        <div className="nt-card__hero-title" style={{ color: text, fontFamily: theme.font_heading + ', sans-serif' }}>
                                            {theme.name}
                                        </div>
                                        <div className="nt-card__hero-sub" style={{ color: text }}>
                                            {theme.description.split('.')[0]}
                                        </div>
                                        <div className="nt-card__hero-btn" style={{ background: primary, color: isLightBg ? '#fff' : '#000' }}>
                                            Shop Now →
                                        </div>
                                        <div className="nt-card__hero-products">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="nt-card__hero-prod" style={{ background: primary + '44' }} />
                                            ))}
                                        </div>
                                        <div className={`nt-card__badge ${isThisInstalled ? 'nt-card__badge--live' : 'nt-card__badge--real'}`}>
                                            {isThisInstalled ? '✓ Live' : '⚡ Real Liquid'}
                                        </div>
                                    </div>
                                    <div className="nt-card__body">
                                        <div className="nt-card__niche">
                                            {ICONS[theme.niche_category]} {theme.niche_category}
                                        </div>
                                        <div className="nt-card__name">{theme.name}</div>
                                        <div className="nt-card__desc">{theme.description}</div>
                                        <div className="nt-card__tags">
                                            <span className="nt-card__tag">{theme.font_heading}</span>
                                            <span className="nt-card__tag">{theme.font_body}</span>
                                            <span className="nt-card__tag nt-card__tag--accent" style={{ background: primary + '18', color: primary, borderColor: primary + '44' }}>
                                                10 Sections
                                            </span>
                                        </div>
                                        <div className="nt-card__actions">
                                            <button
                                                className={`nt-card__btn ${isThisInstalling ? 'nt-card__btn--loading' : isThisInstalled ? 'nt-card__btn--done' : 'nt-card__btn--install'}`}
                                                style={!isThisInstalling && !isThisInstalled ? { background: primary } : {}}
                                                onClick={() => handleInstall(theme)}
                                                disabled={isThisInstalling || isInstalling}
                                            >
                                                {isThisInstalling ? (
                                                    <><span className="nt-spinner" /> Installing...</>
                                                ) : isThisInstalled ? (
                                                    '✓ Installed!'
                                                ) : (
                                                    '🚀 Install Theme'
                                                )}
                                            </button>
                                            {isThisInstalled && (
                                                <button className="nt-card__btn--edit" onClick={() => navigate('/app/theme-editor')}>
                                                    ✏️ Edit
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {toast && (
                    <div className="nt-toast">{toast}</div>
                )}
            </div>
        </>
    );
}
