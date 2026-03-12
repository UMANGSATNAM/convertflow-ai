import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { getActiveTheme, getThemeAsset } from "../lib/shopify.server";
import { SECTION_FILES, getCategoriesWithCounts } from "../lib/constants";

import { ThemeEditorProvider } from "../components/ThemeEditor/ThemeEditorContext";
import { SidebarLeft } from "../components/ThemeEditor/SidebarLeft";
import { SidebarRight } from "../components/ThemeEditor/SidebarRight";
import { Canvas } from "../components/ThemeEditor/Canvas";
import { useThemeEditor } from "../components/ThemeEditor/ThemeEditorContext";

// --- LOADER ---
export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const { shop, accessToken } = session;

    const theme = await getActiveTheme(shop, accessToken);
    if (!theme) return json({ error: "No active theme found" });

    const url = new URL(request.url);
    const templateParam = url.searchParams.get('template') || 'index';
    const templateFile = templateParam === 'product' ? 'templates/product.json' : 'templates/index.json';

    let pageBlocks = [];
    try {
        const templateStr = await getThemeAsset(shop, accessToken, theme.id, templateFile);
        if (templateStr) {
            const templateJson = JSON.parse(templateStr);
            const sections = templateJson.sections || {};
            const order = templateJson.order || Object.keys(sections);
            pageBlocks = order.map(id => ({
                id,
                type: sections[id]?.type || id,
                settings: sections[id]?.settings || {},
                isCf: id.startsWith('cf_'),
            }));
        }
    } catch (e) { /* continue */ }

    const categories = getCategoriesWithCounts();
    return json({
        themeId: theme.id,
        shop,
        pageBlocks,
        categories,
        templateFile,
        themeName: theme.name || 'Dawn',
    });
};

// --- ACTION ---
export { action } from "./app.theme-editor.action";

import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';

// --- MAIN SHELL ---
export default function ThemeEditorV2Shell() {
    return (
        <AppProvider i18n={{}}>
            <ThemeEditorProvider>
                <ThemeEditorApp />
            </ThemeEditorProvider>
        </AppProvider>
    );
}

function ThemeEditorApp() {
    const { device, setDevice, saveSettings, selectedBlockId, activeBlock, themeName, blocks } = useThemeEditor();
    const navigate = useNavigate();

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#f4f6f8' }}>
            {/* ─── TOP BAR ─── */}
            <header style={{
                height: 52,
                background: '#fff',
                borderBottom: '1px solid #ebebeb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                flexShrink: 0,
                zIndex: 100,
                gap: 8,
            }}>
                {/* LEFT: Exit + Theme Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 200 }}>
                    <button
                        onClick={() => navigate('/app')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 6, color: '#303030' }}
                        title="Exit editor"
                    >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.56l3.22 3.22a.75.75 0 11-1.06 1.06l-4.5-4.5a.75.75 0 010-1.06l4.5-4.5a.75.75 0 011.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" /></svg>
                    </button>
                    <div style={{ width: 1, height: 20, background: '#ebebeb', margin: '0 4px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 6px', borderRadius: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#202223' }}>{themeName || 'Dawn'}</span>
                        <span style={{ fontSize: 11, background: '#d1e8d1', color: '#0d6e3d', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>Live</span>
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="#6d7175"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 000 1.06l4.25 4.25a.75.75 0 001.06 0l4.25-4.25a.75.75 0 00-1.06-1.06L10 11.94 6.28 8.22a.75.75 0 00-1.06 0z" /></svg>
                    </div>
                    <div style={{ width: 1, height: 20, background: '#ebebeb', margin: '0 4px' }} />
                    <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 6, fontSize: 13, color: '#303030', fontWeight: 500 }}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" /></svg>
                        Home page
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 000 1.06l4.25 4.25a.75.75 0 001.06 0l4.25-4.25a.75.75 0 00-1.06-1.06L10 11.94 6.28 8.22a.75.75 0 00-1.06 0z" /></svg>
                    </button>
                </div>

                {/* CENTER: Viewport Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#f1f2f4', borderRadius: 8, padding: 3 }}>
                    <button
                        onClick={() => setDevice('desktop')}
                        title="Desktop"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 30, border: 'none', borderRadius: 6, cursor: 'pointer', background: device === 'desktop' ? '#fff' : 'transparent', boxShadow: device === 'desktop' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: device === 'desktop' ? '#202223' : '#6d7175', transition: 'all 0.15s' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H9.5l.5 2H11.5a.75.75 0 010 1.5h-3a.75.75 0 010-1.5H9.5l.5-2H4a2 2 0 01-2-2V5zm2-.5a.5.5 0 00-.5.5v7a.5.5 0 00.5.5h12a.5.5 0 00.5-.5V5a.5.5 0 00-.5-.5H4z" /></svg>
                    </button>
                    <button
                        onClick={() => setDevice('mobile')}
                        title="Mobile"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 30, border: 'none', borderRadius: 6, cursor: 'pointer', background: device === 'mobile' ? '#fff' : 'transparent', boxShadow: device === 'mobile' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: device === 'mobile' ? '#202223' : '#6d7175', transition: 'all 0.15s' }}
                    >
                        <svg width="15" height="18" viewBox="0 0 14 20" fill="currentColor"><path d="M4 0a2 2 0 00-2 2v16a2 2 0 002 2h6a2 2 0 002-2V2a2 2 0 00-2-2H4zm0 1.5h6a.5.5 0 01.5.5v16a.5.5 0 01-.5.5H4a.5.5 0 01-.5-.5V2a.5.5 0 01.5-.5zm3 14.5a.75.75 0 100-1.5.75.75 0 000 1.5z" /></svg>
                    </button>
                </div>

                {/* RIGHT: Undo / Redo / Save */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 200, justifyContent: 'flex-end' }}>
                    <button title="Undo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: '1px solid #ebebeb', background: '#fff', cursor: 'pointer', borderRadius: 6, color: '#6d7175' }}>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.061.025z" clipRule="evenodd" /></svg>
                    </button>
                    <button title="Redo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: '1px solid #ebebeb', background: '#fff', cursor: 'pointer', borderRadius: 6, color: '#6d7175' }}>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.207 2.232a.75.75 0 00.025 1.06l4.146 3.958H6.375a5.375 5.375 0 000 10.75H9.25a.75.75 0 000-1.5H6.375a3.875 3.875 0 010-7.75h10.003l-4.146 3.957a.75.75 0 001.036 1.085l5.5-5.25a.75.75 0 000-1.085l-5.5-5.25a.75.75 0 00-1.061.025z" clipRule="evenodd" /></svg>
                    </button>
                    <div style={{ width: 1, height: 20, background: '#ebebeb' }} />
                    <button
                        onClick={saveSettings}
                        disabled={!selectedBlockId}
                        style={{
                            height: 32,
                            padding: '0 14px',
                            background: selectedBlockId ? '#303030' : '#c9cccf',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: selectedBlockId ? 'pointer' : 'not-allowed',
                            transition: 'background 0.15s',
                        }}
                    >
                        Save
                    </button>
                </div>
            </header>

            {/* ─── BODY ─── */}
            <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <SidebarLeft />
                <Canvas />
                <SidebarRight />
            </main>
        </div>
    );
}
