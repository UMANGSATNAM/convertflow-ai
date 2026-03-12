import { useEffect, useRef, useCallback } from 'react';

// ── Parent → Iframe message types (Shopify OS 2.0 spec) ──────────
export const IFRAME_ACTIONS = {
    SECTION_SELECT:   'shopify:section:select',
    SECTION_DESELECT: 'shopify:section:deselect',
    SECTION_REORDER:  'shopify:section:reorder',
    SECTION_LOAD:     'shopify:section:load',
    SECTION_REMOVE:   'shopify:section:remove',
    BLOCK_SELECT:     'shopify:block:select',
    BLOCK_DESELECT:   'shopify:block:deselect',
};

// ── Iframe → Parent message types ────────────────────────────────
export const EDITOR_EVENTS = {
    SECTION_CLICKED: 'SECTION_CLICKED',
    IFRAME_READY:    'IFRAME_READY',
};

/**
 * useIframeBridge
 * Full OS 2.0 postMessage bridge: Parent (React) ↔ Child (Iframe)
 */
export function useIframeBridge(iframeRef, { onSectionClick, onIframeReady } = {}) {
    const isReady = useRef(false);

    // ── Send to iframe ────────────────────────────────────────────
    const dispatch = useCallback((type, payload = {}) => {
        try {
            const win = iframeRef.current?.contentWindow;
            if (win) win.postMessage({ type, payload }, '*');
        } catch (e) {
            console.warn('[IframeBridge] postMessage failed:', e.message);
        }
    }, [iframeRef]);

    // ── Convenience senders ───────────────────────────────────────
    const selectSection   = useCallback((blockId) => dispatch(IFRAME_ACTIONS.SECTION_SELECT, { blockId }), [dispatch]);
    const deselectSection = useCallback(() => dispatch(IFRAME_ACTIONS.SECTION_DESELECT, {}), [dispatch]);
    const selectBlock     = useCallback((blockId, sectionId) => dispatch(IFRAME_ACTIONS.BLOCK_SELECT, { blockId, sectionId }), [dispatch]);

    /**
     * loadSection - injects rendered HTML for a section without a full reload.
     * Equivalent to Shopify's shopify:section:load event.
     * @param {string} blockId - the section ID in the template (e.g. "cf-hero-1234")
     * @param {string} html    - the full rendered section HTML
     */
    const loadSection = useCallback((blockId, html) => {
        dispatch(IFRAME_ACTIONS.SECTION_LOAD, { blockId, html });
    }, [dispatch]);

    const removeSection = useCallback((blockId) => {
        dispatch(IFRAME_ACTIONS.SECTION_REMOVE, { blockId });
    }, [dispatch]);

    // ── Listen for messages from iframe ───────────────────────────
    useEffect(() => {
        const handler = (event) => {
            if (!event.data?.type) return;
            const { type, payload } = event.data;

            if (type === EDITOR_EVENTS.SECTION_CLICKED && payload?.blockId) {
                onSectionClick?.(payload.blockId);
            } else if (type === EDITOR_EVENTS.IFRAME_READY) {
                isReady.current = true;
                onIframeReady?.();
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [onSectionClick, onIframeReady]);

    return {
        selectSection,
        deselectSection,
        selectBlock,
        loadSection,
        removeSection,
        dispatch,
        isReady,
    };
}
