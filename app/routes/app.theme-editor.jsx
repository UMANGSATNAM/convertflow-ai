import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { getActiveTheme, getThemeAsset } from "../lib/shopify.server";
import { SECTION_FILES, getCategoriesWithCounts } from "../lib/constants";

import { ThemeEditorProvider } from "../components/ThemeEditor/ThemeEditorContext";
import { SidebarLeft } from "../components/ThemeEditor/SidebarLeft";
import { SidebarRight } from "../components/ThemeEditor/SidebarRight";
import { Canvas } from "../components/ThemeEditor/Canvas";

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
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                    width: '100vw',
                    overflow: 'hidden',
                    fontFamily: 'var(--p-font-family-sans)'
                }}>

                    {/* Global Topbar (Shopify 1:1) */}
                    <header style={{
                        height: '56px',
                        background: '#1a1a1a', // Shopify dark topbar
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 16px',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '13px', display: 'flex', gap: '4px' }}>
                                &larr; Exit
                            </button>
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>Home page</span>
                        </div>
                    </header>

                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                        {/* Left Panel: Outline/DND */}
                        <SidebarLeft />

                        {/* Middle Panel: Iframe Canvas */}
                        <Canvas />

                        {/* Right Panel: Dynamic Schema Settings */}
                        <SidebarRight />
                    </div>

                </div>
            </ThemeEditorProvider>
        </AppProvider>
    );
}
