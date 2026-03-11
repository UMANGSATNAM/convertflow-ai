import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useThemeEditor } from './ThemeEditorContext';
import { useIframeBridge } from './useIframeBridge';

/**
 * Canvas — renders the live Shopify storefront in an iframe.
 *
 * Architecture: fetch() + srcDoc (NOT <iframe src=...>)
 * ─────────────────────────────────────────────────────────
 * Using <iframe src="/app/api/storefront-proxy"> fails because:
 *   - Shopify admin already embeds the whole app in an iframe
 *   - Railway/Shopify adds X-Frame-Options that block nested iframes
 *   => "refused to connect"
 *
 * Solution: React fetch() the proxy (same session context),
 * get back { html } JSON, set as iframe srcDoc.
 *
 * Auto-reload: watches `lastSavedAt` from context — any successful
 * server action bumps this timestamp → triggers a fresh proxy fetch.
 */
export function Canvas() {
    const {
        blocks,
        settings,
        activeBlock,
        selectedBlockId,
        setSelectedBlockId,
        device,
        shop,
        templateFile,
        fetcher,
        lastSavedAt,
    } = useThemeEditor();

    const iframeRef = useRef(null);
    const [srcDoc, setSrcDoc] = useState('');
    const [loading, setLoading] = useState(true);
    const iframeReadyRef = useRef(false);
    const prevSelectedRef = useRef(null);
    const abortRef = useRef(null);

    // ── 1. Iframe Bridge ────────────────────────────────────────────────
    const handleIframeClick = useCallback((blockId) => {
        setSelectedBlockId(blockId);
    }, [setSelectedBlockId]);

    const handleIframeReady = useCallback(() => {
        iframeReadyRef.current = true;
    }, []);

    const { selectSection, deselectSection, reorderSections, loadSection, removeSection } =
        useIframeBridge(iframeRef, handleIframeClick, handleIframeReady);

    // ── 2. Fetch live storefront HTML via proxy ─────────────────────────
    const fetchPreview = useCallback(() => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        iframeReadyRef.current = false;

        const pageParam = templateFile?.includes('product') ? 'product' : 'home';
        const proxyUrl = `/app/api/storefront-proxy?page=${pageParam}&t=${Date.now()}`;

        fetch(proxyUrl, { signal: controller.signal })
            .then(res => {
                if (!res.ok) throw new Error(`Proxy ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (data?.html) setSrcDoc(data.html);
            })
            .catch(err => {
                if (err.name === 'AbortError') return;
                console.error('[Canvas] preview error:', err);
                setSrcDoc(`<html><body style="font-family:sans-serif;padding:40px;color:#555">
                  <h2>Preview error</h2><p>${err.message}</p></body></html>`);
            })
            .finally(() => setLoading(false));
    }, [templateFile]);

    // ── 3. Initial fetch ────────────────────────────────────────────────
    useEffect(() => {
        fetchPreview();
        return () => { if (abortRef.current) abortRef.current.abort(); };
    }, [templateFile]);

    // ── 4. Auto-reload when a section mutation completes ─────────────────
    // lastSavedAt is bumped by ThemeEditorContext on every ok:true response
    useEffect(() => {
        if (!lastSavedAt) return;
        // Small delay so Shopify's CDN edge cache has time to propagate the new JSON
        const t = setTimeout(fetchPreview, 600);
        return () => clearTimeout(t);
    }, [lastSavedAt]);

    // ── 5. Listen for client-side password auto-submit success ───────────
    useEffect(() => {
        const handler = (e) => {
            if (e.data?.type === 'CF_RELOAD_CANVAS') setTimeout(fetchPreview, 800);
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [fetchPreview]);

    // ── 6. Section select sync → postMessage ────────────────────────────
    useEffect(() => {
        if (!iframeReadyRef.current) return;
        if (selectedBlockId && selectedBlockId !== prevSelectedRef.current) {
            selectSection(selectedBlockId);
        } else if (!selectedBlockId && prevSelectedRef.current) {
            deselectSection();
        }
        prevSelectedRef.current = selectedBlockId;
    }, [selectedBlockId, selectSection, deselectSection]);

    // Detect if a save is in flight (show progress bar without blanking preview)
    const isSaving = fetcher.state !== 'idle';

    // ── Render ──────────────────────────────────────────────────────────
    return (
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f1f1f1', padding: '12px', overflow: 'hidden' }}>
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontFamily: '-apple-system, sans-serif' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                    {activeBlock ? `✏️ Editing: ${activeBlock.type}` : `🌐 Live Preview — ${shop || 'your store'}`}
                </span>
                <button
                    onClick={fetchPreview}
                    style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    title="Reload preview"
                >
                    ↺ Reload
                </button>
            </div>

            {/* Canvas frame */}
            <div style={{
                flex: 1,
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                position: 'relative',
                width: device === 'mobile' ? 400 : '100%',
                maxWidth: device === 'mobile' ? 400 : 'none',
                margin: device === 'mobile' ? '0 auto' : '0',
                transition: 'width 0.3s ease',
            }}>

                {/* ── Thin progress bar (saving / reloading) ──────────────
                    Stays on top of existing preview — no blank screen */}
                {(loading || isSaving) && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'cf-slide 1.2s linear infinite',
                        zIndex: 20,
                        borderRadius: '10px 10px 0 0',
                    }} />
                )}

                {/* Overlay message only on FIRST load (srcDoc is empty) */}
                {loading && !srcDoc && (
                    <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', zIndex: 10, gap: 12, fontFamily: '-apple-system, sans-serif',
                    }}>
                        <div style={{ fontSize: 36 }}>🔄</div>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>Loading live theme preview…</span>
                    </div>
                )}

                {/* Saving overlay (shows on top of existing preview — with opacity) */}
                {isSaving && srcDoc && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(255,255,255,0.25)',
                        zIndex: 9, pointerEvents: 'none',
                    }} />
                )}

                {srcDoc && (
                    <iframe
                        key={srcDoc.slice(0, 100)} // re-mount only when content fundamentally changes
                        ref={iframeRef}
                        srcDoc={srcDoc}
                        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
                        title="Live theme preview"
                        onLoad={() => {
                            // Re-select the active block after iframe reloads
                            if (selectedBlockId) {
                                setTimeout(() => selectSection(selectedBlockId), 300);
                            }
                        }}
                    />
                )}

                {!srcDoc && !loading && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif' }}>
                        <span style={{ fontSize: 13, color: '#9ca3af' }}>Preview not available</span>
                    </div>
                )}
            </div>

            {/* CSS animation for progress bar */}
            <style>{`
                @keyframes cf-slide {
                    0%   { background-position: 200% 0 }
                    100% { background-position: -200% 0 }
                }
            `}</style>
        </section>
    );
}
