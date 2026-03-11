import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useThemeEditor } from './ThemeEditorContext';
import { useIframeBridge } from './useIframeBridge';
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
    const prevSelectedRef = useRef(null);
    const iframeReadyRef = useRef(false);

    // ── 1. Setup OS 2.0 Iframe Bridge ──────────────────────────
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
    } = useIframeBridge(iframeRef, handleIframeClick, handleIframeReady);

    // ── 2. Create a stable key from blocks to detect ANY change ──
    const blocksKey = useMemo(() => 
        blocks.map(b => `${b.id}:${b.type}`).join('|'),
        [blocks]
    );

    // ── 3. Full HTML Preview Fetch ─────────────────────────────
    // Triggers on: mount, blocks change, preview template change
    useEffect(() => {
        setLoading(true);

        let blocksToSend = [...blocks];

        // Merge live settings for the active block
        if (activeBlock && settings && Object.keys(settings).length > 0) {
            const idx = blocksToSend.findIndex(b => b.id === activeBlock.id);
            if (idx !== -1) {
                blocksToSend[idx] = { ...blocksToSend[idx], settings: { ...blocksToSend[idx].settings, ...settings } };
            }
        }

        // Insert preview template if browsing library
        if (previewTemplateId && !activeBlock) {
            blocksToSend.push({
                id: 'preview-insert',
                type: previewTemplateId,
                settings: {}
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
                    iframeReadyRef.current = false;
                }
            })
            .catch(err => console.error('Preview fetch error:', err))
            .finally(() => setLoading(false));
    }, [blocksKey, previewTemplateId]); // blocksKey = stable serialized key of all blocks

    // ── 4. Debounced setting changes → re-fetch ────────────────
    useEffect(() => {
        if (!activeBlock || !settings || Object.keys(settings).length === 0) return;

        const timer = setTimeout(() => {
            setLoading(true);
            const blocksToSend = blocks.map(b => {
                if (b.id === activeBlock.id) {
                    return { ...b, settings: { ...b.settings, ...settings } };
                }
                return b;
            });

            const form = new FormData();
            form.append("blocks", JSON.stringify(blocksToSend));
            form.append("activeBlockId", activeBlock.id);

            fetch('/app/api/template-preview', { method: 'POST', body: form })
                .then(res => res.json())
                .then(data => {
                    if (data.html) {
                        setHtml(data.html);
                        iframeReadyRef.current = false;
                    }
                })
                .catch(err => console.error('Settings preview error:', err))
                .finally(() => setLoading(false));
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
