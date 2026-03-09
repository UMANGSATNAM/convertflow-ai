import { json } from "@remix-run/node";
import { Home, ShoppingCart, Package, Palette, Store, Monitor, Smartphone, Layout, Megaphone, Image as ImageIcon, ShoppingBag, Grid, MessageSquare, Award, Type, Mail, Camera, Play, HelpCircle, Zap, ChevronRight, X, Check, Search, Settings2, Undo, Redo, Eye, ExternalLink, Plus, Sparkles, User, MoreHorizontal, FileText, Move, MousePointer2, Blocks, ArrowUp, ArrowDown } from "lucide-react";
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
            return json({ ok: true, message: "Sections reordered successfully!" });
        }

        return json({ ok: false, error: "Unknown intent" });
    } catch (e) {
        console.error("Theme Editor Action Error:", e);
        try {
            const fs = require('fs');
            fs.appendFileSync(process.cwd() + '/error.log', new Date().toISOString() + ' : ' + e.message + '\n');
        } catch (err) { }
        return json({ ok: false, error: e.message });
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
    const [utilTab, setUtilTab] = useState('outline');

    // Sync page blocks from action response
    useEffect(() => {
        if (!fetcher.data) return;
        if (fetcher.data.pageBlocks) {
            setPageBlocks(fetcher.data.pageBlocks);
        }
        if (fetcher.data.ok && fetcher.data.message) {
            setToast({ msg: fetcher.data.message, ok: true });
            setTimeout(() => setToast(null), 4000);
        }
        if (fetcher.data.error) {
            setToast({ msg: '❌ ' + fetcher.data.error, ok: false });
            setTimeout(() => setToast(null), 10000);
            // Nuclear fallback so user ALWAYS sees the error
            setTimeout(() => window.alert('Error: ' + fetcher.data.error), 100);
        }
        if (fetcher.data.newBlockId) {
            setActiveBlockId(fetcher.data.newBlockId);
            setSelectedTemplateId(null);
            setLeftView('outline');
        }
    }, [fetcher.data]);

    // Live preview for full page with live settings
    useEffect(() => {
        setPreviewLoading(true);
        clearTimeout(previewTimerRef.current);
        previewTimerRef.current = setTimeout(async () => {
            try {
                // 1. Clone page blocks
                let blocksToSend = [...pageBlocks];

                // 2. If editing an existing block, apply the live active settings
                if (activeBlockId) {
                    const idx = blocksToSend.findIndex(b => b.id === activeBlockId);
                    if (idx !== -1) {
                        blocksToSend[idx] = { ...blocksToSend[idx], settings: { ...settings } };
                    }
                }

                // 3. If previewing an un-injected template, temporarily insert it
                if (selectedTemplateId && !activeBlockId) {
                    const tempBlock = { id: 'preview-insert', type: selectedTemplateId, settings: { ...settings } };
                    if (placement === 'top') {
                        const hi = blocksToSend.findIndex(b => b.type.includes('header') || b.id.includes('header'));
                        hi !== -1 ? blocksToSend.splice(hi + 1, 0, tempBlock) : blocksToSend.unshift(tempBlock);
                    } else {
                        const fi = blocksToSend.findIndex(b => b.type.includes('footer') || b.id.includes('footer'));
                        fi !== -1 ? blocksToSend.splice(fi, 0, tempBlock) : blocksToSend.push(tempBlock);
                    }
                }

                const form = new FormData();
                form.append("blocks", JSON.stringify(blocksToSend));
                if (activeBlockId) form.append("activeBlockId", activeBlockId);
                else if (selectedTemplateId) form.append("activeBlockId", "preview-insert");

                const res = await fetch('/app/api/template-preview', { method: 'POST', body: form });
                if (res.ok) {
                    const data = await res.json();
                    if (data.html) setPreviewHtml(data.html);
                }
            } catch (e) { } finally { setPreviewLoading(false); }
        }, 200);
    }, [selectedTemplateId, activeBlockId, settings, pageBlocks, placement]);

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
        const meta = SECTION_FILES[id];
        if (meta && (meta.category === 'header' || meta.category === 'hero')) {
            setPlacement('top');
        } else {
            setPlacement('bottom');
        }
        setSelectedTemplateId(id);
        setLeftView('outline');
    };

    const handleInject = () => {
        if (!selectedTemplateId) return;

        // Optimistic UI: immediately add the block so user sees it
        const tempId = `cf_${selectedTemplateId}_${Date.now().toString(36)}`;
        const newBlock = {
            id: tempId,
            type: selectedTemplateId,
            settings: { ...settings },
            isCf: true,
        };
        setPageBlocks(prev => {
            const blocks = [...prev];
            if (placement === 'top') {
                const hi = blocks.findIndex(b => b.type?.toLowerCase().includes('header') || b.id?.toLowerCase().includes('header'));
                hi !== -1 ? blocks.splice(hi + 1, 0, newBlock) : blocks.unshift(newBlock);
            } else {
                const fi = blocks.findIndex(b => b.type?.toLowerCase().includes('footer') || b.id?.toLowerCase().includes('footer'));
                fi !== -1 ? blocks.splice(fi, 0, newBlock) : blocks.push(newBlock);
            }
            return blocks;
        });
        setActiveBlockId(tempId);
        setSelectedTemplateId(null);
        setLeftView('outline');
        setToast({ msg: '✓ Section added! Syncing to theme...', ok: true });
        setTimeout(() => setToast(null), 3000);

        // Backend sync
        const form = new FormData();
        form.append("intent", "inject_section");
        form.append("sectionId", selectedTemplateId);
        form.append("settings", JSON.stringify(settings));
        form.append("placement", placement);
        fetcher.submit(form, { method: "post" });
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

    const handleReorder = (direction, index) => {
        if (direction === 'up' && index > 0) {
            const newBlocks = [...pageBlocks];
            [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
            setPageBlocks(newBlocks);
            const form = new FormData();
            form.append("intent", "reorder");
            form.append("order", JSON.stringify(newBlocks.map(b => b.id)));
            fetcher.submit(form, { method: "post" });
        } else if (direction === 'down' && index < pageBlocks.length - 1) {
            const newBlocks = [...pageBlocks];
            [newBlocks[index + 1], newBlocks[index]] = [newBlocks[index], newBlocks[index + 1]];
            setPageBlocks(newBlocks);
            const form = new FormData();
            form.append("intent", "reorder");
            form.append("order", JSON.stringify(newBlocks.map(b => b.id)));
            fetcher.submit(form, { method: "post" });
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

            {/* ── TOAST NOTIFICATION ── */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 99999, padding: '12px 24px', borderRadius: 8,
                    background: toast.ok ? '#1a7f37' : '#d1242f', color: '#fff',
                    fontSize: 14, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', gap: 8, maxWidth: 500,
                    animation: 'slideUp 0.3s ease'
                }}>
                    <span>{toast.msg}</span>
                    <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, marginLeft: 8 }}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ── TOPMOST HEADER (PageFly Page Editor) ── */}
            <div style={S.topmostHeader}>
                <div style={S.topmostLeft}>
                    <div style={S.pfLogoMark}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#3662e3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>
                    <span style={S.topmostTitle}>ConvertFlow Editor</span>
                </div>
                <div style={S.topmostRight}>
                    <button
                        className="te-publish-btn"
                        onClick={activeBlockId ? handleSaveLive : (selectedTemplateId ? handleInject : null)}
                        disabled={isBusy || (!activeBlockId && !selectedTemplateId)}
                        style={(!activeBlockId && !selectedTemplateId) ? { backgroundColor: '#e2f1e5', color: '#1f513b', border: '1px solid #c9e1d1', opacity: 1 } : {}}
                    >
                        {activeBlockId ? 'Save Settings' : (selectedTemplateId ? 'Add Section' : '✓ Theme Synced')}
                    </button>
                    <button className="te-close-btn" onClick={() => navigate('/app')}>
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* ── SECONDARY TOOLBAR ── */}
            <header style={S.topbar}>
                <div style={S.topbarLeft}>
                    <button className="te-icon-back" title="Home">
                        <Home size={15} strokeWidth={2.5} />
                    </button>
                    <div style={S.topbarTitleGroup}>
                        <span style={S.topbarPageName}>Untitled</span>
                        <span style={S.statusPill}>Unpublished</span>
                    </div>
                </div>

                <div style={S.topbarRight}>
                    <div style={S.flymateBadge}>
                        <Sparkles size={14} color="#6366f1" fill="#6366f1" style={{ marginRight: 4 }} /> Flymate
                    </div>

                    <div style={S.deviceToggle}>
                        <button className={"te-dev-btn" + (device === 'desktop' ? ' active' : '')} onClick={() => setDevice('desktop')}><Monitor size={15} strokeWidth={2.5} /></button>
                        <button className="te-dev-btn"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="4" y="5" width="16" height="14" rx="2" ry="2" /></svg></button>
                        <button className={"te-dev-btn" + (device === 'mobile' ? ' active' : '')} onClick={() => setDevice('mobile')}><Smartphone size={15} strokeWidth={2.5} /></button>
                    </div>

                    <div style={{ fontSize: 12, color: '#5c5f62', margin: '0 8px' }}>{device === 'desktop' ? '1443px, 100%' : '375px, 100%'}</div>

                    <button className="te-icon-btn"><Settings2 size={15} strokeWidth={2.5} /></button>
                    <div style={S.divider}></div>
                    <button className="te-icon-btn" disabled><Undo size={15} strokeWidth={2.5} color="#c9cccf" /></button>
                    <button className="te-icon-btn" disabled><Redo size={15} strokeWidth={2.5} color="#c9cccf" /></button>
                    <div style={S.divider}></div>
                    <button className="te-text-action"><Eye size={14} strokeWidth={2.5} /> Preview</button>
                    <button className="te-text-action" style={{ color: '#8c9196' }}><ExternalLink size={14} strokeWidth={2.5} /> View live</button>
                </div>
            </header>

            <div style={S.workspace}>
                {/* ── EXTREME LEFT UTILITY BAR ── */}
                <div style={S.utilityBar}>
                    <div style={S.utilityTop}>
                        <button className={"te-util-btn" + (utilTab === 'outline' ? ' active' : '')} onClick={() => { setUtilTab('outline'); setLeftView('outline'); }} title="Page Outline"><Layout size={18} strokeWidth={2} /></button>
                        <button className={"te-util-btn" + (utilTab === 'add' ? ' active' : '')} onClick={() => { setUtilTab('add'); setLeftView('categories'); }} title="Add Section"><Plus size={18} strokeWidth={2} /></button>
                        <button className={"te-util-btn" + (utilTab === 'templates' ? ' active' : '')} onClick={() => { setUtilTab('templates'); setLeftView('categories'); }} title="Template Library"><Blocks size={18} strokeWidth={2} /></button>
                        <button className={"te-util-btn" + (utilTab === 'layers' ? ' active' : '')} onClick={() => { setUtilTab('layers'); setLeftView('outline'); }} title="Layers"><FileText size={18} strokeWidth={2} /></button>
                        <button className="te-util-btn" onClick={() => window.open(`https://${shop}/admin/themes`, '_blank')} title="Theme Settings"><Settings2 size={18} strokeWidth={2} /></button>
                    </div>
                    <div style={S.utilityBottom}>
                        <button className="te-util-btn" onClick={() => navigate('/app')} title="Back to Dashboard"><User size={18} strokeWidth={2} /></button>
                    </div>
                </div>

                {/* ── LEFT SIDEBAR (PageFly Outline) ── */}
                <aside style={S.leftSidebar}>
                    {/* STATE 0: OUTLINE */}
                    {leftView === 'outline' && (
                        <div style={S.panelInner}>
                            <div style={S.panelHeader}>
                                <span style={S.panelTitle}>Page content</span>
                                <button className="te-icon-btn" onClick={() => navigate('/app')}><X size={16} strokeWidth={2.5} /></button>
                            </div>

                            <div style={S.outlineList}>
                                <div style={S.searchBox}>
                                    <span style={{ fontSize: 13, color: '#202223' }}>ConvertFlow body</span>
                                    <Search size={14} color="#8c9196" strokeWidth={2.5} />
                                </div>

                                {pageBlocks.length === 0 && (
                                    <div style={S.blueHintBox}>
                                        <div style={{ display: 'flex', gap: 8, color: '#005bd3' }}>
                                            <Eye size={14} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />
                                            <span>Add a section to make this template visible to customers.</span>
                                        </div>
                                        <button className="te-add-sec-link" onClick={() => setLeftView('categories')}>
                                            <Plus size={14} strokeWidth={2.5} /> Add section
                                        </button>
                                    </div>
                                )}

                                {pageBlocks.map((block, idx) => {
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
                                                    <ChevronRight size={14} strokeWidth={2.5} />
                                                </span>
                                                <span style={S.blockIcon}>
                                                    {block.isCf ? <Palette size={14} /> : <Layout size={14} />}
                                                </span>
                                                <span style={S.blockLabel}>{label}</span>
                                            </div>
                                            {block.isCf && (
                                                <div style={{ display: 'flex', gap: 2 }}>
                                                    <button
                                                        className="te-del-btn"
                                                        onClick={(e) => { e.stopPropagation(); handleReorder('up', idx); }}
                                                        title="Move up"
                                                        disabled={idx === 0}
                                                        style={{ opacity: idx === 0 ? 0.3 : 1 }}
                                                    >
                                                        <ArrowUp size={14} strokeWidth={2.5} />
                                                    </button>
                                                    <button
                                                        className="te-del-btn"
                                                        onClick={(e) => { e.stopPropagation(); handleReorder('down', idx); }}
                                                        title="Move down"
                                                        disabled={idx === pageBlocks.length - 1}
                                                        style={{ opacity: idx === pageBlocks.length - 1 ? 0.3 : 1 }}
                                                    >
                                                        <ArrowDown size={14} strokeWidth={2.5} />
                                                    </button>
                                                    <button
                                                        className="te-del-btn"
                                                        onClick={(e) => { e.stopPropagation(); handleRemove(block.id); }}
                                                        title="Remove section"
                                                    >
                                                        <X size={14} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                <div style={{ padding: '8px 12px', marginTop: '8px' }}>
                                    <button className="te-add-sec-link" onClick={() => setLeftView('categories')}>
                                        <Plus size={14} strokeWidth={2.5} /> Add section
                                    </button>
                                </div>

                                <div style={{ marginTop: 24, padding: '0 8px' }}>
                                    <div style={S.contextHeader}>Header</div>
                                    <div style={S.contextBlock}>
                                        <div style={S.blockRowLeft}>
                                            <Layout size={14} color="#5c5f62" />
                                            <span style={{ fontSize: 13, color: '#5c5f62' }}>Theme header</span>
                                        </div>
                                    </div>
                                    <div style={{ ...S.contextHeader, marginTop: 16 }}>Footer</div>
                                    <div style={S.contextBlock}>
                                        <div style={S.blockRowLeft}>
                                            <Layout size={14} color="#5c5f62" />
                                            <span style={{ fontSize: 13, color: '#5c5f62' }}>Theme footer</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STATE 1: CATEGORIES */}
                    {leftView === 'categories' && (
                        <div style={S.panelInner}>
                            <div style={S.panelHeader}>
                                <button className="te-icon-back" onClick={() => setLeftView('outline')}>
                                    <ChevronRight size={16} strokeWidth={2.5} style={{ transform: 'rotate(180deg)' }} />
                                </button>
                                <span style={S.panelTitle}>Add section</span>
                                <div style={{ width: 28 }}></div>
                            </div>
                            <div style={S.scrollArea}>
                                {cfCats.map(cat => (
                                    <button key={cat.id} className="te-list-item" onClick={() => handleSelectCategory(cat.id)}>
                                        <span style={S.listIcon}>{CAT_SVG[cat.id] || <Layout size={16} strokeWidth={2} />}</span>
                                        <span style={S.listText}>{cat.name}</span>
                                        <ChevronRight size={14} strokeWidth={2.5} style={{ marginLeft: 'auto', color: '#8c9196' }} />
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
                                    <ChevronRight size={16} strokeWidth={2.5} style={{ transform: 'rotate(180deg)' }} />
                                </button>
                                <span style={S.panelTitle}>{cfCats.find(c => c.id === activeCategoryId)?.name || 'Templates'}</span>
                                <div style={{ width: 28 }}></div>
                            </div>
                            <div style={{ ...S.scrollArea, padding: '12px 0' }}>
                                {templateIds.map(id => {
                                    const meta = SECTION_FILES[id];
                                    return (
                                        <button key={id} className="te-list-item" onClick={() => handleSelectTemplate(id)}>
                                            <span style={S.listIcon}><Palette size={16} strokeWidth={2} /></span>
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
                    <div style={{ ...S.canvasHeader, maxWidth: device === 'mobile' ? '400px' : '100%', display: 'flex', gap: 8 }}>
                        <span style={S.canvasHeaderTab}>No element selected</span>
                    </div>
                    <div style={{
                        ...S.previewFrame,
                        width: device === 'mobile' ? '400px' : '100%',
                        maxWidth: device === 'mobile' ? '400px' : '100%',
                    }}>
                        {!previewHtml && !activeBlockId && !selectedTemplateId && pageBlocks.length === 0 && (
                            <div style={S.emptyCanvas}>
                                <div style={S.emptyGraphic}>
                                    <svg viewBox="0 0 100 100" width="80" height="80" fill="none" stroke="#e4e5e7" strokeWidth="2">
                                        <rect x="10" y="20" width="80" height="60" rx="4" />
                                        <path d="M10 32h80M15 26h5M22 26h5M29 26h5" />
                                        <rect x="20" y="45" width="25" height="25" rx="2" fill="#f4f6f8" stroke="none" />
                                        <rect x="55" y="45" width="25" height="4" rx="2" />
                                        <rect x="55" y="55" width="20" height="4" rx="2" />
                                        <rect x="55" y="65" width="15" height="4" rx="2" />
                                    </svg>
                                </div>
                                <h3 style={S.emptyCanvasTitle}>This page is empty</h3>
                                <p style={S.emptyCanvasSub}>Choose a starting point to begin designing your page.</p>
                                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                    <button className="te-canvas-btn" onClick={() => setLeftView('categories')}>
                                        <Plus size={14} strokeWidth={2.5} /> Add element
                                    </button>
                                    <button className="te-canvas-btn-dark">
                                        <Sparkles size={14} strokeWidth={2.5} /> Prompt with AI
                                    </button>
                                </div>
                                <p style={{ marginTop: 24, fontSize: 13, color: '#5c5f62' }}>
                                    Don't want to start from scratch?<br />
                                    <span style={{ color: '#1a73e8', cursor: 'pointer' }} onClick={() => setLeftView('categories')}>Add a section</span> or <span style={{ color: '#1a73e8', cursor: 'pointer' }}>Select a page template</span>
                                </p>
                            </div>
                        )}
                        {(!previewHtml && (!activeBlockId && !selectedTemplateId) && pageBlocks.length > 0) && (
                            <div style={S.previewPlaceholder}>
                                <div className="te-spinner" />
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

                {/* ── RIGHT SETTINGS PANEL (Conditional/Static empty state) ── */}
                <aside style={S.rightSidebar}>
                    {!(selectedTemplateId || activeBlockId) ? (
                        <div style={S.panelInner}>
                            <div style={S.rightEmptyState}>
                                <div style={S.rightEmptyIcon}>
                                    <Settings2 size={24} strokeWidth={1.5} color="#202223" />
                                </div>
                                <h3 style={S.rightEmptyTitle}>Customize your pages</h3>
                                <p style={S.rightEmptyText}>Select an element from the canvas or page outline to view its settings here.</p>
                                <p style={S.rightEmptyText}>A ConvertFlow page works as a section in your Shopify theme. To edit theme sections, visit the theme editor. <a href="#" style={{ color: '#202223' }}>Learn more</a></p>
                                <button className="te-text-action" style={{ padding: 0, marginTop: 8 }} onClick={() => window.open(`https://${shop}/admin/themes`, '_blank')}><ExternalLink size={14} strokeWidth={2.5} /> Go to theme editor</button>

                                <div style={S.shortcutsBlock}>
                                    <h4 style={S.shortcutsTitle}>Keyboard shortcuts</h4>
                                    <div style={S.shortcutRow}><div><kbd>hold</kbd> <kbd>ctrl</kbd></div><span>Select multiple</span></div>
                                    <div style={S.shortcutRow}><div><kbd>ctrl</kbd> <kbd>shift</kbd> <kbd>S</kbd></div><span>Save & publish</span></div>
                                    <div style={S.shortcutRow}><div><kbd>ctrl</kbd> <kbd>S</kbd></div><span>Save</span></div>
                                    <div style={S.shortcutRow}><div><kbd>ctrl</kbd> <kbd>shift</kbd> <kbd>Z</kbd></div><span>Redo</span></div>
                                    <div style={S.shortcutRow}><div><kbd>ctrl</kbd> <kbd>Z</kbd></div><span>Undo</span></div>
                                    <div style={S.shortcutRow}><div><kbd>ctrl</kbd> <kbd>D</kbd></div><span>Duplicate</span></div>
                                    <div style={S.shortcutRow}><div><kbd>delete</kbd></div><span>Delete</span></div>
                                    <div style={S.shortcutRow}><div><kbd>ctrl</kbd> <kbd>C</kbd></div><span>Copy style</span></div>
                                    <div style={S.shortcutRow}><div><kbd>ctrl</kbd> <kbd>V</kbd></div><span>Paste style</span></div>
                                </div>
                            </div>
                        </div>
                    ) : (
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
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                                <span style={S.panelTitle}>
                                    {templateSchema.name || (activeBlockId ? 'Edit Section' : 'Customize Section')}
                                </span>
                                <div style={{ width: 28 }}></div>
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
                                    <div style={{ padding: 40, textAlign: 'center', color: '#8c9196', fontSize: 13 }}>Loading parameters...</div>
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
                    )}
                </aside>
            </div >
        </div >
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
    root: { display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f4f6f8', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },

    // Topmost Header
    topmostHeader: {
        height: '44px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', borderBottom: '1px solid #e4e5e7', flexShrink: 0, zIndex: 11
    },
    topmostLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
    pfLogoMark: { width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    topmostTitle: { fontSize: '13px', fontWeight: '600', color: '#202223' },
    topmostRight: { display: 'flex', alignItems: 'center', gap: '12px' },

    // Secondary Toolbar
    topbar: {
        height: '52px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', borderBottom: '1px solid #e4e5e7', flexShrink: 0, zIndex: 10
    },
    topbarLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
    topbarTitleGroup: { display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '8px' },
    topbarPageName: { fontSize: '14px', fontWeight: '500', color: '#202223' },
    statusPill: { fontSize: '11px', backgroundColor: '#f4f6f8', color: '#5c5f62', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' },

    topbarRight: { display: 'flex', alignItems: 'center', gap: '8px' },
    flymateBadge: { display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#202223', backgroundColor: '#eef2ff', padding: '4px 8px', borderRadius: '12px', marginRight: 16 },
    deviceToggle: { display: 'flex', gap: '2px' },
    divider: { width: '1px', height: '24px', backgroundColor: '#e4e5e7', margin: '0 8px' },

    workspace: { display: 'flex', flex: 1, overflow: 'hidden' },

    // Utility Sidebar (Extreme Left)
    utilityBar: {
        width: '56px', backgroundColor: '#ffffff', borderRight: '1px solid #e4e5e7',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', flexShrink: 0, zIndex: 6
    },
    utilityTop: { display: 'flex', flexDirection: 'column', gap: '8px' },
    utilityBottom: { display: 'flex', flexDirection: 'column', gap: '8px' },

    // Left Sidebar (Page Content / Context)
    leftSidebar: {
        width: '260px', backgroundColor: '#ffffff', borderRight: '1px solid #e4e5e7',
        display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 5
    },
    panelInner: { display: 'flex', flexDirection: 'column', height: '100%' },
    panelHeader: {
        padding: '16px', borderBottom: '1px solid #e4e5e7',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    },
    panelTitle: { fontSize: '14px', fontWeight: '600', color: '#202223', margin: 0 },

    outlineList: { flex: 1, overflowY: 'auto', padding: '16px 8px' },
    searchBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #f4f6f8', marginBottom: '8px' },
    blueHintBox: { backgroundColor: '#f1f8fe', padding: '12px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', border: '1px solid #e1f0fe' },

    // Aesthetic structural row markers
    contextBlock: { padding: '8px', marginBottom: '8px', borderRadius: '6px' },
    contextHeader: { fontSize: '12px', color: '#202223', fontWeight: '600', marginBottom: '4px', paddingLeft: '8px' },

    blockRowLeft: { display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' },
    dragHandle: { color: '#c9cccf', display: 'flex' }, // Now repurposed for Chevron
    blockIcon: { color: '#5c5f62', display: 'flex' },
    blockLabel: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' },

    scrollArea: { flex: 1, overflowY: 'auto' },
    listIcon: { color: '#5c5f62', display: 'flex' },
    listText: { fontSize: '13px', fontWeight: '500' },

    // Center Canvas (Preview iframe)
    canvas: {
        flex: 1, position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', backgroundColor: '#f4f6f8', overflow: 'hidden', padding: '0 24px 24px 24px'
    },
    canvasHeader: { width: '100%', padding: '8px 0', display: 'flex' },
    canvasHeaderTab: { fontSize: '12px', color: '#5c5f62', fontWeight: 500 },
    previewFrame: {
        flex: 1, width: '100%', maxWidth: '100%', height: '100%',
        backgroundColor: '#fff', position: 'relative', transition: 'width 0.3s ease, max-width 0.3s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '4px', border: '1px solid #e4e5e7'
    },
    emptyCanvas: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', borderRadius: '4px' },
    emptyCanvasTitle: { fontSize: '20px', fontWeight: '600', color: '#202223', margin: '16px 0 8px 0' },
    emptyCanvasSub: { fontSize: '14px', color: '#5c5f62', margin: '0 0 24px 0' },
    emptyGraphic: { width: 140, height: 110, backgroundColor: '#ffffff', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #e4e5e7' },

    previewPlaceholder: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
    previewOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(255, 255, 255, 0.4)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(1px)' },
    previewIframe: { width: '100%', height: '100%', border: 'none', transition: 'opacity 0.2s', backgroundColor: '#fff', borderRadius: '4px' },

    // Right Sidebar (Properties/Settings)
    rightSidebar: {
        width: '300px', backgroundColor: '#ffffff', borderLeft: '1px solid #e4e5e7',
        display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 5
    },
    rightEmptyState: { padding: '24px', display: 'flex', flexDirection: 'column' },
    rightEmptyIcon: { width: 44, height: 44, border: '2px solid #202223', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    rightEmptyTitle: { fontSize: '16px', fontWeight: '600', color: '#202223', margin: '0 0 12px 0' },
    rightEmptyText: { fontSize: '13px', color: '#5c5f62', lineHeight: '1.5', margin: '0 0 16px 0' },
    shortcutsBlock: { marginTop: '32px', borderTop: '1px solid #e4e5e7', paddingTop: '24px' },
    shortcutsTitle: { fontSize: '14px', fontWeight: '600', color: '#202223', margin: '0 0 16px 0' },
    shortcutRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '12px', color: '#5c5f62', fontWeight: 500 },

    settingsScroll: { flex: 1, overflowY: 'auto', padding: '0' },
    settingBlock: { padding: '24px 20px', borderBottom: '1px solid #f4f6f8' },
    settingLabel: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#202223', marginBottom: '8px' },
    settingsList: { display: 'flex', flexDirection: 'column', gap: '0' },
    placementRow: { display: 'flex', width: '100%', borderRadius: '4px' },

    // Setting rows padding resets
    colorSwatch: { width: 36, height: 36, padding: 0, border: '1px solid #c4cdd5', borderRadius: 6, cursor: 'pointer', overflow: 'hidden' },
    colorCode: { fontSize: 13, color: '#202223', fontFamily: 'monospace', flex: 1, background: '#f4f6f8', padding: '8px 12px', border: '1px solid #c4cdd5', borderRadius: 6 },
    rangeVal: { fontSize: 13, fontWeight: 500, color: '#202223', minWidth: 40, textAlign: 'right' },
    imageUploadBox: { border: '1px dashed #c4cdd5', borderRadius: 8, background: '#f9fafb', padding: 8, textAlign: 'center' },
    imageUploadLabel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 0', cursor: 'pointer', color: '#5c5f62', fontSize: 13, fontWeight: 500 },
    imagePreviewWrapper: { position: 'relative', width: '100%', height: 120, borderRadius: 4, overflow: 'hidden', background: '#fff', border: '1px solid #e1e3e5' },
    imagePreview: { width: '100%', height: '100%', objectFit: 'contain' }
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  body {
      margin: 0; padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f4f6f8;
      color: #202223;
  }
  *, *::before, *::after { box-sizing: border-box; }

  kbd { background-color: #f4f6f8; border: 1px solid #e4e5e7; border-radius: 4px; padding: 2px 6px; box-shadow: 0 1px 1px rgba(0,0,0,0.05); font-family: inherit; font-size: 11px; font-weight: 500; color: #202223; }

  /* Utility Sidebar */
  .te-util-btn { width: 40px; height: 40px; border-radius: 6px; border: none; background: transparent; display: flex; align-items: center; justify-content: center; color: #5c5f62; cursor: pointer; transition: 0.1s; }
  .te-util-btn:hover { background-color: #f4f6f8; color: #202223; }
  .te-util-btn.active { background-color: #eef2ff; color: #3662e3; }

  /* Outline List Sub-Hover Effects */
  .te-block-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 6px 16px 6px 12px;
      margin: 1px 0;
      cursor: pointer;
      border-radius: 4px;
      color: #5c5f62;
      transition: background-color 0.15s ease, color 0.15s ease;
      user-select: none;
      font-size: 13px;
  }
  .te-block-row:hover {
      background-color: #f6f6f7;
      color: #202223;
  }
  .te-block-row.active {
      background-color: #eef2ff; 
      color: #3662e3;
      font-weight: 500;
  }
  .te-block-row.active .blockIcon, .te-block-row.active .dragHandle { color: #3662e3 !important; }

  .te-add-sec-link { background: none; border: none; outline: none; padding: 0; margin-top: 12px; font-size: 13px; font-weight: 500; color: #1a73e8; display: flex; align-items: center; gap: 4px; cursor: pointer; }
  .te-add-sec-link:hover { text-decoration: underline; }

  .te-del-btn {
      background: none; border: none; padding: 4px; cursor: pointer;
      color: #8c9196; opacity: 0; border-radius: 3px; display: flex; align-items: center; justify-content: center;
  }
  .te-block-row:hover .te-del-btn { opacity: 1; }
  .te-del-btn:hover { background-color: #e4e5e7; color: #d82c0d; opacity: 1; }

  /* Category/Template List Items */
  .te-list-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 16px;
      width: 100%; text-align: left;
      background: none; border: none; cursor: pointer;
      color: #5c5f62;
      border-bottom: 1px solid #f4f6f8;
      transition: background-color 0.15s ease;
      font-family: inherit;
  }
  .te-list-item:hover {
      background-color: #f6f6f7;
      color: #202223;
  }

  /* Buttons */
  .te-text-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      background: none; border: none; cursor: pointer;
      color: #1a73e8; /* Classic blue for Add Section */
      font-size: 13px; font-weight: 500; width: 100%;
      padding: 8px 12px; border-radius: 4px;
      transition: background-color 0.15s ease;
      font-family: inherit;
  }
  .te-text-btn:hover { background-color: #f1f8fe; }

  .te-text-action { background: none; border: none; color: #202223; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px; cursor: pointer; font-family: inherit; padding: 6px 8px; border-radius: 4px; }
  .te-text-action:hover { background-color: #f4f6f8; }

  .te-icon-back, .te-icon-btn {
      display: flex; justify-content: center; align-items: center;
      width: 28px; height: 28px;
      background: none; border: none; cursor: pointer; color: #5c5f62;
      border-radius: 4px; padding: 0;
  }
  .te-icon-back:hover, .te-icon-btn:hover { background-color: #f4f6f8; color: #202223; }

  .te-dev-btn {
      display: flex; justify-content: center; align-items: center;
      width: 28px; height: 28px;
      background: none; border: none; cursor: pointer; color: #8c9196;
      border-radius: 4px; transition: all 0.1s ease; margin: 0 1px;
  }
  .te-dev-btn:hover { color: #202223; background-color: #f4f6f8; }
  .te-dev-btn.active { color: #202223; background-color: #f4f6f8; }

  /* PageFly 'Publish' and 'Canvas' buttons */
  .te-publish-btn {
      background: #202223; color: white;
      border: none; padding: 5px 16px; border-radius: 40px;
      font-weight: 500; font-size: 12px; cursor: pointer;
      display: flex; align-items: center; gap: 6px;
      font-family: inherit;
  }
  .te-publish-btn:hover:not(:disabled) { background: #000000; }
  .te-publish-btn:disabled { background: #e4e5e7; color: #8c9196; cursor: not-allowed; }

  .te-close-btn { background: none; border: none; cursor: pointer; color: #8c9196; padding: 4px; display: flex; }
  .te-close-btn:hover { color: #202223; }

  .te-canvas-btn { background: #ffffff; border: 1px solid #c9cccf; padding: 8px 16px; border-radius: 4px; font-weight: 500; font-size: 13px; color: #202223; cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: inherit; }
  .te-canvas-btn:hover { background: #f4f6f8; }

  .te-canvas-btn-dark { background: #202223; border: 1px solid #202223; padding: 8px 16px; border-radius: 4px; font-weight: 500; font-size: 13px; color: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: inherit; }
  .te-canvas-btn-dark:hover { background: #000000; }

  /* Settings Inputs */
  .te-input, .te-select {
      width: 100%; box-sizing: border-box;
      padding: 8px 12px;
      border: 1px solid #c9cccf; border-radius: 4px;
      font-size: 13px; color: #202223; font-family: inherit;
      background: #ffffff;
      outline: none; transition: border-color 0.2s ease;
  }
  .te-input:focus, .te-select:focus { border-color: #1a73e8; box-shadow: 0 0 0 1px #1a73e8; }
  
  .te-place-btn {
      flex: 1; padding: 8px 0; border: 1px solid #c9cccf; background: #fff;
      cursor: pointer; font-size: 13px; transition: all 0.2s;
      color: #5c5f62; font-family: inherit;
  }
  .te-place-btn:first-child { border-radius: 4px 0 0 4px; border-right: none; }
  .te-place-btn:last-child { border-radius: 0 4px 4px 0; border-left: none; }
  .te-place-btn.active { background: #f4f6f8; color: #202223; font-weight: 500; z-index: 1; border: 1px solid #c9cccf;}

  /* Scrollbars - refined minimal look */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d2d5d8; border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: #aeb4b9; }

  .te-spinner {
      width: 20px; height: 20px;
      border: 2px solid #e4e5e7; border-top-color: #202223;
      border-radius: 50%;
      animation: te-spin 0.8s linear infinite;
  }
  @keyframes te-spin { to { transform: rotate(360deg); } }
  @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
`;

