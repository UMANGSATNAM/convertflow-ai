import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useThemeEditor } from './ThemeEditorContext';
import { useIframeBridge } from './useIframeBridge';
import { Spinner } from '@shopify/polaris';

/**
 * Canvas – renders the live Shopify storefront inside an iframe via the
 * server-side storefront proxy. The proxy:
 *   1. Fetches the real storefront HTML (Dawn, etc.)
 *   2. Rewrites asset URLs to absolute
 *   3. Injects the ConvertFlow editor bridge script
 *
 * CF sections are injected/removed/reordered by posting messages TO the
 * iframe via useIframeBridge (same as before).
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
    const [loading, setLoading] = useState(true);
    const [proxyUrl, setProxyUrl] = useState('');
    const iframeReadyRef = useRef(false);
    const prevSelectedRef = useRef(null);

    // ── 1. Setup OS 2.0 Iframe Bridge ─────────────────────────────────
    const handleIframeClick = useCallback((blockId) => {
        setSelectedBlockId(blockId);
    }, [setSelectedBlockId]);

    const handleIframeReady = useCallback(() => {
        iframeReadyRef.current = true;
        if (selectedBlockId) {
            selectSection(selectedBlockId);
        }
    }, [selectedBlockId]);

    const {
        selectSection,
        deselectSection,
        reorderSections: reorderIframe,
        loadSection: injectSection,
        removeSection,
    } = useIframeBridge(iframeRef, handleIframeClick, handleIframeReady);

    // ── 2. Build the proxy URL ─────────────────────────────────────────
    useEffect(() => {
        // Map templateFile to page param
        const pageParam = templateFile?.includes('product') ? 'product' : 'home';
        // Pass shop so the proxy knows which storefront to fetch (no admin auth needed)
        const shopParam = shop ? `&shop=${encodeURIComponent(shop)}` : '';
        const url = `/app/api/storefront-proxy?page=${pageParam}${shopParam}&t=${Date.now()}`;
        setProxyUrl(url);
        setLoading(true);
        iframeReadyRef.current = false;
    }, [templateFile]);

    // ── 3. When iframe loads → inject CF sections on top ──────────────
    const handleLoad = useCallback(() => {
        setLoading(false);
        iframeReadyRef.current = true;

        // Inject all CF blocks that are in the current blocks list
        // (native Dawn sections are already in the live HTML)
        if (iframeRef.current) {
            blocks.forEach(block => {
                if (block.isCf && block.cfHtml) {
                    injectSection?.(block.id, block.cfHtml);
                }
            });
        }

        if (selectedBlockId) {
            selectSection(selectedBlockId);
        }
    }, [blocks, injectSection, selectSection, selectedBlockId]);

    // ── 4. Section select sync → postMessage to iframe ─────────────────
    useEffect(() => {
        if (!iframeReadyRef.current) return;
        if (selectedBlockId && selectedBlockId !== prevSelectedRef.current) {
            selectSection(selectedBlockId);
        } else if (!selectedBlockId && prevSelectedRef.current) {
            deselectSection();
        }
        prevSelectedRef.current = selectedBlockId;
    }, [selectedBlockId, selectSection, deselectSection]);

    // ── Render ─────────────────────────────────────────────────────────
    return (
        <section className="flex-1 bg-polaris-bg p-4 overflow-hidden flex flex-col">
            <div className="pb-2 w-full max-w-5xl mx-auto flex items-center justify-between">
                <span className="text-xs text-polaris-subdued">
                    {activeBlock
                        ? `Editing: ${activeBlock.type}`
                        : previewTemplateId
                            ? 'Previewing template'
                            : 'Live Preview — ' + (shop || 'your store')}
                </span>
                {loading && (
                    <span className="text-xs text-polaris-subdued flex items-center gap-1">
                        <Spinner size="small" /> Loading...
                    </span>
                )}
            </div>

            <div
                className={`flex-1 bg-white rounded-xl shadow-lg border border-polaris-border overflow-hidden relative mx-auto transition-all duration-300 ease-in-out ${device === 'mobile' ? 'w-[400px]' : 'w-full max-w-5xl'}`}
            >
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-3">
                        <Spinner size="large" />
                        <span className="text-sm text-slate-500">Loading live theme preview…</span>
                    </div>
                )}

                {proxyUrl && (
                    <iframe
                        key={proxyUrl}
                        ref={iframeRef}
                        src={proxyUrl}
                        className="w-full h-full border-none"
                        onLoad={handleLoad}
                        // allow-same-origin + allow-scripts needed for postMessage bridge
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        title="Live theme preview"
                    />
                )}
            </div>
        </section>
    );
}
