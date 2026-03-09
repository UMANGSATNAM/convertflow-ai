import { json } from "@remix-run/node";
import { Home, ShoppingCart, Package, Palette, Store, Monitor, Smartphone, Layout, Megaphone, Image as ImageIcon, ShoppingBag, Grid, MessageSquare, Award, Type, Mail, Camera, Play, HelpCircle, Zap } from "lucide-react";
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

    // UI State: 'outline' | 'categories' | 'templates' | 'settings'
    const [leftView, setLeftView] = useState('outline');

    // Active selections
    const [activeBlockId, setActiveBlockId] = useState(null);       // When editing an existing injected block
    const [activeCategoryId, setActiveCategoryId] = useState(null); // When browsing to add
    const [selectedTemplateId, setSelectedTemplateId] = useState(null); // The raw template being previewed before inject

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
        if (fetcher.data?.pageBlocks) setPageBlocks(fetcher.data.pageBlocks);
        if (fetcher.data?.message) {
            setToast({ msg: fetcher.data.message, ok: fetcher.data.ok });
            setTimeout(() => setToast(null), 3000);
        }
        if (fetcher.data?.newBlockId) {
            setActiveBlockId(fetcher.data.newBlockId);
            setLeftView('outline');
        }
    }, [fetcher.data]);

    // Live preview for selected template (unsaved) or active block (saved theme element)
    useEffect(() => {
        const targetId = activeBlockId ? pageBlocks.find(b => b.id === activeBlockId)?.type : selectedTemplateId;
        if (!targetId) return;

        setPreviewLoading(true);
        clearTimeout(previewTimerRef.current);
        previewTimerRef.current = setTimeout(async () => {
            try {
                const form = new FormData();
                form.append("sectionId", targetId);
                if (activeBlockId) form.append("blockId", activeBlockId);
                form.append("settings", JSON.stringify(settings));
                const res = await fetch('/app/api/template-preview', { method: 'POST', body: form });
                if (res.ok) {
                    const data = await res.json();
                    if (data.html) setPreviewHtml(data.html);
                }
            } catch (e) { } finally { setPreviewLoading(false); }
        }, 350);
    }, [selectedTemplateId, activeBlockId, settings, pageBlocks]);

    // Fetch schema when a template OR block is selected
    useEffect(() => {
        const targetId = activeBlockId ? pageBlocks.find(b => b.id === activeBlockId)?.type : selectedTemplateId;
        if (!targetId) return;

        fetch(`/app/api/section-schema?id=${targetId}`)
            .then(r => r.json())
            .then(data => {
                if (data.settings) {
                    setTemplateSchema({ settings: data.settings, name: data.name || targetId });

                    if (activeBlockId) {
                        // Editing existing: load saved settings, fallback to defaults
                        const savedSettings = pageBlocks.find(b => b.id === activeBlockId)?.settings || {};
                        const merged = {};
                        data.settings.forEach(s => { merged[s.id] = savedSettings[s.id] !== undefined ? savedSettings[s.id] : s.default; });
                        setSettings(merged);
                    } else {
                        // Adding new: load defaults
                        const defaults = {};
                        data.settings.forEach(s => { if (s.default !== undefined) defaults[s.id] = s.default; });
                        setSettings(defaults);
                    }
                }
            }).catch(() => { });
    }, [selectedTemplateId, activeBlockId, pageBlocks]);

    const handleSelectCategory = (catId) => {
        setActiveCategoryId(catId);
        setLeftView('templates');
    };

    const handleSelectTemplate = (id) => {
        setSelectedTemplateId(id);
        setLeftView('settings');
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
        setPreviewHtml('');
    };

    const handleRemove = (blockId) => {
        const form = new FormData();
        form.append("intent", "remove_section");
        form.append("blockId", blockId);
        fetcher.submit(form, { method: "post" });
        if (activeBlockId === blockId) {
            setActiveBlockId(null);
            setSettings({});
            setLeftView('outline');
        }
    };

    const handleSaveLive = () => {
        if (!activeBlockId) return;
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

            {/* ── TOP NAV BAR (Reverted to Shopify App Nav standard) ── */}
            <header style={S.topbar}>
                <div style={S.topbarLeft}>
                    <button className="te-back-btn" onClick={() => navigate('/app')} title="Exit Editor">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    </button>
                    <span style={S.topbarPageName}>Home page</span>
                </div>

                <div style={S.topbarCenter}>
                    <div style={S.deviceToggle}>
                        <button className={"te-dev-btn" + (device === 'desktop' ? ' active' : '')} onClick={() => setDevice('desktop')}><Monitor size={16} strokeWidth={2.5} /></button>
                        <button className={"te-dev-btn" + (device === 'mobile' ? ' active' : '')} onClick={() => setDevice('mobile')}><Smartphone size={16} strokeWidth={2.5} /></button>
                    </div>
                </div>

                <div style={S.topbarRight}>
                    {toast && (
                        <span style={{ ...S.toastBadge, background: toast.ok ? '#d1fae5' : '#fee2e2', color: toast.ok ? '#065f46' : '#991b1b' }}>
                            {toast.msg}
                        </span>
                    )}
                    {isBusy && <span style={S.savingDot}>Saving...</span>}
                    <button
                        className="te-save-btn"
                        onClick={activeBlockId ? handleSaveLive : handleInject}
                        disabled={isBusy || (!activeBlockId && !selectedTemplateId)}
                    >
                        Save
                    </button>
                </div>
            </header>

            <div style={S.workspace}>
                {/* ── LEFT SIDEBAR (Outline/Templates) ── */}
                <aside style={S.leftSidebar}>
                    {/* STATE 0: OUTLINE */}
                    {leftView === 'outline' && (
                        <div style={S.panelInner}>
                            <div style={S.panelHeader}>
                                <span style={S.panelTitle}>Sections</span>
                            </div>

                            <div style={S.outlineList}>
                                {pageBlocks.length === 0 && (
                                    <p style={S.emptyHint}>No sections yet.</p>
                                )}
                                {pageBlocks.map((block) => {
                                    const isActive = block.id === activeBlockId;
                                    const label = block.isCf ? (SECTION_FILES[block.type]?.name || block.type) : block.type;
                                    return (
                                        <div
                                            key={block.id}
                                            className={"te-block-row" + (isActive ? ' active' : '')}
                                            onClick={() => {
                                                if (block.isCf) {
                                                    setActiveBlockId(block.id);
                                                    setSelectedTemplateId(null);
                                                }
                                            }}
                                        >
                                            <div style={S.blockRowLeft}>
                                                <span style={S.dragHandle}>
                                                    <Grid size={13} strokeWidth={2.5}/>
                                                </span>
                                                <span style={S.blockIcon}>
                                                    {block.isCf ? <Palette size={14} /> : <Layout size={14} />}
                                                </span>
                                                <span style={S.blockLabel}>{label}</span>
                                            </div>
                                            {block.isCf && (
                                                <button
                                                    className="te-del-btn"
                                                    onClick={(e) => { e.stopPropagation(); handleRemove(block.id); }}
                                                    title="Remove section"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={S.addSectionArea}>
                                <button className="te-text-btn" onClick={() => setLeftView('categories')}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                    Add section
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STATE 1: CATEGORIES */}
                    {leftView === 'categories' && (
                        <div style={S.panelInner}>
                            <div style={S.panelHeader}>
                                <button className="te-icon-back" onClick={() => setLeftView('outline')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                                </button>
                                <span style={S.panelTitle}>Add section</span>
                            </div>
                            <div style={S.scrollArea}>
                                {cfCats.map(cat => (
                                    <button key={cat.id} className="te-list-item" onClick={() => handleSelectCategory(cat.id)}>
                                        <span style={S.listIcon}>{CAT_SVG[cat.id] || CAT_SVG.default}</span>
                                        <span style={S.listText}>{cat.name}</span>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" style={{ marginLeft: 'auto' }}><polyline points="9 18 15 12 9 6" /></svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STATE 2: TEMPLATES */}
                    {leftView === 'templates' && (
                        <div style={S.panelInner}>
                            <div style={S.panelHeader}>
                                <button className="te-icon-back" onClick={() => setLeftView('categories')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                                </button>
                                <span style={S.panelTitle}>{cfCats.find(c => c.id === activeCategoryId)?.name || 'Templates'}</span>
                            </div>
                            <div style={S.scrollArea}>
                                {templateIds.map(id => {
                                    const meta = SECTION_FILES[id];
                                    return (
                                        <button key={id} className="te-list-item" onClick={() => handleSelectTemplate(id)}>
                                            <span style={S.listIcon}>{CAT_SVG.default}</span>
                                            <span style={S.listText}>{meta?.name || id}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </aside>

                {/* ── CENTER CANVAS (Persistent Full Preview) ── */}
                <main style={S.canvas}>
                    <div style={{
                        ...S.previewFrame,
                        width: device === 'mobile' ? '400px' : '100%',
                        maxWidth: device === 'mobile' ? '400px' : '100%',
                    }}>
                        {!previewHtml && !activeBlockId && !selectedTemplateId && (
                             <div style={S.previewPlaceholder}>
                                 <div className="te-spinner" />
                                 <p style={{marginTop: 12, color: '#6d7175', fontSize: 13}}>Loading original theme...</p>
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
                                style={{ ...S.previewIframe, opacity: previewLoading ? 0.5 : 1 }}
                                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                title="Live Preview"
                            />
                        )}
                    </div>
                </main>

                {/* ── RIGHT SETTINGS PANEL (Conditional) ── */}
                {(selectedTemplateId || activeBlockId) && (
                    <aside style={S.rightSidebar}>
                        <div style={S.panelInner}>
                            <div style={S.panelHeader}>
                                <button className="te-icon-back" onClick={() => {
                                    if (activeBlockId) {
                                        setActiveBlockId(null);
                                        setSettings({});
                                    } else {
                                        setSelectedTemplateId(null);
                                        setSettings({});
                                    }
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                                </button>
                                <span style={S.panelTitle}>
                                    {templateSchema.name || (activeBlockId ? 'Edit Section' : 'Customize Section')}
                                </span>
                            </div>

                            <div style={S.settingsScroll}>
                                {!activeBlockId && (
                                    <div style={S.settingBlock}>
                                        <label style={S.settingLabel}>Inject Position</label>
                                        <div style={S.placementRow}>
                                            {[['top', 'Below Header'], ['bottom', 'Above Footer']].map(([v, label]) => (
                                                <button key={v} className={"te-place-btn" + (placement === v ? ' active' : '')} onClick={() => setPlacement(v)}>
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {templateSchema.settings.length === 0 ? (
                                    <div style={{ padding: 20, textAlign: 'center', color: '#888', fontSize: 13 }}>Loading settings...</div>
                                ) : (
                                    <div style={S.settingsList}>
                                        {templateSchema.settings.map(s => (
                                            <SettingRow
                                                key={s.id}
                                                setting={s}
                                                value={settings[s.id]}
                                                onChange={(id, val) => setSettings(prev => ({ ...prev, [id]: val }))}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}

// ─── SETTING ROW ─────────────────────────────────────────────────────────────
function SettingRow({ setting, value, onChange }) {
    const v = value !== undefined ? value : (setting.default ?? '');

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            // For now, in preview mode, we pass the base64 string directly so liquid renders it
            // In a real production sync we'd upload this via Asset API and return the shopify URL, 
            // but base64 works perfectly for the live preview and injection for now.
            onChange(setting.id, reader.result);
        };
        reader.readAsDataURL(file);
    };

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
            {setting.type === 'image_picker' && (
                <div style={S.imageUploadBox}>
                    {v ? (
                        <div style={S.imagePreviewWrapper}>
                            <img src={v} alt="Preview" style={S.imagePreview} />
                            <button className="te-img-del-btn" onClick={() => onChange(setting.id, '')}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                    ) : (
                        <label style={S.imageUploadLabel}>
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                            <span>Upload Image</span>
                        </label>
                    )}
                </div>
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
                    <span style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>Enabled</span>
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

// ─── SVG ICONS (PREMIUM) ──────────────────────────────────────────────────────


const SVG_ICONS = {
    layout: <Layout size={20} strokeWidth={1.5} />,
    announcement: <Megaphone size={20} strokeWidth={1.5} />,
    image: <ImageIcon size={20} strokeWidth={1.5} />,
    shoppingBag: <ShoppingBag size={20} strokeWidth={1.5} />,
    grid: <Grid size={20} strokeWidth={1.5} />,
    message: <MessageSquare size={20} strokeWidth={1.5} />,
    award: <Award size={20} strokeWidth={1.5} />,
    type: <Type size={20} strokeWidth={1.5} />,
    mail: <Mail size={20} strokeWidth={1.5} />,
    camera: <Camera size={20} strokeWidth={1.5} />,
    play: <Play size={20} strokeWidth={1.5} />,
    help: <HelpCircle size={20} strokeWidth={1.5} />,
    zap: <Zap size={20} strokeWidth={1.5} />,
    default: <Layout size={20} strokeWidth={1.5} />
};

const CAT_SVG = {
    header: SVG_ICONS.layout,
    announcement: SVG_ICONS.announcement,
    hero: SVG_ICONS.image,
    product: SVG_ICONS.shoppingBag,
    collection: SVG_ICONS.grid,
    testimonial: SVG_ICONS.message,
    brand: SVG_ICONS.award,
    content: SVG_ICONS.type,
    newsletter: SVG_ICONS.mail,
    social: SVG_ICONS.camera,
    video: SVG_ICONS.play,
    faq: SVG_ICONS.help,
    banner: SVG_ICONS.zap,
    footer: SVG_ICONS.layout,
    default: SVG_ICONS.default
};

const S = {
    root: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f4f6f8', fontFamily: '"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },

    // ── TOP NAV BAR ──
    topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 56, background: '#fff', borderBottom: '1px solid #dfe3e8', flexShrink: 0, zIndex: 10 },
    topbarLeft: { display: 'flex', alignItems: 'center', width: 200, gap: 16 },
    deviceToggle: { display: 'flex', background: '#f4f6f8', borderRadius: 6, padding: 4 },
    topbarCenter: { flex: 1, display: 'flex', justifyContent: 'center' },
    topbarPageName: { fontSize: 14, fontWeight: 600, color: '#202223' },
    topbarRight: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, width: 200 },
    savingDot: { fontSize: 13, color: '#aaa' },
    toastBadge: { fontSize: 13, fontWeight: 600, padding: '6px 12px', borderRadius: 6 },

    workspace: { display: 'flex', flex: 1, overflow: 'hidden' },

    // ── LEFT SIDEBAR (Outline/Templates) ──
    leftSidebar: { width: 320, flexShrink: 0, background: '#fff', borderRight: '1px solid #dfe3e8', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 5 },
    
    // ── RIGHT SIDEBAR (Settings) ──
    rightSidebar: { width: 340, flexShrink: 0, background: '#fff', borderLeft: '1px solid #dfe3e8', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 5 },
    
    // ── SHARED PANEL STYLES ──
    panelInner: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
    panelHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px', borderBottom: '1px solid #f4f6f8', flexShrink: 0 },
    panelTitle: { fontSize: 14, fontWeight: 600, color: '#202223', flex: 1 },
    
    outlineList: { flex: 1, overflowY: 'auto', padding: '16px 12px' },
    emptyHint: { fontSize: 13, color: '#6d7175', textAlign: 'center', padding: '32px 16px' },
    blockRowLeft: { display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
    dragHandle: { color: '#c4cdd5', cursor: 'grab', display: 'flex' },
    blockIcon: { color: '#8c9196', display: 'flex' },
    blockLabel: { fontSize: 13, color: '#202223', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    
    addSectionArea: { padding: '16px', borderTop: '1px solid #dfe3e8', background: '#fff', flexShrink: 0 },

    scrollArea: { flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 },
    listIcon: { width: 20, height: 20, color: '#8c9196', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    listText: { fontSize: 13, color: '#202223', fontWeight: 500 },

    settingsScroll: { flex: 1, overflowY: 'auto' },
    settingsList: { padding: '16px' },
    settingBlock: { marginBottom: 20 },
    settingLabel: { display: 'block', fontSize: 12, fontWeight: 500, color: '#202223', marginBottom: 8 },
    placementRow: { display: 'flex', gap: 8, padding: '0 16px 16px' },
    colorSwatch: { width: 36, height: 36, padding: 0, border: '1px solid #c4cdd5', borderRadius: 6, cursor: 'pointer', overflow: 'hidden' },
    colorCode: { fontSize: 13, color: '#202223', fontFamily: 'monospace', flex: 1, background: '#f4f6f8', padding: '8px 12px', border: '1px solid #c4cdd5', borderRadius: 6 },
    rangeVal: { fontSize: 13, fontWeight: 500, color: '#202223', minWidth: 40, textAlign: 'right' },
    
    imageUploadBox: { border: '1px dashed #c4cdd5', borderRadius: 8, background: '#f9fafb', padding: 8, textAlign: 'center' },
    imageUploadLabel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 0', cursor: 'pointer', color: '#5c5f62', fontSize: 13, fontWeight: 500 },
    imagePreviewWrapper: { position: 'relative', width: '100%', height: 120, borderRadius: 4, overflow: 'hidden', background: '#fff', border: '1px solid #e1e3e5' },
    imagePreview: { width: '100%', height: '100%', objectFit: 'contain' },

    // ── CENTER CANVAS (Persistent) ──
    canvas: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', background: '#f4f6f8' },
    previewFrame: { background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.05)', transition: 'width 0.3s ease', display: 'flex', flexDirection: 'column', flex: 1, width: '100%', position: 'relative' },
    previewPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16 },
    previewOverlay: { position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
    previewIframe: { width: '100%', height: '100%', border: 'none', display: 'block', transition: 'opacity 0.2s', flex: 1 },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', sans-serif; overflow: hidden; }

/* Buttons */
.te-back-btn {
  width: 32px; height: 32px; border-radius: 6px; border: 1px solid #dfe3e8;
  background: #fff; display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; color: #5c5f62; transition: all 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.te-back-btn:hover { background: #f9fafb; border-color: #c4cdd5; color: #202223; }

.te-icon-back {
  width: 32px; height: 32px; border-radius: 6px; border: none;
  background: transparent; display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; color: #5c5f62; transition: all 0.15s; margin-left: -8px;
}
.te-icon-back:hover { background: rgba(0,0,0,0.05); color: #202223; }

.te-dev-btn {
  padding: 6px 12px; border: none; background: transparent; cursor: pointer;
  font-size: 14px; color: #8c9196; transition: all 0.1s; border-radius: 4px;
}
.te-dev-btn.active { background: #fff; color: #202223; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

.te-save-btn {
  padding: 8px 16px; border-radius: 6px; border: none;
  background: #008060; color: #fff; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: background 0.15s; box-shadow: 0 1px 0 rgba(0,0,0,0.1);
}
.te-save-btn:hover:not(:disabled) { background: #006e52; }
.te-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.te-text-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px; border: 1px solid #dfe3e8; border-radius: 6px; background: #fff;
  font-size: 13px; font-weight: 600; color: #202223; cursor: pointer; 
  transition: all 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.te-text-btn:hover { background: #f9fafb; border-color: #c4cdd5; }

/* Lists & Rows */
.te-block-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; cursor: pointer; transition: background 0.12s;
  border-radius: 6px; margin-bottom: 2px;
}
.te-block-row:hover { background: #f4f6f8; }
.te-block-row.active { background: #eef2ff; color: #2c6ecb; }
.te-block-row.active .te-del-btn { opacity: 1; }

.te-del-btn {
  width: 28px; height: 28px; border-radius: 6px; border: none;
  background: transparent; display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #8c9196; opacity: 0; transition: all 0.1s;
}
.te-block-row:hover .te-del-btn { opacity: 1; }
.te-del-btn:hover { background: #fee2e2; color: #d82c0d; }

.te-list-item {
  display: flex; align-items: center; gap: 12px; padding: 12px;
  border: 1px solid transparent; border-radius: 6px; background: transparent;
  cursor: pointer; transition: all 0.1s; text-align: left; width: 100%;
}
.te-list-item:hover { background: #f4f6f8; }

.te-place-btn {
  flex: 1; padding: 10px; border: 1px solid #c4cdd5; border-radius: 6px;
  background: #fff; font-size: 13px; font-weight: 500; cursor: pointer; 
  color: #5c5f62; transition: all 0.15s;
}
.te-place-btn.active { border-color: #2c6ecb; background: #eef2ff; color: #2c6ecb; font-weight: 600; }

.te-input, .te-select {
  width: 100%; border: 1px solid #c4cdd5; border-radius: 6px;
  padding: 8px 12px; font-size: 13px; font-family: inherit; color: #202223;
  background: #fff; transition: border 0.15s; outline: none; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
}
.te-input:focus, .te-select:focus { border-color: #2c6ecb; box-shadow: 0 0 0 1px #2c6ecb; }

.te-img-del-btn {
  position: absolute; top: 6px; right: 6px; width: 24px; height: 24px;
  background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.te-img-del-btn:hover { background: #d82c0d; }

.te-spinner {
  width: 24px; height: 24px; border: 2px solid #dfe3e8;
  border-top-color: #2c6ecb; border-radius: 50%;
  animation: te-spin 0.6s linear infinite;
}
@keyframes te-spin { to { transform: rotate(360deg); } }
`;
