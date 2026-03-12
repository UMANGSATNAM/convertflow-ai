import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useThemeEditor } from './ThemeEditorContext';
import { useIframeBridge } from './useIframeBridge';

/**
 * Canvas — the preview iframe panel.
 *
 * STRATEGY (mirrors Shopify's actual editor):
 *  - Full proxy reload ONLY on: first mount, template switch, explicit reload button
 *  - After save/inject → call Section Rendering API → postMessage shopify:section:load
 *  - After remove     → postMessage shopify:section:remove (no reload)
 *  - After visibility → reload just that section's HTML
 *  - selectedBlockId changes → postMessage shopify:section:select (no reload)
 */
export function Canvas() {
    const {
        activeBlock, selectedBlockId, setSelectedBlockId,
        device, shop, templateFile, themeId, lastSavedAt,
        fetcher,
    } = useThemeEditor();

    const iframeRef     = useRef(null);
    const [srcDoc, setSrcDoc]   = useState('');
    const [loading, setLoading] = useState(true);
    const abortRef      = useRef(null);
    const iframeReady   = useRef(false);
    const prevTemplate  = useRef(templateFile);
    const prevSaved     = useRef(null);

    // ── iframe bridge ─────────────────────────────────────────────
    const { selectSection, deselectSection, loadSection, removeSection } = useIframeBridge(iframeRef, {
        onSectionClick: (blockId) => setSelectedBlockId(blockId),
        onIframeReady: () => { iframeReady.current = true; },
    });

    // ── Full page proxy reload ─────────────────────────────────────
    const fetchFullPreview = useCallback(() => {
        if (abortRef.current) abortRef.current.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setLoading(true);
        iframeReady.current = false;

        const page    = templateFile?.includes('product') ? 'product' : 'home';
        const tParam  = themeId ? `&themeId=${encodeURIComponent(themeId)}` : '';
        const url     = `/app/api/storefront-proxy?page=${page}${tParam}&t=${Date.now()}`;

        fetch(url, { signal: ctrl.signal })
            .then(r => { if (!r.ok) throw new Error(`Proxy ${r.status}`); return r.json(); })
            .then(d => { if (d?.html) setSrcDoc(d.html); })
            .catch(e => { if (e.name !== 'AbortError') console.error('[Canvas]', e); })
            .finally(() => setLoading(false));
    }, [templateFile, themeId]);

    // ── Smart section inject (no full reload) ─────────────────────
    const injectSection = useCallback(async (sectionType, blockId) => {
        if (!iframeReady.current) {
            // iframe not ready yet, wait for full reload to complete
            return;
        }
        const tParam = themeId ? `&themeId=${encodeURIComponent(themeId)}` : '';
        const url    = `/app/api/render-section?sectionId=${encodeURIComponent(sectionType)}&blockId=${encodeURIComponent(blockId)}${tParam}`;

        console.log('[Canvas] Injecting section via Section Rendering API:', url);
        try {
            const res  = await fetch(url);
            const data = await res.json();
            if (data?.html) {
                loadSection(blockId, data.html);
                console.log('[Canvas] ✅ Section injected via postMessage');
            } else {
                // Fallback: full reload if section rendering returns empty
                console.warn('[Canvas] No HTML from render API, doing full reload');
                fetchFullPreview();
            }
        } catch (e) {
            console.error('[Canvas] Section render failed, falling back:', e);
            fetchFullPreview();
        }
    }, [themeId, loadSection, fetchFullPreview]);

    // ── First load + template switch ──────────────────────────────
    useEffect(() => {
        if (templateFile !== prevTemplate.current) {
            prevTemplate.current = templateFile;
        }
        fetchFullPreview();
        return () => abortRef.current?.abort();
    }, [templateFile, themeId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── React to fetcher completion ───────────────────────────────
    useEffect(() => {
        if (fetcher.state !== 'idle' || !fetcher.data?.ok) return;
        if (lastSavedAt === prevSaved.current) return;
        prevSaved.current = lastSavedAt;

        const intent       = fetcher.data?.intent;    // may not be set
        const savedBlockId = fetcher.data?.blockId || fetcher.data?.newBlockId || selectedBlockId;
        const sectionType  = activeBlock?.type || savedBlockId;

        // Remove section → postMessage only
        if (fetcher.data?.intent === 'remove_section') {
            removeSection(savedBlockId);
            return;
        }

        // Reorder → just tell iframe to reorder (no reload)
        if (intent === 'reorder') {
            // Shopify reorder is purely DOM manipulation; a full reload gives the correct order
            setTimeout(() => fetchFullPreview(), 400);
            return;
        }

        // Settings update or visibility toggle → inject fresh section HTML
        if (savedBlockId && sectionType && iframeReady.current) {
            injectSection(sectionType, savedBlockId);
        } else if (!iframeReady.current) {
            // iframe hasn't loaded yet; just do a full reload
            setTimeout(() => fetchFullPreview(), 400);
        }
    }, [fetcher.state, lastSavedAt]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Highlight selected section in iframe ──────────────────────
    const prevSelected = useRef(null);
    useEffect(() => {
        if (!iframeReady.current) return;
        if (selectedBlockId && selectedBlockId !== prevSelected.current) {
            selectSection(selectedBlockId);
        } else if (!selectedBlockId && prevSelected.current) {
            deselectSection();
        }
        prevSelected.current = selectedBlockId;
    }, [selectedBlockId, selectSection, deselectSection]);

    const isMobile  = device === 'mobile';
    const isSaving  = fetcher?.state !== 'idle';

    return (
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f4f6f8', overflow: 'hidden', position: 'relative' }}>

            {/* Progress bar */}
            {(loading || isSaving) && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, zIndex: 50, background: 'linear-gradient(90deg, #4f46e5, #2563eb)', animation: 'cf-progress 1.6s ease-in-out infinite' }} />
            )}

            {/* Top hint bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0 4px', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: '#9ca3af', background: '#f3f4f6', padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? '#f59e0b' : '#22c55e', display: 'inline-block' }} />
                    {loading ? 'Loading preview…' : activeBlock ? `Editing: ${(activeBlock.type || '').replace(/^cf[-_]/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}` : 'Live Preview — click any section to edit'}
                </span>
                <button
                    onClick={fetchFullPreview}
                    title="Reload full preview"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', fontSize: 11, color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 20, background: '#fff', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
                    onMouseOver={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#4f46e5'; }}
                    onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; }}
                >
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd"/></svg>
                    Reload
                </button>
            </div>

            {/* Preview area */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 16px 16px', overflow: 'hidden', alignItems: 'flex-start' }}>
                <div style={{
                    width: isMobile ? 390 : '100%',
                    maxWidth: isMobile ? 390 : 1280,
                    height: '100%',
                    background: '#fff',
                    borderRadius: isMobile ? 36 : 10,
                    border: isMobile ? '10px solid #1c1c1c' : '1px solid #e5e7eb',
                    boxShadow: isMobile
                        ? '0 0 0 2px #3a3a3a, 0 20px 60px rgba(0,0,0,0.22)'
                        : '0 4px 24px rgba(0,0,0,0.07)',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1), border-radius 0.35s cubic-bezier(0.4,0,0.2,1)',
                    flexShrink: 0,
                }}>
                    {/* iPhone camera notch decoration */}
                    {isMobile && (
                        <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 100, height: 16, background: '#1c1c1c', borderRadius: 10, zIndex: 99 }} />
                    )}

                    {/* First-load skeleton */}
                    {loading && !srcDoc && (
                        <div style={{ position: 'absolute', inset: 0, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, zIndex: 10 }}>
                            <div style={{ width: 36, height: 36, border: '3px solid #f3f4f6', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'cf-spin 0.7s linear infinite' }} />
                            <span style={{ fontSize: 13, color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>Loading your live theme…</span>
                        </div>
                    )}

                    {srcDoc && (
                        <iframe
                            ref={iframeRef}
                            srcDoc={srcDoc}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                display: 'block',
                                marginTop: isMobile ? 20 : 0, // account for notch
                                height: isMobile ? 'calc(100% - 20px)' : '100%',
                            }}
                            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                            title="Live theme preview"
                            onLoad={() => {
                                // Once iframe loads, re-send section select if applicable
                                setTimeout(() => {
                                    if (selectedBlockId) selectSection(selectedBlockId);
                                }, 200);
                            }}
                        />
                    )}

                    {!srcDoc && !loading && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32, textAlign: 'center' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                            <p style={{ margin: 0, fontSize: 14, color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>Preview unavailable</p>
                            <p style={{ margin: 0, fontSize: 12, color: '#d1d5db' }}>Check that your store password is disabled</p>
                            <button onClick={fetchFullPreview} style={{ marginTop: 8, padding: '7px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Try again</button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes cf-spin     { to { transform: rotate(360deg); } }
                @keyframes cf-progress { 0%{left:0;width:0}60%{left:20%;width:70%}100%{left:100%;width:0} }
            `}</style>
        </section>
    );
}
