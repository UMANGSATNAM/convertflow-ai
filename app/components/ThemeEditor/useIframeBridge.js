import { useEffect, useRef, useCallback } from 'react';

// Editor -> Iframe Actions
export const IFRAME_ACTIONS = {
    SELECT_SECTION: 'SELECT_SECTION',
    UPDATE_SETTING: 'UPDATE_SETTING',
    SCROLL_TO_SECTION: 'SCROLL_TO_SECTION',
    RELOAD_HTML: 'RELOAD_HTML',
};

// Iframe -> Editor Events
export const EDITOR_EVENTS = {
    SECTION_CLICKED: 'SECTION_CLICKED',
    IFRAME_READY: 'IFRAME_READY',
};

export function useIframeBridge(iframeRef, onSectionClick, onIframeReady) {
    const isReady = useRef(false);

    // Send message to Iframe
    const dispatchToIframe = useCallback((type, payload) => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
                { type, payload },
                '*' // In production, restrict to app origin
            );
        }
    }, [iframeRef]);

    // Listen for messages from Iframe
    useEffect(() => {
        const handleMessage = (event) => {
            const { type, payload } = event.data;

            switch (type) {
                case EDITOR_EVENTS.SECTION_CLICKED:
                    if (onSectionClick) onSectionClick(payload.blockId);
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

    return { dispatchToIframe, isReady: isReady.current };
}
