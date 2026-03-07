import { json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { authenticate } from "../shopify.server";
import { readSectionFile, publishSection, injectSectionIntoTheme } from "../lib/shopify.server";
import { removeSchemaTranslations } from "../lib/schema-fixer.server";
import { SECTION_FILES } from "../lib/constants";

// ── LOADER ────────────────────────────────────────────────────────────────────
export const loader = async ({ request, params }) => {
    await authenticate.admin(request);
    const sectionId = params.sectionId;
    const sectionMeta = SECTION_FILES[sectionId];
    if (!sectionMeta) return redirect("/app");

    let rawLiquid = readSectionFile(sectionMeta.file);
    if (!rawLiquid) return redirect("/app");

    rawLiquid = removeSchemaTranslations(rawLiquid);

    // Extract schema JSON safely
    let editorSettings = [];
    let initialConfig = {};
    const sm = rawLiquid.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
    if (sm) {
        try {
            const schemaObj = JSON.parse(sm[1].trim());
            const SIMPLE = ['text', 'color', 'range', 'checkbox', 'select', 'textarea'];
            editorSettings = (schemaObj.settings || []).filter(s => SIMPLE.includes(s.type));
            editorSettings.forEach(s => { if (s.default !== undefined) initialConfig[s.id] = s.default; });
        } catch (e) { /* schema parse failed — show empty sidebar */ }
    }

    return json({ sectionId, sectionName: sectionMeta.name, sectionFile: sectionMeta.file, editorSettings, initialConfig });
};

// ── ACTION ────────────────────────────────────────────────────────────────────
export const action = async ({ request, params }) => {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const sectionId = params.sectionId;
    const settings = JSON.parse(formData.get("settings") || "{}");

    const sectionMeta = SECTION_FILES[sectionId];
    if (!sectionMeta) return json({ ok: false, error: "Section not found" }, { status: 400 });

    const rawLiquid = readSectionFile(sectionMeta.file);
    if (!rawLiquid) return json({ ok: false, error: "Section file not found on server" }, { status: 404 });

    const sectionKey = `cf-${sectionId}`;

    try {
        // 1. Publish Liquid file (translations auto-stripped inside)
        const { themeId } = await publishSection(session.shop, session.accessToken, sectionKey, rawLiquid);

        // 2. Inject into homepage index.json
        await injectSectionIntoTheme(session.shop, session.accessToken, themeId, sectionKey, settings);

        return json({ ok: true, message: `"${sectionMeta.name}" is now live on your homepage!` });
    } catch (e) {
        return json({ ok: false, error: e.message }, { status: 500 });
    }
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function VisualEditor() {
    const { sectionId, sectionName, sectionFile, editorSettings, initialConfig } = useLoaderData();
    const fetcher = useFetcher();
    const navigate = useNavigate();

    const [settings, setSettings] = useState(initialConfig);
    const [device, setDevice] = useState('desktop');
    const [previewHtml, setPreviewHtml] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);

    const isInjecting = fetcher.state !== "idle";
    const result = fetcher.data;

    // ── Fetch preview HTML when settings change (debounced 300ms) ────────────
    useEffect(() => {
        setPreviewLoading(true);
        const timer = setTimeout(async () => {
            try {
                const form = new FormData();
                // Use the sectionFile name (without .liquid) as the lookup ID
                form.append("sectionId", sectionFile.replace('.liquid', ''));
                form.append("settings", JSON.stringify(settings));

                const res = await fetch('/app/api/template-preview', { method: 'POST', body: form });
                if (res.ok) {
                    const data = await res.json();
                    if (data.html) setPreviewHtml(data.html);
                }
            } catch (e) {
                console.error("Preview fetch failed:", e);
            } finally {
                setPreviewLoading(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [settings, sectionFile]);

    const handleSetting = useCallback((id, val) => {
        setSettings(prev => ({ ...prev, [id]: val }));
    }, []);

    const handleInject = () => {
        const form = new FormData();
        form.append("settings", JSON.stringify(settings));
        fetcher.submit(form, { method: "post" });
    };

    return (
        <div style={S.layout}>
            <style>{CSS}</style>

            {/* ── TOPBAR ─────────────────────────────────────────────────── */}
            <header style={S.topbar}>
                <div style={S.topbarLeft}>
                    <button className="cf-back-btn" onClick={() => navigate('/app')}>
                        <Chevron />
                    </button>
                    <div>
                        <div style={S.title}>{sectionName}</div>
                        <div style={S.subtitle}>{sectionFile}</div>
                    </div>
                </div>

                <div style={S.devicePill}>
                    {['desktop', 'mobile'].map(d => (
                        <button key={d} className={`cf-dev-btn ${device === d ? 'active' : ''}`}
                            onClick={() => setDevice(d)}>{d === 'desktop' ? '🖥 Desktop' : '📱 Mobile'}</button>
                    ))}
                </div>

                <div style={S.topbarRight}>
                    {result?.ok && <span style={S.badge('#d1fae5', '#065f46')}>✓ {result.message}</span>}
                    {result?.error && <span style={S.badge('#fee2e2', '#991b1b')}>✗ {result.error}</span>}
                    <button className="cf-inject-btn" onClick={handleInject} disabled={isInjecting}>
                        {isInjecting ? '⏳ Injecting...' : '🚀 Inject to Homepage'}
                    </button>
                </div>
            </header>

            {/* ── MAIN ───────────────────────────────────────────────────── */}
            <div style={S.main}>
                {/* Sidebar */}
                <aside style={S.sidebar}>
                    <div style={S.sidebarHeader}>Section Settings</div>
                    {editorSettings.length === 0
                        ? <p style={S.empty}>No customizable settings found for this section.</p>
                        : <div style={S.controls}>
                            {editorSettings.map(s => (
                                <SettingControl key={s.id} setting={s} value={settings[s.id]} onChange={handleSetting} />
                            ))}
                        </div>
                    }
                </aside>

                {/* Canvas */}
                <main style={S.canvas}>
                    <div style={{ ...S.frame, width: device === 'mobile' ? 390 : '100%' }}>
                        {previewLoading && <div style={S.previewLoader}><Spinner /></div>}
                        <iframe
                            srcDoc={previewHtml}
                            style={{ ...S.iframe, opacity: previewLoading ? 0 : 1 }}
                            sandbox="allow-scripts allow-same-origin"
                            title="Section Preview"
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}

// ── SETTING CONTROL ───────────────────────────────────────────────────────────
function SettingControl({ setting, value, onChange }) {
    const v = value !== undefined ? value : (setting.default ?? '');
    return (
        <div style={S.ctrl}>
            <label style={S.label}>{setting.label || setting.id}</label>

            {setting.type === 'color' && (
                <div style={S.colorRow}>
                    <input type="color" value={v || '#000000'}
                        onChange={e => onChange(setting.id, e.target.value)} />
                    <code style={S.colorCode}>{v || '#000000'}</code>
                </div>
            )}
            {(setting.type === 'text' || setting.type === 'textarea') && (
                <input type="text" value={v}
                    placeholder={setting.placeholder || ''}
                    onChange={e => onChange(setting.id, e.target.value)} />
            )}
            {setting.type === 'range' && (
                <div style={S.rangeRow}>
                    <input type="range" min={setting.min} max={setting.max}
                        step={setting.step || 1} value={v}
                        onChange={e => onChange(setting.id, Number(e.target.value))} />
                    <span style={S.rangeVal}>{v}{setting.unit || ''}</span>
                </div>
            )}
            {setting.type === 'checkbox' && (
                <label style={S.checkRow}>
                    <input type="checkbox" checked={Boolean(v)}
                        onChange={e => onChange(setting.id, e.target.checked)} />
                    <span>Enabled</span>
                </label>
            )}
            {setting.type === 'select' && (
                <select value={v} onChange={e => onChange(setting.id, e.target.value)}>
                    {(setting.options || []).map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            )}
        </div>
    );
}

// ── ICONS ─────────────────────────────────────────────────────────────────────
const Chevron = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
);
const Spinner = () => <div className="cf-spinner" />;

// ── STYLES ────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', sans-serif; }
input[type="text"], input[type="number"], select, textarea {
  width: 100%; border: 1px solid #d1d5db; border-radius: 6px;
  padding: 7px 10px; font-size: 13px; font-family: inherit;
  background: #fff; transition: border 0.15s;
}
input:focus, select:focus, textarea:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
input[type="color"] { width: 38px; height: 30px; padding: 2px; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; }
input[type="range"] { flex: 1; accent-color: #6366f1; }
input[type="checkbox"] { accent-color: #6366f1; width: 16px; height: 16px; cursor: pointer; }
.cf-back-btn {
  width: 36px; height: 36px; border-radius: 50%; border: 1px solid #e5e7eb;
  background: #fff; display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #4b5563; transition: all 0.15s;
}
.cf-back-btn:hover { border-color: #6366f1; color: #6366f1; }
.cf-dev-btn {
  border: none; background: transparent; padding: 6px 14px; font-size: 12px;
  font-weight: 600; color: #6b7280; cursor: pointer; border-radius: 6px; transition: all 0.15s;
}
.cf-dev-btn.active { background: #fff; color: #111; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.cf-inject-btn {
  background: #4f46e5; color: #fff; border: none; padding: 9px 20px;
  border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer;
  transition: all 0.15s; box-shadow: 0 2px 6px rgba(79,70,229,0.3);
}
.cf-inject-btn:hover:not(:disabled) { background: #4338ca; transform: translateY(-1px); }
.cf-inject-btn:disabled { opacity: 0.6; cursor: default; }
.cf-spinner {
  width: 28px; height: 28px; border: 3px solid #e5e7eb;
  border-top-color: #6366f1; border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
aside::-webkit-scrollbar { width: 5px; }
aside::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
`;

const S = {
    layout: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#f3f4f6' },

    topbar: { height: 60, background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0, gap: 16 },
    topbarLeft: { display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 },
    title: { fontSize: 14, fontWeight: 700, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    subtitle: { fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' },

    devicePill: { display: 'flex', background: '#f3f4f6', borderRadius: 8, padding: 3, gap: 2, flexShrink: 0 },

    topbarRight: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
    badge: (bg, color) => ({ background: bg, color, padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }),

    main: { flex: 1, display: 'flex', overflow: 'hidden' },

    sidebar: { width: 300, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
    sidebarHeader: { padding: '16px 20px', fontWeight: 700, fontSize: 13, color: '#111', borderBottom: '1px solid #f3f4f6', letterSpacing: '-0.01em' },

    controls: { padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18 },
    ctrl: { display: 'flex', flexDirection: 'column', gap: 6 },
    label: { fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px' },

    colorRow: { display: 'flex', alignItems: 'center', gap: 10 },
    colorCode: { fontSize: 12, color: '#6b7280', background: '#f9fafb', padding: '3px 8px', borderRadius: 4 },
    rangeRow: { display: 'flex', alignItems: 'center', gap: 10 },
    rangeVal: { fontSize: 12, color: '#6b7280', minWidth: 36, textAlign: 'right' },
    checkRow: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#374151' },

    empty: { padding: '20px', fontSize: 13, color: '#9ca3af', fontStyle: 'italic' },

    canvas: { flex: 1, padding: 24, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' },
    frame: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', minHeight: '80vh', transition: 'width 0.3s ease', display: 'flex', flexDirection: 'column', position: 'relative' },
    previewLoader: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', zIndex: 2 },
    iframe: { width: '100%', flex: 1, border: 'none', minHeight: '80vh', transition: 'opacity 0.2s' },
};
