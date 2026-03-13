import React, { useState, useEffect, useRef } from 'react';
import { useFetcher } from "@remix-run/react";
import { Sidebar } from './Sidebar';
import { PropertiesPanel } from './PropertiesPanel';
import { Canvas } from './Canvas';

export function StoreBuilder({ pageBlocks: initBlocks = [], themeId, shop, categories }) {
    const fetcher = useFetcher();
    
    // Core State
    const [pageBlocks, setPageBlocks] = useState(initBlocks);
    const [device, setDevice] = useState('desktop');
    const [activeTab, setActiveTab] = useState('page'); // 'page' or 'elements'
    
    // Selections
    const [activeBlockId, setActiveBlockId] = useState(null);
    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState(null);

    // Settings & Live Preview State
    const [templateSchema, setTemplateSchema] = useState({ settings: [], name: '' });
    const [settings, setSettings] = useState({});
    const [placement, setPlacement] = useState('bottom');
    const [previewHtml, setPreviewHtml] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const previewTimerRef = useRef(null);

    // ─── 1. Handle Fetcher Data Sync ───
    useEffect(() => {
        if (fetcher.data?.pageBlocks) setPageBlocks(fetcher.data.pageBlocks);
        if (fetcher.data?.message) {
            setToast({ msg: fetcher.data.message, ok: fetcher.data.ok });
            setTimeout(() => setToast(null), 3000);
        }
        if (fetcher.data?.newBlockId) {
            setActiveBlockId(fetcher.data.newBlockId);
            setActiveTab('page');
        }
    }, [fetcher.data]);

    // ─── 2. Fetch Live Preview ───
    useEffect(() => {
        const targetId = activeBlockId ? pageBlocks.find(b => b.id === activeBlockId)?.type : selectedTemplateId;

        setPreviewLoading(true);
        clearTimeout(previewTimerRef.current);
        previewTimerRef.current = setTimeout(async () => {
            try {
                if (!targetId) {
                    const res = await fetch(`/app/api/full-preview?shop=${shop}&themeId=${themeId}`);
                    if (res.ok) {
                        const html = await res.text();
                        setPreviewHtml(html);
                    }
                    return;
                }

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
    }, [selectedTemplateId, activeBlockId, settings, pageBlocks, shop, themeId]);

    // ─── 3. Fetch Schema ───
    useEffect(() => {
        const targetId = activeBlockId ? pageBlocks.find(b => b.id === activeBlockId)?.type : selectedTemplateId;
        if (!targetId) return;

        fetch(`/app/api/section-schema?id=${targetId}`)
            .then(r => r.json())
            .then(data => {
                if (data.settings) {
                    setTemplateSchema({ settings: data.settings, name: data.name || targetId });
                    if (activeBlockId) {
                        const savedSettings = pageBlocks.find(b => b.id === activeBlockId)?.settings || {};
                        const merged = {};
                        data.settings.forEach(s => { merged[s.id] = savedSettings[s.id] !== undefined ? savedSettings[s.id] : s.default; });
                        setSettings(merged);
                    } else {
                        const defaults = {};
                        data.settings.forEach(s => { if (s.default !== undefined) defaults[s.id] = s.default; });
                        setSettings(defaults);
                    }
                }
            }).catch(() => { });
    }, [selectedTemplateId, activeBlockId, pageBlocks]);


    // ─── 4. Actions ───
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
        
        // Optimistic UI update
        setPageBlocks(prev => prev.filter(b => b.id !== blockId));
        if (activeBlockId === blockId) {
            setActiveBlockId(null);
            setSettings({});
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

    const isBusy = fetcher.state !== 'idle';


    return (
        <div style={{
            width: '100vw', height: '100vh',
            display: 'flex', flexDirection: 'column',
            fontFamily: "'Inter', -apple-system, sans-serif",
            background: '#f9fafb',
            color: '#111827',
            overflow: 'hidden',
        }}>
            {/* ─── TOP HEADER ─── */}
            <header style={{
                height: 56, background: '#ffffff', borderBottom: '1px solid #e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', gap: 16,
                flexShrink: 0, zIndex: 100,
            }}>
                {/* LEFT: Branding & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4f46e5', fontWeight: 700, fontSize: 13, letterSpacing: '-0.02em' }}>
                        <div style={{ width: 20, height: 20, background: 'linear-gradient(135deg, #4f46e5, #818cf8)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        </div>
                        ConvertFlow AI
                    </div>

                    <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#111827', lineHeight: 1 }}>Home page</span>
                            <span style={{ fontSize: 10, color: '#6b7280', lineHeight: 1 }}>{toast ? toast.msg : 'Unpublished'}</span>
                        </div>
                    </div>
                </div>

                {/* CENTER: Device Toggles & Controls */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#4f46e5', fontWeight: 600, fontSize: 12 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
                        ConvertFlow
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {[
                            { id: 'desktop', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, label: 'Desktop' },
                            { id: 'tablet', icon: <svg width="14" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, label: 'Tablet' },
                            { id: 'mobile', icon: <svg width="12" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, label: 'Mobile' },
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setDevice(opt.id)}
                                title={opt.label}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer',
                                    background: device === opt.id ? '#f3f4f6' : 'transparent',
                                    color: device === opt.id ? '#111827' : '#9ca3af',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {opt.icon}
                            </button>
                        ))}
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 500, color: '#4b5563' }}>1443px, 100%</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button style={{ background: 'transparent', border: 'none', color: '#9ca3af', padding: 4, cursor: 'pointer' }}>
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 20l-6-6 6-6"/><path d="M20 14v4a2 2 0 0 1-2 2H4"/></svg>
                        </button>
                        <button style={{ background: 'transparent', border: 'none', color: '#cecece', padding: 4, cursor: 'not-allowed' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 20l6-6-6-6"/><path d="M4 14v4a2 2 0 0 0 2 2h14"/></svg>
                        </button>
                    </div>
                </div>

                {/* RIGHT: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260, justifyContent: 'flex-end' }}>
                    
                    {isBusy && <span style={{ fontSize: 12, color: '#6b7280' }}>Loading...</span>}

                    <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', fontSize: 12, fontWeight: 500, color: '#4b5563', cursor: 'pointer' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M1 12h22"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        Preview
                    </button>

                    <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', fontSize: 12, fontWeight: 500, color: '#9ca3af', cursor: 'pointer' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                        View live
                    </button>

                    <button
                        onClick={activeBlockId ? handleSaveLive : handleInject}
                        disabled={isBusy || (!activeBlockId && !selectedTemplateId)}
                        style={{
                            height: 32, padding: '0 16px', marginLeft: 8,
                            background: '#1f2937', color: '#fff', border: 'none', borderRadius: 4, 
                            fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
                            opacity: isBusy || (!activeBlockId && !selectedTemplateId) ? 0.5 : 1
                        }}
                    >
                        {selectedTemplateId ? 'Add Section' : (activeBlockId ? 'Save Update' : 'Publish')}
                    </button>
                    
                    <button style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 4, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', cursor: 'pointer' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </header>

            {/* ─── BODY ─── */}
            <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <Sidebar 
                    blocks={pageBlocks} 
                    categories={categories}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    activeBlockId={activeBlockId} 
                    setActiveBlockId={setActiveBlockId}
                    activeCategoryId={activeCategoryId}
                    setActiveCategoryId={setActiveCategoryId}
                    selectedTemplateId={selectedTemplateId}
                    setSelectedTemplateId={setSelectedTemplateId}
                    onRemoveBlock={handleRemove}
                />
                
                <Canvas 
                    device={device} 
                    previewHtml={previewHtml} 
                    previewLoading={previewLoading} 
                    activeBlockId={activeBlockId}
                    onBlockSelect={(blockId) => {
                        setActiveBlockId(blockId);
                        setActiveTab('page');
                    }}
                />
                
                <PropertiesPanel 
                    selectedBlockId={activeBlockId} 
                    selectedTemplateId={selectedTemplateId}
                    onClearSelection={() => {
                        setActiveBlockId(null);
                        setSelectedTemplateId(null);
                        setSettings({});
                    }}
                    templateSchema={templateSchema}
                    settings={settings}
                    setSettings={setSettings}
                    placement={placement}
                    setPlacement={setPlacement}
                />
            </main>
        </div>
    );
}

