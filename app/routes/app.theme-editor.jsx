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
import { AppProvider } from '@shopify/polaris';

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

    return json({
        themeId: theme.id,
        shop,
        pageBlocks,
        categories: getCategoriesWithCounts(),
        templateFile,
        themeName: theme.name || 'Dawn',
    });
};

export { action } from "./app.theme-editor.action";

export default function ThemeEditorShell() {
    return (
        <AppProvider i18n={{}}>
            <ThemeEditorProvider>
                <ThemeEditorApp />
            </ThemeEditorProvider>
        </AppProvider>
    );
}

function ThemeEditorApp() {
    const {
        device, setDevice, saveSettings, selectedBlockId,
        themeName, undo, redo, canUndo, canRedo, hasUnsavedChanges, fetcher
    } = useThemeEditor();
    const navigate = useNavigate();
    const isSaving = fetcher?.state !== 'idle';

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                * { box-sizing: border-box; }
                body { margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
                ::-webkit-scrollbar { width: 5px; height: 5px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
                @keyframes cf-spin { to { transform: rotate(360deg); } }
                @keyframes cf-progress { 0%{left:0;width:0}50%{left:20%;width:60%}100%{left:100%;width:0} }
                @keyframes cf-fade-in { from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none} }
            `}</style>

            <div style={{
                width: '100vw', height: '100vh',
                display: 'flex', flexDirection: 'column',
                fontFamily: "'Inter', -apple-system, sans-serif",
                background: '#f4f6f8', overflow: 'hidden',
            }}>
                {/* ─── TOP BAR ─── */}
                <header style={{
                    height: 56,
                    background: '#fff',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    gap: 12,
                    flexShrink: 0,
                    zIndex: 100,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                    {/* LEFT: Logo + Theme Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
                        <button
                            onClick={() => navigate('/app')}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 8, transition: 'background 0.15s' }}
                            onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
                            onMouseOut={e => e.currentTarget.style.background = 'none'}
                        >
                            {/* CF Logo pill */}
                            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #5b00d1, #2563eb)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '-0.5px' }}>CF</span>
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>ConvertFlow</span>
                        </button>
                        <div style={{ width: 1, height: 22, background: '#e5e7eb' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{themeName || 'Dawn'}</span>
                            <span style={{ fontSize: 10, background: '#dcfce7', color: '#16a34a', padding: '1px 7px', borderRadius: 20, fontWeight: 700, letterSpacing: '0.02em' }}>LIVE</span>
                            <svg width="12" height="12" viewBox="0 0 20 20" fill="#9ca3af"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/></svg>
                        </div>
                    </div>

                    {/* CENTER: Device Toggle + Page Indicator */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', padding: 3, background: '#f3f4f6', borderRadius: 10, gap: 2 }}>
                            {[
                                { id: 'desktop', icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H9.5l.5 2H12a.75.75 0 010 1.5H8a.75.75 0 010-1.5h.5L9 14H4a2 2 0 01-2-2V5zm2-.5a.5.5 0 00-.5.5v7a.5.5 0 00.5.5h12a.5.5 0 00.5-.5V5a.5.5 0 00-.5-.5H4z"/></svg>, label: 'Desktop' },
                                { id: 'mobile', icon: <svg width="13" height="16" viewBox="0 0 14 20" fill="currentColor"><path d="M4 0a2 2 0 00-2 2v16a2 2 0 002 2h6a2 2 0 002-2V2a2 2 0 00-2-2H4zm0 1.5h6a.5.5 0 01.5.5v16a.5.5 0 01-.5.5H4a.5.5 0 01-.5-.5V2a.5.5 0 01.5-.5zm3 14.5a.75.75 0 100-1.5.75.75 0 000 1.5z"/></svg>, label: 'Mobile' },
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setDevice(opt.id)}
                                    title={opt.label}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        padding: '5px 12px', border: 'none', borderRadius: 8, cursor: 'pointer',
                                        fontSize: 12, fontWeight: 600,
                                        background: device === opt.id ? '#fff' : 'transparent',
                                        color: device === opt.id ? '#111827' : '#6b7280',
                                        boxShadow: device === opt.id ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {opt.icon}
                                    <span>{opt.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Live indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isSaving ? '#f59e0b' : '#22c55e', display: 'inline-block', boxShadow: isSaving ? '0 0 0 3px rgba(245,158,11,0.2)' : '0 0 0 3px rgba(34,197,94,0.2)' }} />
                            {isSaving ? 'Saving…' : 'Live Preview'}
                        </div>
                    </div>

                    {/* RIGHT: Undo / Redo / Save */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 180, justifyContent: 'flex-end' }}>
                        {[
                            { fn: undo, enabled: canUndo, title: 'Undo (Ctrl+Z)', icon: <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.061.025z"/></svg> },
                            { fn: redo, enabled: canRedo, title: 'Redo (Ctrl+Y)', icon: <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.207 2.232a.75.75 0 00.025 1.06l4.146 3.958H6.375a5.375 5.375 0 000 10.75H9.25a.75.75 0 000-1.5H6.375a3.875 3.875 0 010-7.75h10.003l-4.146 3.957a.75.75 0 001.036 1.085l5.5-5.25a.75.75 0 000-1.085l-5.5-5.25a.75.75 0 00-1.061.025z"/></svg> },
                        ].map((btn, i) => (
                            <button
                                key={i}
                                onClick={btn.fn}
                                disabled={!btn.enabled}
                                title={btn.title}
                                style={{
                                    width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: btn.enabled ? 'pointer' : 'not-allowed',
                                    color: btn.enabled ? '#374151' : '#d1d5db', transition: 'all 0.15s',
                                }}
                                onMouseOver={e => { if (btn.enabled) e.currentTarget.style.background = '#f9fafb'; }}
                                onMouseOut={e => { e.currentTarget.style.background = '#fff'; }}
                            >{btn.icon}</button>
                        ))}

                        {hasUnsavedChanges && !isSaving && (
                            <span style={{ fontSize: 11, color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>Unsaved</span>
                        )}

                        <button
                            onClick={saveSettings}
                            disabled={!selectedBlockId || isSaving}
                            style={{
                                height: 36, padding: '0 18px',
                                background: hasUnsavedChanges ? 'linear-gradient(135deg, #059669, #10b981)' : (selectedBlockId ? 'linear-gradient(135deg, #1f2937, #374151)' : '#e5e7eb'),
                                color: selectedBlockId ? '#fff' : '#9ca3af',
                                border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700,
                                cursor: (selectedBlockId && !isSaving) ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                                boxShadow: selectedBlockId ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                                letterSpacing: '0.01em',
                            }}
                        >
                            {isSaving ? 'Saving…' : hasUnsavedChanges ? '💾 Save Changes' : 'Save'}
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
        </>
    );
}
