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

    // Determine which template to load (default: index.json)
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
    const { device, setDevice, saveSettings, selectedBlockId, activeBlock, themeName } = useThemeEditor();
    const navigate = useNavigate();

    const handleSave = () => {
        saveSettings();
    };

    const handleExit = () => {
        navigate('/app');
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 overflow-hidden h-screen flex flex-col font-display">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            <style dangerouslySetInnerHTML={{
                __html: `
                .sidebar-scroll::-webkit-scrollbar { width: 4px; }
                .sidebar-scroll::-webkit-scrollbar-thumb { background: #DFE3E8; border-radius: 10px; }
                .material-symbols-outlined { font-size: 20px; vertical-align: middle; }
                `
            }}></style>

            {/* Top Navigation Bar */}
            <header className="h-12 bg-polaris-nav flex items-center justify-between px-3 shrink-0 z-50">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExit}
                        className="text-white hover:bg-white/10 p-1.5 rounded transition-colors flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span className="text-sm font-medium">Exit</span>
                    </button>
                    <div className="h-6 w-px bg-white/20 mx-1"></div>
                    <div className="flex items-center gap-2 text-white/90">
                        <span className="text-xs font-semibold uppercase tracking-wider">{themeName || 'Dawn'}</span>
                        <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">Live</span>
                    </div>
                </div>

                {/* Viewport Switcher */}
                <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/10">
                    <button 
                        onClick={() => setDevice('desktop')}
                        className={`px-3 py-1 rounded-md text-white shadow-sm transition-colors ${device === 'desktop' ? 'bg-white/20' : 'text-white/60 hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined">desktop_windows</span>
                    </button>
                    <button 
                        onClick={() => setDevice('mobile')}
                        className={`px-3 py-1 rounded-md text-white shadow-sm transition-colors ${device === 'mobile' ? 'bg-white/20' : 'text-white/60 hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined">smartphone</span>
                    </button>
                    <button className="px-3 py-1 text-white/60 hover:text-white">
                        <span className="material-symbols-outlined">fullscreen</span>
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Save Status Indicator */}
                    {activeBlock && (
                        <span className="text-xs text-white/60">
                            Editing: {activeBlock.type}
                        </span>
                    )}
                    <button 
                        onClick={handleSave}
                        disabled={!selectedBlockId}
                        className={`px-4 py-1.5 rounded font-semibold text-sm transition-opacity ${
                            selectedBlockId 
                                ? 'bg-primary text-black hover:opacity-90 cursor-pointer' 
                                : 'bg-white/20 text-white/40 cursor-not-allowed'
                        }`}
                    >
                        Save
                    </button>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden">
                {/* Left Panel: Outline/DND */}
                <SidebarLeft />

                {/* Middle Panel: Iframe Canvas */}
                <Canvas />

                {/* Right Panel: Dynamic Schema Settings */}
                <SidebarRight />
            </main>
        </div>
    );
}
