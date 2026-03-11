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
import { DesktopIcon, MobileIcon, HintIcon } from '@shopify/polaris-icons';

// --- LOADER (Unchanged core logic) ---
export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const { shop, accessToken } = session;

    const theme = await getActiveTheme(shop, accessToken);
    if (!theme) return json({ error: "No active theme found" });

    let pageBlocks = [];
    try {
        const indexJsonStr = await getThemeAsset(shop, accessToken, theme.id, 'templates/index.json');
        if (indexJsonStr) {
            const indexJson = JSON.parse(indexJsonStr);
            const sections = indexJson.sections || {};
            const order = indexJson.order || Object.keys(sections);
            pageBlocks = order.map(id => ({
                id,
                type: sections[id]?.type || id,
                settings: sections[id]?.settings || {},
                isCf: id.startsWith('cf_'),
            }));
        }
    } catch (e) { /* continue */ }

    const categories = getCategoriesWithCounts();
    return json({ themeId: theme.id, shop, pageBlocks, categories });
};

// --- ACTION (Unchanged core logic) ---
// Keeping the backend Shopify API sync identical as it works
export { action } from "./app.theme-editor.action"; // Note: We need to pull the action out

import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';

// --- MAIN SHELL V2 ---
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
    const { device, setDevice, setActiveTab } = useThemeEditor();

    return (
        <ThemeEditorProvider>
            <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 overflow-hidden h-screen flex flex-col font-display">
                <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
                <script dangerouslySetInnerHTML={{
                    __html: `
                    tailwind.config = {
                        darkMode: "class",
                        theme: {
                            extend: {
                                colors: {
                                    "primary": "#35e212",
                                    "background-light": "#f6f8f6",
                                    "background-dark": "#132210",
                                    "polaris-bg": "#F4F6F8",
                                    "polaris-border": "#DFE3E8",
                                    "polaris-text": "#202223",
                                    "polaris-subdued": "#6D7175",
                                    "polaris-nav": "#1a1a1a"
                                },
                                fontFamily: {
                                    "display": ["Inter", "sans-serif"]
                                },
                            },
                        },
                    }
                    `
                }}></script>
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
                        <button className="text-white hover:bg-white/10 p-1.5 rounded transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined">arrow_back</span>
                            <span className="text-sm font-medium">Exit</span>
                        </button>
                        <div className="h-6 w-px bg-white/20 mx-1"></div>
                        <div className="flex items-center gap-2 text-white/90">
                            <span className="text-xs font-semibold uppercase tracking-wider">Dawn</span>
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
                        <div className="flex items-center gap-2 text-white/90 mr-4">
                            <span className="text-sm font-medium">Inspector</span>
                            <div className="w-8 h-4 bg-primary rounded-full relative cursor-pointer">
                                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                            </div>
                        </div>
                        <button className="bg-primary text-black px-4 py-1.5 rounded font-semibold text-sm hover:opacity-90 transition-opacity">
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
        </ThemeEditorProvider>
    );
}
