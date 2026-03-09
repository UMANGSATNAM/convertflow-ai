import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { useState, useEffect, useRef } from "react";
import { authenticate } from "../shopify.server";
import {
    getActiveTheme, getThemeAsset, uploadAsset, readSectionFile
} from "../lib/shopify.server";
import { removeSchemaTranslations } from "../lib/schema-fixer.server";
import { SECTION_FILES, getCategoriesWithCounts } from "../lib/constants";

// ─── LOADER ───────────────────────────────────────────────────────────────────
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

// ─── ACTION ───────────────────────────────────────────────────────────────────
export const action = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const { shop, accessToken } = session;
    const fd = await request.formData();
    const intent = fd.get("intent");

    const theme = await getActiveTheme(shop, accessToken);
    if (!theme) return json({ ok: false, error: "No active theme" });

    const getIndex = async () => {
        const str = await getThemeAsset(shop, accessToken, theme.id, 'templates/index.json');
        const json = str ? JSON.parse(str) : { sections: {}, order: [] };
        json.sections = json.sections || {};
        json.order = json.order || Object.keys(json.sections);
        return json;
    };
    const saveIndex = async (idx) => {
        await uploadAsset(shop, accessToken, theme.id, 'templates/index.json', JSON.stringify(idx, null, 2));
    };

    try {
        // ── inject_section ────────────────────────────────────────────────────
        if (intent === "inject_section") {
            const sectionId = fd.get("sectionId");
            const settings = JSON.parse(fd.get("settings") || "{}");
            const placement = fd.get("placement") || "bottom";

            const meta = SECTION_FILES[sectionId];
            if (!meta) return json({ ok: false, error: "Unknown section" });

            let liquid = readSectionFile(meta.file);
            if (!liquid) return json({ ok: false, error: "Section file missing" });
            liquid = removeSchemaTranslations(liquid);

            // Upload the liquid file
            const assetKey = `sections/${sectionId}.liquid`;
            await uploadAsset(shop, accessToken, theme.id, assetKey, liquid);

            // Update index.json
            const idx = await getIndex();
            const blockId = `cf_${sectionId}_${Date.now().toString(36)}`;
            idx.sections[blockId] = { type: sectionId, settings };

            if (placement === "top") {
                const hi = idx.order.findIndex(id => id.toLowerCase().includes("header"));
                hi !== -1 ? idx.order.splice(hi + 1, 0, blockId) : idx.order.unshift(blockId);
            } else {
                const fi = idx.order.findIndex(id => id.toLowerCase().includes("footer"));
                fi !== -1 ? idx.order.splice(fi, 0, blockId) : idx.order.push(blockId);
            }
            await saveIndex(idx);

            // Return updated page blocks
            const newBlocks = idx.order.map(id => ({
                id, type: idx.sections[id]?.type || id,
                settings: idx.sections[id]?.settings || {},
                isCf: id.startsWith('cf_'),
            }));
            return json({ ok: true, message: `${meta.name} injected!`, pageBlocks: newBlocks, newBlockId: blockId });
        }

        // ── remove_section ─────────────────────────────────────────────────
        if (intent === "remove_section") {
            const blockId = fd.get("blockId");
            const idx = await getIndex();
            delete idx.sections[blockId];
            idx.order = idx.order.filter(id => id !== blockId);
            await saveIndex(idx);
            const newBlocks = idx.order.map(id => ({
                id, type: idx.sections[id]?.type || id,
                settings: idx.sections[id]?.settings || {},
                isCf: id.startsWith('cf_'),
            }));
            return json({ ok: true, pageBlocks: newBlocks });
        }

        // ── update_settings ────────────────────────────────────────────────
        if (intent === "update_settings") {
            const blockId = fd.get("blockId");
            const settings = JSON.parse(fd.get("settings") || "{}");
            const idx = await getIndex();
            if (idx.sections[blockId]) idx.sections[blockId].settings = settings;
            await saveIndex(idx);
            return json({ ok: true, message: "Settings saved to theme!" });
        }

        // ── reorder ────────────────────────────────────────────────────────
        if (intent === "reorder") {
            const newOrder = JSON.parse(fd.get("order") || "[]");
            const idx = await getIndex();
            idx.order = newOrder;
            await saveIndex(idx);
            return json({ ok: true });
        }

        return json({ ok: false, error: "Unknown intent" });
    } catch (e) {
        return json({ ok: false, error: e.message }, { status: 500 });
    }
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function ThemeEditor() {
    const { themeId, shop, pageBlocks: initBlocks, categories, error } = useLoaderData();
    const fetcher = useFetcher();
    const navigate = useNavigate();

    const [pageBlocks, setPageBlocks] = useState(initBlocks || []);
    const [activeBlockId, setActiveBlockId] = useState(null);

    // Right panel state: 'categories' | 'templates' | 'settings'
    const [rightView, setRightView] = useState('categories');
    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState(null);
    const [templateSchema, setTemplateSchema] = useState({ settings: [], name: '' });
    const [settings, setSettings] = useState({});
    const [placement, setPlacement] = useState('bottom');
    const [device, setDevice] = useState('desktop');
    const [previewHtml, setPreviewHtml] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const previewTimerRef = useRef(null);

    // Sync page blocks from action response
    useEffect(() => {
        if (fetcher.data?.pageBlocks) {
            setPageBlocks(fetcher.data.pageBlocks);
        }
        if (fetcher.data?.message) {
            setToast({ msg: fetcher.data.message, ok: fetcher.data.ok });
            setTimeout(() => setToast(null), 3000);
        }
        if (fetcher.data?.newBlockId) {
            setActiveBlockId(fetcher.data.newBlockId);
            setRightView('categories');
        }
    }, [fetcher.data]);

    // Live preview for selected template
    useEffect(() => {
        if (!selectedTemplateId) return;
        setPreviewLoading(true);
        clearTimeout(previewTimerRef.current);
        previewTimerRef.current = setTimeout(async () => {
            try {
                const form = new FormData();
                form.append("sectionId", selectedTemplateId);
                form.append("settings", JSON.stringify(settings));
                const res = await fetch('/app/api/template-preview', { method: 'POST', body: form });
                if (res.ok) {
                    const data = await res.json();
                    if (data.html) setPreviewHtml(data.html);
                }
            } catch (e) { } finally { setPreviewLoading(false); }
        }, 350);
    }, [selectedTemplateId, settings]);

    // Fetch schema when a template is selected
    useEffect(() => {
        if (!selectedTemplateId) return;
        const meta = SECTION_FILES[selectedTemplateId];
        if (!meta) return;
        // Fetch the liquid content via a quick POST to our preview (it returns schema embedded in html response header — not ideal, but we can use another server route)
        // For now, use a side-channel fetch to get schema
        fetch(`/app/api/section-schema?id=${selectedTemplateId}`)
            .then(r => r.json())
            .then(data => {
                if (data.settings) {
                    setTemplateSchema({ settings: data.settings, name: data.name || selectedTemplateId });
                    const defaults = {};
                    data.settings.forEach(s => { if (s.default !== undefined) defaults[s.id] = s.default; });
                    setSettings(defaults);
                }
            }).catch(() => { });
    }, [selectedTemplateId]);

    const handleSelectCategory = (catId) => {
        setActiveCategoryId(catId);
        setSelectedTemplateId(null);
        setSettings({});
        setPreviewHtml('');
        setRightView('templates');
    };

    const handleSelectTemplate = (id) => {
        setSelectedTemplateId(id);
        setRightView('settings');
    };

    const handleInject = () => {
        if (!selectedTemplateId) return;
        const form = new FormData();
        form.append("intent", "inject_section");
        form.append("sectionId", selectedTemplateId);
        form.append("settings", JSON.stringify(settings));
        form.append("placement", placement);
        fetcher.submit(form, { method: "post" });
        setSelectedTemplateId(null);
        setRightView('categories');
        setPreviewHtml('');
    };

    const handleRemove = (blockId) => {
        const form = new FormData();
        form.append("intent", "remove_section");
        form.append("blockId", blockId);
        fetcher.submit(form, { method: "post" });
        if (activeBlockId === blockId) setActiveBlockId(null);
    };

    const handleSaveLive = () => {
        if (!activeBlockId) return;
        const block = pageBlocks.find(b => b.id === activeBlockId);
        if (!block) return;
        const form = new FormData();
        form.append("intent", "update_settings");
        form.append("blockId", activeBlockId);
        form.append("settings", JSON.stringify(settings));
        fetcher.submit(form, { method: "post" });
    };

    const cfCats = categories || [];
    const templateIds = activeCategoryId
        ? Object.entries(SECTION_FILES).filter(([_, m]) => m.category === activeCategoryId).map(([id]) => id)
        : [];

    const isBusy = fetcher.state !== 'idle';

    return (
        <div style={S.root}>
            <style>{CSS}</style>

            {/* ── TOPBAR ── */}
            <header style={S.topbar}>
                <div style={S.topbarLeft}>
                    <button className="te-icon-btn" onClick={() => navigate('/app')} title="Back to Dashboard">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    </button>
                    <div style={S.topbarLogo}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" /></svg>
                        <span style={S.topbarTitle}>Theme Editor</span>
                    </div>
                    <div style={S.topbarBadge}>Homepage</div>
                </div>

                <div style={S.topbarCenter}>
                    <div style={S.deviceToggle}>
                        {[['desktop', '🖥'], ['mobile', '📱']].map(([d, icon]) => (
                            <button key={d} className={`te-dev-btn${device === d ? ' active' : ''}`} onClick={() => setDevice(d)}>{icon}</button>
                        ))}
                    </div>
                </div>

                <div style={S.topbarRight}>
                    {toast && (
                        <span style={{ ...S.toastBadge, background: toast.ok ? '#d1fae5' : '#fee2e2', color: toast.ok ? '#065f46' : '#991b1b' }}>
                            {toast.ok ? '✓' : '✗'} {toast.msg}
                        </span>
                    )}
                    {isBusy && <span style={S.savingDot}>Saving…</span>}
                    <a href={`https://${shop}`} target="_blank" rel="noreferrer" className="te-outline-btn">View Store ↗</a>
                </div>
            </header>

            {/* ── BODY ── */}
            <div style={S.body}>
                {/* ── LEFT: PAGE OUTLINE ── */}
                <aside style={S.leftPanel}>
                    <div style={S.panelHeader}>
                        <span style={S.panelTitle}>Page Sections</span>
                        <span style={S.panelCount}>{pageBlocks.length}</span>
                    </div>

                    <div style={S.outlineList}>
                        {pageBlocks.length === 0 && (
                            <p style={S.emptyHint}>No sections yet. Add your first section →</p>
                        )}
                        {pageBlocks.map((block, i) => {
                            const isActive = block.id === activeBlockId;
                            const label = block.isCf ? (SECTION_FILES[block.type]?.name || block.type) : block.type;
                            return (
                                <div
                                    key={block.id}
                                    className={`te-block-row${isActive ? ' active' : ''}`}
                                    onClick={() => { setActiveBlockId(block.id); setRightView('categories'); }}
                                >
                                    <div style={S.blockRowLeft}>
                                        <span style={S.dragHandle}>⠿</span>
                                        {block.isCf && <span style={S.cfBadge}>CF</span>}
                                        <span style={S.blockLabel}>{label}</span>
                                    </div>
                                    {block.isCf && (
                                        <button
                                            className="te-del-btn"
                                            onClick={(e) => { e.stopPropagation(); handleRemove(block.id); }}
                                            title="Remove section"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={S.addSectionArea}>
                        <button
                            className="te-add-btn"
                            onClick={() => { setActiveBlockId(null); setRightView('categories'); setSelectedTemplateId(null); setPreviewHtml(''); }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            Add Section
                        </button>
                    </div>
                </aside>

                {/* ── CENTER: PREVIEW ── */}
                <main style={S.canvas}>
                    <div style={{
                        ...S.previewFrame,
                        width: device === 'mobile' ? '390px' : '100%',
                        maxWidth: device === 'mobile' ? '390px' : '100%',
                    }}>
                        {!selectedTemplateId && !previewHtml && (
                            <div style={S.previewPlaceholder}>
                                <div style={S.previewPlaceholderIcon}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" /></svg>
                                </div>
                                <p style={S.previewPlaceholderText}>Select a template from the right panel to preview it here.</p>
                            </div>
                        )}
                        {previewLoading && (
                            <div style={S.previewOverlay}>
                                <div className="te-spinner" />
                            </div>
                        )}
                        {previewHtml && (
                            <iframe
                                srcDoc={previewHtml}
                                style={{ ...S.previewIframe, opacity: previewLoading ? 0 : 1 }}
                                sandbox="allow-scripts allow-same-origin"
                                title="Section Preview"
                            />
                        )}
                    </div>
                </main>

                {/* ── RIGHT: TEMPLATE GALLERY / SETTINGS ── */}
                <aside style={S.rightPanel}>
                    {/* Category picker */}
                    {rightView === 'categories' && (
                        <div style={S.rightInner}>
                            <div style={S.panelHeader}>
                                <span style={S.panelTitle}>Add a Section</span>
                            </div>
                            <p style={S.rightHint}>Choose a section type to browse templates</p>
                            <div style={S.catGrid}>
                                {cfCats.map(cat => (
                                    <button key={cat.id} className="te-cat-card" onClick={() => handleSelectCategory(cat.id)}>
                                        <span style={S.catIcon}>{CAT_ICONS[cat.id] || '◻'}</span>
                                        <span style={S.catName}>{cat.name}</span>
                                        <span style={S.catCount}>{cat.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Template gallery */}
                    {rightView === 'templates' && (
                        <div style={S.rightInner}>
                            <div style={S.panelHeader}>
                                <button className="te-icon-btn" onClick={() => setRightView('categories')}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                                </button>
                                <span style={S.panelTitle}>{cfCats.find(c => c.id === activeCategoryId)?.name || 'Templates'}</span>
                            </div>
                            <div style={S.templateList}>
                                {templateIds.map(id => {
                                    const meta = SECTION_FILES[id];
                                    const isSelected = selectedTemplateId === id;
                                    return (
                                        <button
                                            key={id}
                                            className={`te-tmpl-card${isSelected ? ' selected' : ''}`}
                                            onClick={() => handleSelectTemplate(id)}
                                        >
                                            <div style={S.tmplThumb}>
                                                <span style={S.tmplThumbIcon}>{TEMPLATE_ICONS[id] || '◻'}</span>
                                            </div>
                                            <div style={S.tmplInfo}>
                                                <span style={S.tmplName}>{meta?.name || id}</span>
                                                <span style={S.tmplHint}>Click to preview</span>
                                            </div>
                                            {isSelected && <span style={S.tmplCheckmark}>✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Settings panel */}
                    {rightView === 'settings' && selectedTemplateId && (
                        <div style={S.rightInner}>
                            <div style={S.panelHeader}>
                                <button className="te-icon-btn" onClick={() => setRightView('templates')}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                                </button>
                                <span style={S.panelTitle}>{SECTION_FILES[selectedTemplateId]?.name || selectedTemplateId}</span>
                            </div>

                            {/* Placement */}
                            <div style={S.settingBlock}>
                                <label style={S.settingLabel}>Inject Position</label>
                                <div style={S.placementRow}>
                                    {[['top', 'Below Header'], ['bottom', 'Above Footer']].map(([v, label]) => (
                                        <button key={v} className={`te-place-btn${placement === v ? ' active' : ''}`} onClick={() => setPlacement(v)}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={S.settingsDivider} />

                            {/* Settings */}
                            {templateSchema.settings.length === 0 ? (
                                <p style={S.emptyHint}>Loading settings…</p>
                            ) : (
                                <div style={S.settingsList}>
                                    {templateSchema.settings.map(s => (
                                        <SettingRow key={s.id} setting={s} value={settings[s.id]} onChange={(id, val) => setSettings(prev => ({ ...prev, [id]: val }))} />
                                    ))}
                                </div>
                            )}

                            <div style={S.injectActions}>
                                <button className="te-inject-btn" onClick={handleInject} disabled={isBusy}>
                                    {isBusy ? '⏳ Injecting…' : '🚀 Inject to Theme'}
                                </button>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

// ─── SETTING ROW ─────────────────────────────────────────────────────────────
function SettingRow({ setting, value, onChange }) {
    const v = value !== undefined ? value : (setting.default ?? '');
    return (
        <div style={S.settingBlock}>
            <label style={S.settingLabel}>{setting.label || setting.id}</label>
            {setting.type === 'color' && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={v || '#000000'} onChange={e => onChange(setting.id, e.target.value)} style={S.colorSwatch} />
                    <code style={S.colorCode}>{v || '#000000'}</code>
                </div>
            )}
            {(setting.type === 'text' || setting.type === 'textarea' || setting.type === 'color_background') && (
                <input type="text" className="te-input" value={v} placeholder={setting.placeholder || ''} onChange={e => onChange(setting.id, e.target.value)} />
            )}
            {setting.type === 'range' && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input type="range" min={setting.min} max={setting.max} step={setting.step || 1} value={v} onChange={e => onChange(setting.id, Number(e.target.value))} style={{ flex: 1, accentColor: '#111' }} />
                    <span style={S.rangeVal}>{v}{setting.unit || ''}</span>
                </div>
            )}
            {setting.type === 'checkbox' && (
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={Boolean(v)} onChange={e => onChange(setting.id, e.target.checked)} style={{ accentColor: '#111', width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, color: '#555' }}>Enabled</span>
                </label>
            )}
            {setting.type === 'select' && (
                <select className="te-select" value={v} onChange={e => onChange(setting.id, e.target.value)}>
                    {(setting.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            )}
        </div>
    );
}

// ─── CATEGORY / TEMPLATE ICONS ────────────────────────────────────────────────
const CAT_ICONS = {
    header: '◻',
    announcement: '📢',
    hero: '🖼',
    product: '🛍',
    collection: '🗂',
    testimonial: '💬',
    brand: '🏆',
    content: '📝',
    newsletter: '✉',
    social: '📸',
    video: '▶',
    faq: '❓',
    banner: '⚡',
    footer: '◼',
};

const TEMPLATE_ICONS = {
    'cf-header-premium': '🔷',
    'cf-header-advanced': '🌈',
    'cf-announce-01': '🎉',
    'cf-announce-02': '⬛',
    'cf-announce-03': '⏱',
    'cf-announce-04': '💎',
    'cf-announce-05': '🌟',
    'cf-announce-06': '😎',
    'cf-announce-07': '🎯',
    'cf-announce-08': '🌊',
    'cf-announce-09': '📣',
    'cf-announce-10': '🎁',
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
    root: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f4f4f5', fontFamily: '"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
    topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 52, background: '#0f0f0f', borderBottom: '1px solid #222', flexShrink: 0, zIndex: 10 },
    topbarLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    topbarLogo: { display: 'flex', alignItems: 'center', gap: 8 },
    topbarTitle: { fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' },
    topbarBadge: { background: '#1f1f1f', border: '1px solid #333', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#aaa', fontWeight: 600 },
    topbarCenter: { display: 'flex', alignItems: 'center', gap: 12 },
    topbarRight: { display: 'flex', alignItems: 'center', gap: 10 },
    deviceToggle: { display: 'flex', background: '#1a1a1a', borderRadius: 6, border: '1px solid #2a2a2a', overflow: 'hidden' },
    savingDot: { fontSize: 12, color: '#888' },
    toastBadge: { fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 5 },

    body: { display: 'flex', flex: 1, overflow: 'hidden' },

    leftPanel: { width: 240, flexShrink: 0, background: '#fff', borderRight: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    panelHeader: { display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 10px', borderBottom: '1px solid #f0f0f0' },
    panelTitle: { fontSize: 13, fontWeight: 700, color: '#111', flex: 1, letterSpacing: '-0.01em' },
    panelCount: { fontSize: 11, fontWeight: 700, color: '#888', background: '#f4f4f5', borderRadius: 10, padding: '1px 7px' },
    outlineList: { flex: 1, overflowY: 'auto', padding: '8px 0' },
    emptyHint: { fontSize: 12, color: '#aaa', textAlign: 'center', padding: '24px 16px', lineHeight: 1.5 },
    blockRowLeft: { display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 },
    dragHandle: { fontSize: 12, color: '#ccc', cursor: 'grab', flexShrink: 0 },
    cfBadge: { fontSize: 9, fontWeight: 800, color: '#6366f1', background: '#eef2ff', borderRadius: 3, padding: '1px 4px', flexShrink: 0 },
    blockLabel: { fontSize: 13, color: '#333', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    addSectionArea: { padding: '12px 16px', borderTop: '1px solid #f0f0f0' },

    canvas: { flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'auto', background: '#ebebeb', padding: '24px', paddingTop: 24 },
    previewFrame: { background: '#fff', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', overflow: 'hidden', transition: 'width 0.3s ease', minHeight: 500, position: 'relative' },
    previewPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 12 },
    previewPlaceholderIcon: { opacity: 0.3 },
    previewPlaceholderText: { fontSize: 13, color: '#aaa', textAlign: 'center', maxWidth: 200, lineHeight: 1.5 },
    previewOverlay: { position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
    previewIframe: { width: '100%', minHeight: 500, border: 'none', display: 'block', transition: 'opacity 0.2s' },

    rightPanel: { width: 300, flexShrink: 0, background: '#fff', borderLeft: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    rightInner: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
    rightHint: { fontSize: 12, color: '#aaa', padding: '0 16px 10px', margin: 0 },
    catGrid: { padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', flex: 1 },
    catIcon: { fontSize: 16, width: 24, textAlign: 'center' },
    catName: { fontSize: 13, fontWeight: 600, color: '#111', flex: 1 },
    catCount: { fontSize: 11, color: '#aaa', fontWeight: 700 },

    templateList: { flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 },
    tmplThumb: { width: 44, height: 36, background: '#f7f7f7', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #eee' },
    tmplThumbIcon: { fontSize: 18 },
    tmplInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
    tmplName: { fontSize: 13, fontWeight: 600, color: '#111' },
    tmplHint: { fontSize: 11, color: '#aaa' },
    tmplCheckmark: { fontSize: 14, color: '#111', fontWeight: 900, flexShrink: 0 },

    settingsList: { flex: 1, overflowY: 'auto', padding: '0 16px 8px' },
    settingsDivider: { height: 1, background: '#f0f0f0', margin: '8px 0' },
    settingBlock: { padding: '10px 16px 0' },
    settingLabel: { display: 'block', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 },
    colorSwatch: { width: 32, height: 28, padding: '2px', border: '1px solid #e0e0e0', borderRadius: 5, cursor: 'pointer' },
    colorCode: { fontSize: 12, color: '#555', background: '#f7f7f7', padding: '3px 7px', borderRadius: 4 },
    rangeVal: { fontSize: 12, fontWeight: 700, color: '#333', minWidth: 32, textAlign: 'right' },
    placementRow: { display: 'flex', gap: 6 },
    injectActions: { padding: '12px 16px 16px', borderTop: '1px solid #f0f0f0', marginTop: 'auto' },
};

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', sans-serif; }

.te-icon-btn {
  width: 30px; height: 30px; border-radius: 6px; border: 1px solid #2a2a2a;
  background: transparent; display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; color: #aaa; transition: all 0.15s;
}
.te-icon-btn:hover { background: #1a1a1a; color: #fff; }

.te-dev-btn {
  padding: 5px 10px; border: none; background: transparent; cursor: pointer;
  font-size: 13px; color: #666; transition: all 0.15s;
}
.te-dev-btn.active { background: #333; color: #fff; }
.te-dev-btn:first-child { border-radius: 5px 0 0 5px; }
.te-dev-btn:last-child { border-radius: 0 5px 5px 0; }

.te-outline-btn {
  padding: 6px 14px; border: 1px solid #333; border-radius: 6px; background: transparent;
  font-size: 12px; font-weight: 600; color: #fff; text-decoration: none;
  transition: all 0.15s; cursor: pointer;
}
.te-outline-btn:hover { background: #1a1a1a; }

.te-block-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px; cursor: pointer; transition: background 0.12s;
  border-left: 3px solid transparent;
}
.te-block-row:hover { background: #f9f9f9; }
.te-block-row.active { background: #f4f4ff; border-left-color: #6366f1; }

.te-del-btn {
  width: 22px; height: 22px; border-radius: 4px; border: none;
  background: transparent; display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #ccc; opacity: 0; transition: all 0.15s;
}
.te-block-row:hover .te-del-btn { opacity: 1; }
.te-del-btn:hover { background: #fee2e2; color: #dc2626; }

.te-add-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px; border: 1.5px dashed #d4d4d4; border-radius: 7px; background: transparent;
  font-size: 12px; font-weight: 700; color: #888; cursor: pointer; 
  transition: all 0.15s; letter-spacing: 0.01em;
}
.te-add-btn:hover { border-color: #6366f1; color: #6366f1; background: #f4f4ff; }

.te-cat-card {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border: 1px solid #efefef; border-radius: 8px; background: #fff;
  cursor: pointer; transition: all 0.15s; text-align: left;
  width: 100%;
}
.te-cat-card:hover { border-color: #111; background: #fafafa; }

.te-tmpl-card {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px;
  border: 1.5px solid #efefef; border-radius: 8px; background: #fff;
  cursor: pointer; transition: all 0.15s; text-align: left; width: 100%;
}
.te-tmpl-card:hover { border-color: #aaa; }
.te-tmpl-card.selected { border-color: #111; box-shadow: 0 0 0 2px rgba(0,0,0,0.06); }

.te-place-btn {
  flex: 1; padding: 7px 10px; border: 1.5px solid #e5e5e5; border-radius: 6px;
  background: #fff; font-size: 12px; font-weight: 600; cursor: pointer; 
  color: #555; transition: all 0.15s;
}
.te-place-btn.active { border-color: #111; background: #111; color: #fff; }

.te-input, .te-select {
  width: 100%; border: 1.5px solid #e5e5e5; border-radius: 6px;
  padding: 7px 10px; font-size: 13px; font-family: inherit;
  background: #fafafa; transition: border 0.15s; outline: none;
}
.te-input:focus, .te-select:focus { border-color: #111; background: #fff; }

.te-inject-btn {
  width: 100%; padding: 12px; border: none; border-radius: 8px;
  background: #111; color: #fff; font-size: 14px; font-weight: 700;
  cursor: pointer; letter-spacing: -0.01em; transition: all 0.15s;
}
.te-inject-btn:hover { background: #333; transform: translateY(-1px); }
.te-inject-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.te-spinner {
  width: 22px; height: 22px; border: 2.5px solid #e5e5e5;
  border-top-color: #111; border-radius: 50%;
  animation: te-spin 0.6s linear infinite;
}
@keyframes te-spin { to { transform: rotate(360deg); } }
`;
