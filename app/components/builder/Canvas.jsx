import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EditorPostMessageBridge } from './architect/IframeBridge';

/**
 * Canvas — Real Store Preview
 * 
 * Shows the merchant's ACTUAL storefront inside an iframe using Shopify's
 * preview_theme_id parameter. This is exactly how the native Shopify Theme
 * Editor works. No fake HTML. No generated preview. Real store, real data.
 */
export function Canvas({ device, shop, themeId, onBlockSelect, activeBlockId, onBridgeReady, iframeKey }) {
    const iframeRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [bridge, setBridge] = useState(null);

    // Build the real storefront preview URL (same technique Shopify uses)
    const previewUrl = shop && themeId
        ? `https://${shop}?preview_theme_id=${themeId}`
        : null;

    // Initialize the PostMessage Bridge
    useEffect(() => {
        const newBridge = new EditorPostMessageBridge(iframeRef, onBlockSelect);
        newBridge.connect();
        setBridge(newBridge);
        if (onBridgeReady) onBridgeReady(newBridge);

        return () => { newBridge.disconnect(); };
    }, [onBlockSelect]);

    // When a block is selected in the sidebar, scroll to + highlight it in the iframe
    useEffect(() => {
        if (!bridge) return;
        if (activeBlockId) {
            bridge.sendMessageToIframe({
                type: 'shopify:section:select',
                detail: { sectionId: activeBlockId }
            });
        } else {
            bridge.sendMessageToIframe({ type: 'shopify:section:deselect' });
        }
    }, [activeBlockId, bridge]);

    // Device dimensions
    const dims = {
        mobile: { width: 390, height: 844, radius: 40, border: '10px solid #1a1a2e' },
        tablet: { width: 820, height: 1180, radius: 20, border: '8px solid #1a1a2e' },
        desktop: { width: '100%', height: '100%', radius: 0, border: 'none' },
    }[device] || { width: '100%', height: '100%', radius: 0, border: 'none' };

    return (
        <section style={{
            flex: 1, height: '100%',
            background: device === 'desktop' ? '#f1f3f5' : '#2d2d2d',
            display: 'flex', alignItems: device === 'desktop' ? 'stretch' : 'center',
            justifyContent: 'center',
            overflowY: 'auto', overflowX: 'hidden',
            padding: device === 'desktop' ? 0 : 32,
            position: 'relative',
            transition: 'background 0.3s'
        }}>
            <div style={{
                width: dims.width,
                height: device !== 'desktop' ? dims.height : '100%',
                minHeight: device === 'desktop' ? '100%' : undefined,
                background: '#ffffff',
                boxShadow: device !== 'desktop' ? '0 24px 80px rgba(0,0,0,0.4)' : 'none',
                borderRadius: dims.radius,
                border: dims.border,
                overflow: 'hidden',
                position: 'relative',
                flexShrink: 0,
                transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                display: 'flex', flexDirection: 'column',
            }}>
                {/* Loading overlay */}
                {loading && (
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 10,
                        background: '#fff', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 16
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            border: '3px solid #e5e7eb', borderTopColor: '#5c6ac4',
                            animation: 'spin 0.8s linear infinite'
                        }}/>
                        <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>Loading store preview…</p>
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </div>
                )}

                {/* No store configured */}
                {!previewUrl && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                        <p style={{ color: '#9ca3af', marginTop: 16, fontSize: 14 }}>Store preview unavailable</p>
                    </div>
                )}

                {/* THE REAL STORE IFRAME */}
                {previewUrl && (
                    <iframe
                        key={iframeKey}
                        ref={iframeRef}
                        src={previewUrl}
                        style={{
                            width: '100%', flex: 1, border: 'none',
                            opacity: loading ? 0 : 1,
                            transition: 'opacity 0.4s ease',
                        }}
                        onLoad={() => setLoading(false)}
                        title="Live Store Preview"
                        allow="same-origin"
                    />
                )}
            </div>
        </section>
    );
}
