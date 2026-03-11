import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useThemeEditor } from './ThemeEditorContext';
import { useIframeBridge } from './useIframeBridge';
import { Spinner } from '@shopify/polaris';

/**
 * Canvas — renders the live Shopify storefront in an iframe.
 *
 * Architecture: fetch() + srcDoc (NOT <iframe src=...>)
 * ─────────────────────────────────────────────────────────
 * Using <iframe src="/app/api/storefront-proxy"> fails because:
 *   - Shopify admin already embeds the whole app in an iframe
 *   - Railway/Shopify adds X-Frame-Options headers that block nested iframes
 *   => "refused to connect" error
 *
 * Solution: React fetch() the proxy from the browser (same session context),
 * get back { html: "..." } JSON, and set that as iframe srcDoc.
 * srcDoc renders directly in the browser — no HTTP request, no CSP issue.
 */
export function Canvas() {
    const {
        blocks,
        settings,
        activeBlock,
        selectedBlockId,
        setSelectedBlockId,
        previewTemplateId,
        device,
        shop,
        templateFile,
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
        if (selectedBlockId) selectSection(selectedBlockId);
    }, [selectedBlockId]);

    const { selectSection, deselectSection, reorderSections, loadSection, removeSection } =
        useIframeBridge(iframeRef, handleIframeClick, handleIframeReady);

    // ── 2. Fetch live storefront HTML via the proxy ─────────────────────
    const fetchPreview = useCallback(() => {
        // Cancel any in-flight request
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        iframeReadyRef.current = false;

        const pageParam = templateFile?.includes('product') ? 'product' : 'home';
        const proxyUrl = `/app/api/storefront-proxy?page=${pageParam}&t=${Date.now()}`;

        fetch(proxyUrl, { signal: controller.signal })
            .then(res => {
                if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (data?.html) {
                    setSrcDoc(data.html);
                }
            })
            .catch(err => {
                if (err.name === 'AbortError') return;
                console.error('[Canvas] fetch preview error:', err);
                setSrcDoc(`<html><body style="font-family:sans-serif;padding:40px;color:#555">
                  <h2>Preview error</h2><p>${err.message}</p>
                </body></html>`);
            })
            .finally(() => setLoading(false));
    }, [templateFile]);

    // ── 3. Fetch on mount and template change ───────────────────────────
    useEffect(() => {
        fetchPreview();
        return () => { if (abortRef.current) abortRef.current.abort(); };
    }, [templateFile]);

    // ── 4. Section select sync → postMessage ────────────────────────────
    useEffect(() => {
        if (!iframeReadyRef.current) return;
        if (selectedBlockId && selectedBlockId !== prevSelectedRef.current) {
            selectSection(selectedBlockId);
        } else if (!selectedBlockId && prevSelectedRef.current) {
            deselectSection();
        }
        prevSelectedRef.current = selectedBlockId;
    }, [selectedBlockId, selectSection, deselectSection]);

    // ── Render ──────────────────────────────────────────────────────────
    return (
        <section className="flex-1 bg-polaris-bg p-4 overflow-hidden flex flex-col">
            <div className="pb-2 w-full max-w-5xl mx-auto flex items-center justify-between">
                <span className="text-xs text-polaris-subdued flex items-center gap-2">
                    {activeBlock
                        ? `Editing: ${activeBlock.type}`
                        : `Live Preview — ${shop || 'your store'}`}
                </span>
                <button
                    onClick={fetchPreview}
                    className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                    title="Reload preview"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>
                    Reload
                </button>
            </div>

            <div
                className={`flex-1 bg-white rounded-xl shadow-lg border border-polaris-border overflow-hidden relative mx-auto transition-all duration-300 ease-in-out ${device === 'mobile' ? 'w-[400px]' : 'w-full max-w-5xl'}`}
            >
                {loading && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-3">
                        <Spinner size="large" />
                        <span className="text-sm text-slate-500">Loading live theme preview…</span>
                    </div>
                )}

                {srcDoc && (
                    <iframe
                        ref={iframeRef}
                        srcDoc={srcDoc}
                        className="w-full h-full border-none"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        title="Live theme preview"
                    />
                )}

                {!srcDoc && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-polaris-bg">
                        <span className="text-sm text-slate-400">Preview not available</span>
                    </div>
                )}
            </div>
        </section>
    );
}
