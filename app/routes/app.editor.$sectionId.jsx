import { json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { useState, useRef, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { readSectionFile, publishSection, injectSectionIntoTheme } from "../lib/shopify.server";
import { removeSchemaTranslations } from "../lib/schema-fixer.server";
import { SECTION_FILES } from "../lib/constants";

export const loader = async ({ request, params }) => {
    await authenticate.admin(request);
    const sectionId = params.sectionId;
    const sectionMeta = SECTION_FILES[sectionId];

    if (!sectionMeta) return redirect("/app");

    let rawLiquid = readSectionFile(sectionMeta.file);
    if (!rawLiquid) return redirect("/app");

    // Fix the schema in memory so we can parse it
    rawLiquid = removeSchemaTranslations(rawLiquid);

    // Try to extract the schema JSON to build dynamic controls
    let schemaObj = { settings: [] };
    const schemaMatch = rawLiquid.match(/{% schema %}([\s\S]*?){% endschema %}/);
    if (schemaMatch && schemaMatch[1]) {
        try {
            schemaObj = JSON.parse(schemaMatch[1].trim());
        } catch (e) {
            console.error("Failed to parse section schema JSON");
        }
    }

    // Filter out complex settings (blocks, etc) for this MVP editor, keep simple inputs
    const editorSettings = (schemaObj.settings || []).filter(s =>
        ['text', 'color', 'range', 'checkbox', 'select', 'textarea'].includes(s.type)
    );

    // Initial default values
    const initialConfig = {};
    editorSettings.forEach(s => {
        if (s.default !== undefined) initialConfig[s.id] = s.default;
    });

    return json({
        sectionId,
        sectionName: sectionMeta.name,
        editorSettings,
        initialConfig
    });
};

export const action = async ({ request, params }) => {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const sectionId = params.sectionId;
    const settings = JSON.parse(formData.get("settings") || "{}");

    const sectionMeta = SECTION_FILES[sectionId];
    if (!sectionMeta) return json({ error: "Invalid section" }, { status: 400 });

    const rawLiquid = readSectionFile(sectionMeta.file);
    const sectionKey = `cf-${sectionId}`;

    try {
        // 1. Publish the Liquid file to the theme (translations auto-fixed inside this fn)
        const publishRes = await publishSection(session.shop, session.accessToken, sectionKey, rawLiquid);

        // 2. Inject directly into the homepage templates/index.json
        const injectRes = await injectSectionIntoTheme(session.shop, session.accessToken, publishRes.themeId, sectionKey, settings);

        return json({ ok: true, blockId: injectRes.blockId });
    } catch (e) {
        return json({ ok: false, error: e.message }, { status: 500 });
    }
};

export default function VisualEditor() {
    const { sectionId, sectionName, editorSettings, initialConfig } = useLoaderData();
    const fetcher = useFetcher();
    const navigate = useNavigate();

    const [settings, setSettings] = useState(initialConfig);
    const [device, setDevice] = useState('desktop');
    const iframeRef = useRef(null);

    // Sync settings to the preview iframe
    useEffect(() => {
        if (!iframeRef.current) return;
        const form = new FormData();
        form.append("sectionId", sectionId);
        form.append("settings", JSON.stringify(settings));

        fetch('/app/api/template-preview', {
            method: 'POST',
            body: form
        })
            .then(res => res.json())
            .then(data => {
                if (data.html && iframeRef.current) {
                    iframeRef.current.srcdoc = data.html;
                }
            });
    }, [settings, sectionId]);

    const handleInject = () => {
        const form = new FormData();
        form.append("settings", JSON.stringify(settings));
        fetcher.submit(form, { method: "post" });
    };

    const isInjecting = fetcher.state !== "idle";
    const result = fetcher.data;

    return (
        <div style={S.layout}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                * { box-sizing: border-box; }
                input[type="color"] { padding: 0; border: none; border-radius: 4px; cursor: pointer; height: 28px; width: 40px; }
                input[type="text"], input[type="number"], select { width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 6px 10px; font-size: 13px; font-family: inherit; }
                input:focus, select:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }
                .sidebar-scroll::-webkit-scrollbar { width: 6px; }
                .sidebar-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
            `}</style>

            {/* Topbar */}
            <header style={S.topbar}>
                <div style={S.topbarLeft}>
                    <button onClick={() => navigate('/app')} style={S.backBtn}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    </button>
                    <div>
                        <h1 style={S.title}>{sectionName}</h1>
                        <p style={S.subtitle}>Visual Editor</p>
                    </div>
                </div>

                <div style={S.deviceToggles}>
                    <button style={{ ...S.deviceBtn, background: device === 'desktop' ? '#fff' : 'transparent', boxShadow: device === 'desktop' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }} onClick={() => setDevice('desktop')}>Desktop</button>
                    <button style={{ ...S.deviceBtn, background: device === 'mobile' ? '#fff' : 'transparent', boxShadow: device === 'mobile' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }} onClick={() => setDevice('mobile')}>Mobile</button>
                </div>

                <div style={S.topbarRight}>
                    {result?.ok && <span style={S.successBadge}>Injected successfully ✨</span>}
                    {result?.error && <span style={S.errorBadge}>{result.error}</span>}
                    <button style={S.injectBtn} onClick={handleInject} disabled={isInjecting}>
                        {isInjecting ? 'Injecting...' : 'Inject to Homepage'}
                    </button>
                </div>
            </header>

            <div style={S.main}>
                {/* Left Sidebar - Dynamic Controls */}
                <aside style={S.sidebar} className="sidebar-scroll">
                    <h2 style={S.sidebarTitle}>Section Settings</h2>
                    {editorSettings.length === 0 ? (
                        <p style={S.emptyState}>No simple settings available for this section.</p>
                    ) : (
                        <div style={S.controlsList}>
                            {editorSettings.map(setting => (
                                <div key={setting.id} style={S.controlGroup}>
                                    <label style={S.label}>{setting.label}</label>

                                    {setting.type === 'color' && (
                                        <div style={S.colorRow}>
                                            <input type="color" value={settings[setting.id] || setting.default || '#000000'} onChange={e => setSettings({ ...settings, [setting.id]: e.target.value })} />
                                            <span style={S.colorVal}>{settings[setting.id] || setting.default || '#000000'}</span>
                                        </div>
                                    )}

                                    {(setting.type === 'text' || setting.type === 'textarea') && (
                                        <input type="text" value={settings[setting.id] || ''} onChange={e => setSettings({ ...settings, [setting.id]: e.target.value })} />
                                    )}

                                    {setting.type === 'range' && (
                                        <div style={S.rangeRow}>
                                            <input type="range" min={setting.min} max={setting.max} step={setting.step} value={settings[setting.id] || setting.default || 0} onChange={e => setSettings({ ...settings, [setting.id]: Number(e.target.value) })} style={{ flex: 1 }} />
                                            <span style={S.rangeVal}>{settings[setting.id] || setting.default || 0}{setting.unit}</span>
                                        </div>
                                    )}

                                    {setting.type === 'checkbox' && (
                                        <label style={S.checkboxRow}>
                                            <input type="checkbox" checked={settings[setting.id] !== undefined ? settings[setting.id] : setting.default} onChange={e => setSettings({ ...settings, [setting.id]: e.target.checked })} />
                                            <span style={{ fontSize: 13 }}>{setting.label}</span>
                                        </label>
                                    )}

                                    {setting.type === 'select' && (
                                        <select value={settings[setting.id] || setting.default || ''} onChange={e => setSettings({ ...settings, [setting.id]: e.target.value })}>
                                            {setting.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </aside>

                {/* Center Canvas */}
                <main style={S.canvasArea}>
                    <div style={{ ...S.canvasWrapper, width: device === 'mobile' ? '390px' : '100%' }}>
                        <iframe
                            ref={iframeRef}
                            style={S.iframe}
                            sandbox="allow-scripts allow-same-origin"
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}

// ─── STYLES ─────────────────────────────────────────
const S = {
    layout: { height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", background: '#f3f4f6' },

    topbar: { height: 64, background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 },
    topbarLeft: { display: 'flex', alignItems: 'center', gap: 16 },
    backBtn: { width: 36, height: 36, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4b5563', transition: 'all 0.2s' },
    title: { fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 2px' },
    subtitle: { fontSize: 11, color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' },

    deviceToggles: { display: 'flex', background: '#f3f4f6', padding: 4, borderRadius: 8, gap: 4 },
    deviceBtn: { border: 'none', padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#4b5563', cursor: 'pointer', transition: 'all 0.2s' },

    topbarRight: { display: 'flex', alignItems: 'center', gap: 16 },
    injectBtn: { background: '#6366f1', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 4px rgba(99,102,241,0.2)' },
    successBadge: { fontSize: 13, fontWeight: 600, color: '#059669', background: '#d1fae5', padding: '6px 12px', borderRadius: 100 },
    errorBadge: { fontSize: 13, fontWeight: 600, color: '#dc2626', background: '#fee2e2', padding: '6px 12px', borderRadius: 100 },

    main: { flex: 1, display: 'flex', overflow: 'hidden' },

    sidebar: { width: 320, background: '#fff', borderRight: '1px solid #e5e7eb', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 },
    sidebarTitle: { margin: 0, fontSize: 15, fontWeight: 600, color: '#111' },
    controlsList: { display: 'flex', flexDirection: 'column', gap: 20 },
    controlGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
    label: { fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.3px' },

    colorRow: { display: 'flex', alignItems: 'center', gap: 12 },
    colorVal: { fontSize: 13, fontFamily: 'monospace', color: '#6b7280' },
    rangeRow: { display: 'flex', alignItems: 'center', gap: 12 },
    rangeVal: { fontSize: 12, color: '#6b7280', width: 40, textAlign: 'right' },
    checkboxRow: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },

    emptyState: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic' },

    canvasArea: { flex: 1, padding: 32, display: 'flex', justifyContent: 'center', overflowY: 'auto' },
    canvasWrapper: { background: '#fff', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' },
    iframe: { width: '100%', border: 'none', flex: 1 }
};
