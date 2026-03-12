import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useThemeEditor } from './ThemeEditorContext';
import { useIframeBridge } from './useIframeBridge';

export function Canvas() {
    const {
        activeBlock, selectedBlockId, setSelectedBlockId,
        device, shop, templateFile, themeId, lastSavedAt, fetcher,
    } = useThemeEditor();

    const iframeRef = useRef(null);
    const [srcDoc, setSrcDoc] = useState('');
    const [loading, setLoading] = useState(true);
    const iframeReadyRef = useRef(false);
    const abortRef = useRef(null);

    const handleIframeClick = useCallback((blockId) => setSelectedBlockId(blockId), [setSelectedBlockId]);
    const handleIframeReady = useCallback(() => { iframeReadyRef.current = true; }, []);
    const { selectSection, deselectSection } = useIframeBridge(iframeRef, handleIframeClick, handleIframeReady);

    const fetchPreview = useCallback(() => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true);
        iframeReadyRef.current = false;

        const pageParam = templateFile?.includes('product') ? 'product' : 'home';
        const themeParam = themeId ? `&themeId=${encodeURIComponent(themeId)}` : '';
        const proxyUrl = `/app/api/storefront-proxy?page=${pageParam}${themeParam}&t=${Date.now()}`;

        fetch(proxyUrl, { signal: controller.signal })
            .then(r => { if (!r.ok) throw new Error(`Proxy ${r.status}`); return r.json(); })
            .then(data => { if (data?.html) setSrcDoc(data.html); })
            .catch(err => { if (err.name !== 'AbortError') console.error('[Canvas]', err); })
            .finally(() => setLoading(false));
    }, [templateFile, themeId]);

    useEffect(() => { fetchPreview(); return () => abortRef.current?.abort(); }, [templateFile, themeId]);
    useEffect(() => { if (!lastSavedAt) return; const t = setTimeout(fetchPreview, 800); return () => clearTimeout(t); }, [lastSavedAt]);

    const prevSelectedRef = useRef(null);
    useEffect(() => {
        if (!iframeReadyRef.current) return;
        if (selectedBlockId && selectedBlockId !== prevSelectedRef.current) selectSection(selectedBlockId);
        else if (!selectedBlockId && prevSelectedRef.current) deselectSection();
        prevSelectedRef.current = selectedBlockId;
    }, [selectedBlockId, selectSection, deselectSection]);

    const isSaving = fetcher?.state !== 'idle';
    const isMobile = device === 'mobile';

    return (
        <section style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#f4f6f8',
            overflow: 'hidden',
            position: 'relative',
        }}>
            {/* Top loading progress bar */}
            {(loading || isSaving) && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 50,
                    background: '#005bd3',
                    animation: 'shopify-progress 1.8s ease-in-out infinite',
                }} />
            )}

            {/* Preview label */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0 4px', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#6d7175', background: '#ebebeb', padding: '2px 8px', borderRadius: 8 }}>
                    {loading ? 'Loading preview...' : `Live Preview${activeBlock ? ` — Editing ${activeBlock.type}` : ''}`}
                </span>
                <button
                    onClick={fetchPreview}
                    title="Reload preview"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4, color: '#6d7175' }}
                    onMouseOver={e => e.currentTarget.style.background = '#e4e5e7'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" /></svg>
                </button>
            </div>

            {/* Canvas wrapper */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 12px 12px', overflow: 'hidden' }}>
                <div style={{
                    width: isMobile ? 390 : '100%',
                    maxWidth: isMobile ? 390 : '100%',
                    background: '#fff',
                    borderRadius: isMobile ? 20 : 8,
                    border: isMobile ? '12px solid #303030' : '1px solid #c9cccf',
                    boxShadow: isMobile ? '0 8px 32px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'width 0.3s ease, border-radius 0.3s ease',
                    flexShrink: 0,
                }}>
                    {/* Loading overlay for first load */}
                    {loading && !srcDoc && (
                        <div style={{ position: 'absolute', inset: 0, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 10 }}>
                            <div style={{ width: 32, height: 32, border: '2.5px solid #ebebeb', borderTopColor: '#005bd3', borderRadius: '50%', animation: 'shopify-spin 0.7s linear infinite' }} />
                            <span style={{ fontSize: 12, color: '#6d7175' }}>Loading live preview…</span>
                        </div>
                    )}

                    {srcDoc && (
                        <iframe
                            ref={iframeRef}
                            srcDoc={srcDoc}
                            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                            title="Live theme preview"
                            onLoad={() => { if (selectedBlockId) setTimeout(() => selectSection(selectedBlockId), 300); }}
                        />
                    )}

                    {!srcDoc && !loading && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 13, color: '#8c9196' }}>Preview unavailable</span>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes shopify-spin { to { transform: rotate(360deg); } }
                @keyframes shopify-progress {
                    0% { opacity: 1; width: 0%; left: 0; }
                    50% { opacity: 1; width: 60%; left: 20%; }
                    100% { opacity: 0; width: 100%; left: 0; }
                }
            `}</style>
        </section>
    );
}
