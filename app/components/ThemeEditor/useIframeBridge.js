import { useEffect, useRef, useCallback } from 'react';

// ── Parent → Iframe Actions (OS 2.0 Lifecycle) ──────────────────
export const IFRAME_ACTIONS = {
    SECTION_SELECT:   'shopify:section:select',
    SECTION_DESELECT: 'shopify:section:deselect',
    SECTION_REORDER:  'shopify:section:reorder',
    SECTION_LOAD:     'shopify:section:load',
    SECTION_REMOVE:   'shopify:section:remove',
    SETTING_UPDATE:   'shopify:setting:update',
};

// ── Iframe → Parent Events ──────────────────────────────────────
export const EDITOR_EVENTS = {
    SECTION_CLICKED: 'SECTION_CLICKED',
    IFRAME_READY:    'IFRAME_READY',
};

/**
 * useIframeBridge — Full OS 2.0 postMessage bridge
 * 
 * Parent (React app) ↔ Child (Preview Iframe)
 * Handles bidirectional communication for live editing.
 */
export function useIframeBridge(iframeRef, onSectionClick, onIframeReady) {
    const isReady = useRef(false);

    // ── Send message to Iframe ──────────────────────────────────
    const dispatchToIframe = useCallback((type, payload) => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
                { type, payload },
                '*'
            );
        }
    }, [iframeRef]);

    // ── Convenience dispatchers ─────────────────────────────────
    const selectSection = useCallback((blockId) => {
        dispatchToIframe(IFRAME_ACTIONS.SECTION_SELECT, { blockId });
    }, [dispatchToIframe]);

    const deselectSection = useCallback(() => {
        dispatchToIframe(IFRAME_ACTIONS.SECTION_DESELECT, {});
    }, [dispatchToIframe]);

    const reorderSections = useCallback((newOrder) => {
        dispatchToIframe(IFRAME_ACTIONS.SECTION_REORDER, { order: newOrder });
    }, [dispatchToIframe]);

    const updateSetting = useCallback((key, value) => {
        dispatchToIframe(IFRAME_ACTIONS.SETTING_UPDATE, { key, value });
    }, [dispatchToIframe]);

    const loadSection = useCallback((blockId, html) => {
        dispatchToIframe(IFRAME_ACTIONS.SECTION_LOAD, { blockId, html });
    }, [dispatchToIframe]);

    const removeSection = useCallback((blockId) => {
        dispatchToIframe(IFRAME_ACTIONS.SECTION_REMOVE, { blockId });
    }, [dispatchToIframe]);

    // ── Listen for messages from Iframe ─────────────────────────
    useEffect(() => {
        const handleMessage = (event) => {
            if (!event.data || !event.data.type) return;
            const { type, payload } = event.data;

            switch (type) {
                case EDITOR_EVENTS.SECTION_CLICKED:
                    if (onSectionClick && payload?.blockId) {
                        onSectionClick(payload.blockId);
                    }
                    break;
                case EDITOR_EVENTS.IFRAME_READY:
                    isReady.current = true;
                    if (onIframeReady) onIframeReady();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onSectionClick, onIframeReady]);

    return {
        dispatchToIframe,
        selectSection,
        deselectSection,
        reorderSections,
        updateSetting,
        loadSection,
        removeSection,
        isReady: isReady.current,
    };
}
