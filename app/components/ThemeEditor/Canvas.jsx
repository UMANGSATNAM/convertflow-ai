import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useThemeEditor } from './ThemeEditorContext';
import { useIframeBridge } from './useIframeBridge';

/**
 * Canvas — live preview iframe.
 *
 * Reload strategy (most-reliable-first):
 *  1. Full proxy reload → when template/themeId changes (first load, template switch)
 *  2. Section Rendering API + postMessage → on settings save (no full reload)
 *  3. postMessage remove → on section delete
 *  4. Fallback: full proxy reload if Section Rendering API returns empty
 *
 * Registered via `registerPreviewReload` in Context so the reload fires
 * IMMEDIATELY when the server action completes — zero React render-cycle gap.
 */
export function Canvas() {
    const {
        activeBlock, selectedBlockId, setSelectedBlockId,
        device, templateFile, themeId, fetcher, registerPreviewReload,
    } = useThemeEditor();

    const iframeRef   = useRef(null);
    const iframeReady = useRef(false);
    const abortRef    = useRef(null);
    const [srcDoc, setSrcDoc]   = useState('');
    const [loading, setLoading] = useState(true);

    // ── iframe ↔ parent bridge ────────────────────────────────────
    const { selectSection, deselectSection, loadSection, removeSection } = useIframeBridge(iframeRef, {
        onSectionClick: (id) => setSelectedBlockId(id),
        onIframeReady:  () => { iframeReady.current = true; },
    });

    // ────────────────────────────────────────────────────────────
    //  FULL PROXY RELOAD
    //  Used for:  first load, template switch, explicit reload btn,
    //            fallback when section render API fails
    // ────────────────────────────────────────────────────────────
    const fetchFull = useCallback((cb) => {
        if (abortRef.current) abortRef.current.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setLoading(true);
        iframeReady.current = false;

        const page   = templateFile?.includes('product') ? 'product' : 'home';
        const tParam = themeId ? `&themeId=${encodeURIComponent(themeId)}` : '';
        const url    = `/app/api/storefront-proxy?page=${page}${tParam}&t=${Date.now()}`;

        fetch(url, { signal: ctrl.signal })
            .then(r => { if (!r.ok) throw new Error(`Proxy HTTP ${r.status}`); return r.json(); })
            .then(d  => { if (d?.html) { setSrcDoc(d.html); cb?.(); } })
            .catch(e => { if (e.name !== 'AbortError') console.error('[Canvas:proxy]', e.message); })
            .finally(() => setLoading(false));
    }, [templateFile, themeId]);

    // ────────────────────────────────────────────────────────────
    //  SECTION RENDERING API INJECT
    //  Used for:  settings save, visibility toggle
    //  Falls back to fetchFull if render API returns empty
    // ────────────────────────────────────────────────────────────
    const injectSection = useCallback(async (sectionType, blockId) => {
        if (!iframeReady.current) {
            console.log('[Canvas] iframe not ready — doing full reload instead');
            fetchFull();
            return;
        }
        const tParam = themeId ? `&themeId=${encodeURIComponent(themeId)}` : '';
        const url    = `/app/api/render-section?sectionId=${encodeURIComponent(sectionType)}&blockId=${encodeURIComponent(blockId)}${tParam}`;
        try {
            const res  = await fetch(url);
            const data = await res.json();
            if (data?.html && data.html.length > 50) {
                loadSection(blockId, data.html);
                console.log('[Canvas] ✅ Section injected via postMessage, length:', data.html.length);
            } else {
                console.warn('[Canvas] Render API returned empty → full reload');
                fetchFull();
            }
        } catch (e) {
            console.error('[Canvas] Render API error → full reload:', e.message);
            fetchFull();
        }
    }, [themeId, loadSection, fetchFull]);

    // ────────────────────────────────────────────────────────────
    //  REGISTER THE RELOAD CALLBACK
    //  Context calls this immediately when any server action completes.
    //  This is the zero-race-condition path.
    // ────────────────────────────────────────────────────────────
    useEffect(() => {
        registerPreviewReload(({ blockId, sectionType, isRemove, isStructural } = {}) => {
            if (isRemove && blockId) {
                // Remove section from DOM without reload
                removeSection(blockId);
                return;
            }
            if (isStructural) {
                // Structural change (inject/swap/reorder) — full reload
                setTimeout(() => fetchFull(), 300);
                return;
            }
            // Settings change — try smart inject, fall back to full reload
            if (sectionType && blockId) {
                injectSection(sectionType, blockId);
            } else {
                // No section metadata — full reload (safe fallback)
                fetchFull();
            }
        });
    }, [registerPreviewReload, injectSection, removeSection, fetchFull]);

    // ────────────────────────────────────────────────────────────
    //  INITIAL LOAD + TEMPLATE / THEME SWITCH
    // ────────────────────────────────────────────────────────────
    const prevTemplate = useRef(null);
    useEffect(() => {
        prevTemplate.current = templateFile;
        fetchFull();
        return () => abortRef.current?.abort();
    }, [templateFile, themeId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ────────────────────────────────────────────────────────────
    //  SIDEBAR CLICK → highlight section in iframe
    // ────────────────────────────────────────────────────────────
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

    const isMobile = device === 'mobile';
    const isSaving = fetcher?.state !== 'idle';

    const formatSectionName = (type) => (type || '').replace(/^cf[-_]/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f4f6f8', overflow: 'hidden', position: 'relative' }}>

            {/* Top loading bar */}
            {(loading || isSaving) && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 100,
                    background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)',
                    animation: 'cf-progress 1.4s ease-in-out infinite',
                }} />
            )}

            {/* Status bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '7px 0 5px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: '4px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    {/* Status dot */}
                    <span style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        background: isSaving ? '#f59e0b' : loading ? '#f59e0b' : '#22c55e',
                        boxShadow: isSaving || loading ? '0 0 0 3px rgba(245,158,11,0.2)' : '0 0 0 3px rgba(34,197,94,0.2)',
                        transition: 'background 0.3s',
                    }} />
                    <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {isSaving ? 'Saving…' : loading ? 'Loading preview…' : activeBlock ? `Editing: ${formatSectionName(activeBlock.type)}` : 'Live Preview'}
                    </span>
                </div>
                <button
                    onClick={() => fetchFull()}
                    title="Reload preview"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 11, color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: 16, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                    onMouseOver={e => { e.currentTarget.style.color = '#4f46e5'; e.currentTarget.style.borderColor = '#a5b4fc'; }}
                    onMouseOut={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                >
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" style={{ animation: loading ? 'cf-spin 0.8s linear infinite' : 'none' }}>
                        <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd"/>
                    </svg>
                    Reload
                </button>
            </div>

            {/* Preview wrapper */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 16px 16px', overflow: isMobile ? 'auto' : 'hidden' }}>
                <div style={{
                    width: isMobile ? 390 : '100%',
                    maxWidth: isMobile ? 390 : 1440,
                    height: '100%',
                    minHeight: isMobile ? 700 : undefined,
                    background: '#fff',
                    borderRadius: isMobile ? 40 : 10,
                    border: isMobile ? '10px solid #1a1a1a' : '1px solid #e5e7eb',
                    boxShadow: isMobile
                        ? '0 0 0 1.5px #3d3d3d, inset 0 0 0 1px #333, 0 30px 80px rgba(0,0,0,0.22)'
                        : '0 2px 16px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                    flexShrink: 0,
                }}>
                    {/* iPhone notch */}
                    {isMobile && (
                        <>
                            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 90, height: 24, background: '#1a1a1a', borderRadius: 12, zIndex: 99 }} />
                            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', width: 100, height: 4, background: '#333', borderRadius: 4, zIndex: 99 }} />
                        </>
                    )}

                    {/* Loading skeleton */}
                    {loading && !srcDoc && (
                        <div style={{ position: 'absolute', inset: 0, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 10, borderRadius: isMobile ? 32 : 0 }}>
                            <div style={{ width: 40, height: 40, border: '3px solid #f3f4f6', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'cf-spin 0.75s linear infinite' }} />
                            <div>
                                <p style={{ margin: 0, textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#374151', fontFamily: 'Inter, sans-serif' }}>Loading your live theme</p>
                                <p style={{ margin: '4px 0 0', textAlign: 'center', fontSize: 12, color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>Fetching real storefront…</p>
                            </div>
                        </div>
                    )}

                    {/* Saving overlay (subtle) */}
                    {isSaving && srcDoc && (
                        <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 50, background: 'rgba(79,70,229,0.92)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5, backdropFilter: 'blur(4px)', fontFamily: 'Inter, sans-serif' }}>
                            <div style={{ width: 10, height: 10, border: '1.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'cf-spin 0.6s linear infinite' }} />
                            Applying…
                        </div>
                    )}

                    {/* THE IFRAME */}
                    {srcDoc && (
                        <iframe
                            ref={iframeRef}
                            srcDoc={srcDoc}
                            title="Live theme preview"
                            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                display: 'block',
                                marginTop: isMobile ? 40 : 0,
                                height: isMobile ? 'calc(100% - 40px)' : '100%',
                            }}
                            onLoad={() => {
                                // Ensure section stays highlighted after iframe reloads
                                setTimeout(() => {
                                    if (selectedBlockId) selectSection(selectedBlockId);
                                }, 150);
                            }}
                        />
                    )}

                    {/* Empty / error state */}
                    {!srcDoc && !loading && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', gap: 12 }}>
                            <div style={{ width: 56, height: 56, background: '#fef2f2', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#374151', fontFamily: 'Inter, sans-serif' }}>Preview failed to load</p>
                                <p style={{ margin: '4px 0 12px', fontSize: 12, color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>Is your store password disabled?</p>
                            </div>
                            <button onClick={() => fetchFull()} style={{ padding: '8px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                                Try again
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes cf-spin     { to { transform: rotate(360deg); } }
                @keyframes cf-progress { 0%{width:0;left:0}55%{width:65%;left:15%}100%{width:0;left:100%} }
                @keyframes cf-fade-in  { from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none} }
            `}</style>
        </section>
    );
}
