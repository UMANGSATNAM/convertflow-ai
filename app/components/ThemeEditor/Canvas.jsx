import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useThemeEditor } from './ThemeEditorContext';
import { useIframeBridge, EDITOR_EVENTS } from './useIframeBridge';
import { Text, Spinner } from '@shopify/polaris';

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

    // 1. Setup Typed Iframe Bridge
    const handleIframeClick = (blockId) => {
        setSelectedBlockId(blockId);
    };

    const { dispatchToIframe, isReady } = useIframeBridge(
        iframeRef,
        handleIframeClick,
        () => console.log("Iframe connected to Editor Bridge")
    );

    // 2. Debounced Live Preview Generator
    // Uses 300ms debounce to prevent freezing the UI when typing fast in Settings
    useEffect(() => {
        setLoading(true);

        // Construct payload
        let blocksToSend = [...blocks];

        // Merge live typing settings
        if (activeBlock && settings) {
            const idx = blocksToSend.findIndex(b => b.id === activeBlock.id);
            if (idx !== -1) {
                blocksToSend[idx] = { ...blocksToSend[idx], settings: { ...settings } };
            }
        }

        // Temporarily insert a preview template if browsing library
        if (previewTemplateId && !activeBlock) {
            blocksToSend.push({
                id: 'preview-insert',
                type: previewTemplateId,
                settings: { ...settings }
            });
        }

        const timer = setTimeout(() => {
            const form = new FormData();
            form.append("blocks", JSON.stringify(blocksToSend));
            if (activeBlock) form.append("activeBlockId", activeBlock.id);
            else if (previewTemplateId) form.append("activeBlockId", "preview-insert");

            fetch('/app/api/template-preview', { method: 'POST', body: form })
                .then(res => res.json())
                .then(data => {
                    if (data.html) setHtml(data.html);
                })
                .finally(() => setLoading(false));
        }, 300); // 300ms Debounce

        return () => clearTimeout(timer);
    }, [blocks, settings, activeBlock, previewTemplateId]);

    return (
        <section className="flex-1 bg-polaris-bg p-6 overflow-hidden flex flex-col">
            
            <div className="pb-2 w-full max-w-5xl mx-auto flex items-center justify-between">
                <Text variant="bodySm" tone="subdued">
                    {activeBlock ? `Editing: ${activeBlock.type}` : (previewTemplateId ? 'Previewing template' : 'Live Preview')}
                </Text>
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
