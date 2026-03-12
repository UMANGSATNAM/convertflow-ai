import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useThemeEditor } from './ThemeEditorContext';
import { useIframeBridge } from './useIframeBridge';

/**
 * Canvas — live Shopify storefront preview via fetch() + srcDoc.
 *
 * Why fetch+srcDoc (not <iframe src>):
 *   Both clothingwaley.myshopify.com and our Railway app have
 *   X-Frame-Options that block cross-origin iframing.
 *   Solution: React fetches the proxy on the server (auth included),
 *   gets { html } back, and sets it as iframe srcDoc — no HTTP request
 *   from the iframe, no CSP issue, bridge script works perfectly.
 */
export function Canvas() {
    const {
        activeBlock,
        selectedBlockId,
        setSelectedBlockId,
        device,
        shop,
        templateFile,
        themeId,
        lastSavedAt,
        fetcher,
    } = useThemeEditor();

    const iframeRef = useRef(null);
    const [srcDoc, setSrcDoc] = useState('');
    const [loading, setLoading] = useState(true);
    const iframeReadyRef = useRef(false);
    const abortRef = useRef(null);

    // ── Iframe bridge ────────────────────────────────────────────────
    const handleIframeClick = useCallback((blockId) => setSelectedBlockId(blockId), [setSelectedBlockId]);
    const handleIframeReady = useCallback(() => { iframeReadyRef.current = true; }, []);
    const { selectSection, deselectSection } = useIframeBridge(iframeRef, handleIframeClick, handleIframeReady);

    // ── Fetch proxy ──────────────────────────────────────────────────
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
            .catch(err => {
                if (err.name === 'AbortError') return;
                console.error('[Canvas] error:', err);
            })
            .finally(() => setLoading(false));
    }, [templateFile, themeId]);

    // ── Fetch on mount / template change ─────────────────────────────
    useEffect(() => {
        fetchPreview();
        return () => abortRef.current?.abort();
    }, [templateFile, themeId]);

    // ── Auto-reload after any section mutation ────────────────────────
    useEffect(() => {
        if (!lastSavedAt) return;
        const t = setTimeout(fetchPreview, 800);
        return () => clearTimeout(t);
    }, [lastSavedAt]);

    // ── Section highlight sync ────────────────────────────────────────
    const prevSelectedRef = useRef(null);
    useEffect(() => {
        if (!iframeReadyRef.current) return;
        if (selectedBlockId && selectedBlockId !== prevSelectedRef.current) selectSection(selectedBlockId);
        else if (!selectedBlockId && prevSelectedRef.current) deselectSection();
        prevSelectedRef.current = selectedBlockId;
    }, [selectedBlockId, selectSection, deselectSection]);

    const isSaving = fetcher?.state !== 'idle';

    return (
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f1f1f1', padding: '12px', overflow: 'hidden' }}>
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontFamily: '-apple-system, sans-serif' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                    {activeBlock ? `✏️ Editing: ${activeBlock.type}` : `🌐 Live Preview — ${shop || ''}`}
                </span>
                <button onClick={fetchPreview} style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>
                    ↺ Reload
                </button>
            </div>

            {/* Canvas frame */}
            <div style={{
                flex: 1, background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb',
                overflow: 'hidden', position: 'relative',
                width: device === 'mobile' ? 400 : '100%',
                maxWidth: device === 'mobile' ? 400 : 'none',
                margin: device === 'mobile' ? '0 auto' : '0',
                transition: 'width 0.3s ease',
            }}>
                {/* Thin progress bar */}
                {(loading || isSaving) && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 20,
                        background: 'linear-gradient(90deg,#2563eb 0%,#7c3aed 50%,#2563eb 100%)',
                        backgroundSize: '200% 100%', animation: 'cf-slide 1.2s linear infinite',
                        borderRadius: '10px 10px 0 0',
                    }} />
                )}

                {/* First-load overlay */}
                {loading && !srcDoc && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, gap: 12, fontFamily: '-apple-system, sans-serif' }}>
                        <div style={{ fontSize: 36 }}>🔄</div>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>Loading live preview…</span>
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
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif' }}>
                        <span style={{ fontSize: 13, color: '#9ca3af' }}>Preview not available</span>
                    </div>
                )}
            </div>

            <style>{`@keyframes cf-slide{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </section>
    );
}
