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
        <main style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'var(--p-color-bg-surface-secondary)',
            padding: '24px',
            overflow: 'hidden'
        }}>
            <div style={{ paddingBottom: '8px', width: device === 'mobile' ? 400 : '100%', maxWidth: 1200 }}>
                <Text variant="bodySm" tone="subdued">
                    {activeBlock ? activeBlock.type : (previewTemplateId ? 'Previewing template' : 'No element selected')}
                </Text>
            </div>

            <div style={{
                flex: 1,
                width: device === 'mobile' ? 400 : '100%',
                maxWidth: 1200,
                background: '#fff',
                borderRadius: '8px',
                boxShadow: 'var(--p-shadow-md)',
                border: '1px solid var(--p-color-border)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'width 0.3s ease'
            }}>

                {loading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <Spinner size="large" />
                    </div>
                )}

                {html ? (
                    <iframe
                        ref={iframeRef}
                        srcDoc={html}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        sandbox="allow-scripts allow-same-origin"
                    />
                ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Spinner size="large" />
                    </div>
                )}

            </div>
        </main>
    );
}
