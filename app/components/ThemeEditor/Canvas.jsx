import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useThemeEditor } from './ThemeEditorContext';
import { useIframeBridge, IFRAME_ACTIONS } from './useIframeBridge';
import { Spinner } from '@shopify/polaris';

export function Canvas() {
    const {
        blocks,
        settings,
        activeBlock,
        selectedBlockId,
        setSelectedBlockId,
        previewTemplateId,
        device
    } = useThemeEditor();

    const iframeRef = useRef(null);
    const [html, setHtml] = useState('');
    const [loading, setLoading] = useState(false);
    const prevBlocksLengthRef = useRef(0);
    const prevSelectedRef = useRef(null);
    const iframeReadyRef = useRef(false);

    // ── 1. Setup OS 2.0 Iframe Bridge ──────────────────────────
    const handleIframeClick = useCallback((blockId) => {
        setSelectedBlockId(blockId);
    }, [setSelectedBlockId]);

    const handleIframeReady = useCallback(() => {
        iframeReadyRef.current = true;
        // Highlight the active section if one is selected
        if (selectedBlockId) {
            selectSection(selectedBlockId);
        }
    }, [selectedBlockId]);

    const {
        selectSection,
        deselectSection,
        reorderSections: reorderIframe,
        updateSetting,
        removeSection: removeIframeSection,
    } = useIframeBridge(iframeRef, handleIframeClick, handleIframeReady);

    // ── 2. Full HTML Fetch (only on mount, add, or remove) ─────
    const fetchFullPreview = useCallback(() => {
        setLoading(true);

        let blocksToSend = [...blocks];

        // Merge live settings for the active block
        if (activeBlock && settings) {
            const idx = blocksToSend.findIndex(b => b.id === activeBlock.id);
            if (idx !== -1) {
                blocksToSend[idx] = { ...blocksToSend[idx], settings: { ...settings } };
            }
        }

        // Insert preview template if browsing library
        if (previewTemplateId && !activeBlock) {
            blocksToSend.push({
                id: 'preview-insert',
                type: previewTemplateId,
                settings: { ...settings }
            });
        }

        const form = new FormData();
        form.append("blocks", JSON.stringify(blocksToSend));
        if (activeBlock) form.append("activeBlockId", activeBlock.id);
        else if (previewTemplateId) form.append("activeBlockId", "preview-insert");

        fetch('/app/api/template-preview', { method: 'POST', body: form })
            .then(res => res.json())
            .then(data => {
                if (data.html) {
                    setHtml(data.html);
                    iframeReadyRef.current = false; // Reset — new srcDoc will re-init
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [blocks, settings, activeBlock, previewTemplateId]);

    // ── 3. Trigger full re-fetch when blocks change structurally ──
    useEffect(() => {
        const currentLen = blocks.length;
        // Always fetch on mount, or when sections are added/removed
        fetchFullPreview();
        prevBlocksLengthRef.current = currentLen;
    }, [blocks.length, previewTemplateId]);

    // ── 4. Debounced setting changes → re-fetch (for now) ──────
    // Future: use postMessage for CSS variable injection only
    useEffect(() => {
        if (!activeBlock || !settings || Object.keys(settings).length === 0) return;

        const timer = setTimeout(() => {
            fetchFullPreview();
        }, 400);

        return () => clearTimeout(timer);
    }, [settings]);

    // ── 5. Section select sync → postMessage to iframe ─────────
    useEffect(() => {
        if (!iframeReadyRef.current) return;
        
        if (selectedBlockId && selectedBlockId !== prevSelectedRef.current) {
            selectSection(selectedBlockId);
        } else if (!selectedBlockId && prevSelectedRef.current) {
            deselectSection();
        }
        prevSelectedRef.current = selectedBlockId;
    }, [selectedBlockId, selectSection, deselectSection]);

    // ── 6. Reorder sync → postMessage to iframe ────────────────
    useEffect(() => {
        if (!iframeReadyRef.current) return;
        const order = blocks.map(b => b.id);
        reorderIframe(order);
    }, [blocks.map(b => b.id).join(',')]);

    // ── Render ─────────────────────────────────────────────────
    return (
        <section className="flex-1 bg-polaris-bg p-6 overflow-hidden flex flex-col">
            <div className="pb-2 w-full max-w-5xl mx-auto flex items-center justify-between">
                <span className="text-xs text-polaris-subdued">
                    {activeBlock ? `Editing: ${activeBlock.type}` : (previewTemplateId ? 'Previewing template' : 'Live Preview')}
                </span>
            </div>

            <div 
                className={`flex-1 bg-white rounded-xl shadow-lg border border-polaris-border overflow-hidden relative mx-auto transition-all duration-300 ease-in-out ${device === 'mobile' ? 'w-[400px]' : 'w-full max-w-5xl'}`}
            >
                {loading && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-10">
                        <Spinner size="large" />
                    </div>
                )}

                {html ? (
                    <iframe
                        ref={iframeRef}
                        srcDoc={html}
                        className="w-full h-full border-none"
                        sandbox="allow-scripts allow-same-origin allow-popups"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-polaris-bg">
                        <Spinner size="large" />
                    </div>
                )}
            </div>
        </section>
    );
}
