import React, { useEffect, useRef, useState } from 'react';
import { EditorPostMessageBridge } from './architect/IframeBridge';

export function Canvas({ device, previewHtml, previewLoading, onBlockSelect, activeBlockId, sectionUpdate }) {
    const iframeRef = useRef(null);
    const [bridge, setBridge] = useState(null);
    
    // Initialize the PostMessage Bridge
    useEffect(() => {
        const newBridge = new EditorPostMessageBridge(iframeRef, onBlockSelect);
        newBridge.connect();
        setBridge(newBridge);

        return () => {
            newBridge.disconnect();
        };
    }, [onBlockSelect]);

    // Send selection updates to the iframe
    useEffect(() => {
        if (bridge) {
            if (activeBlockId) {
                // Ensure the bridge uses the legacy payload format until the Iframe script is fully updated
                bridge.sendMessageToIframe({ type: 'shopify:section:select', payload: { blockId: activeBlockId } });
            } else {
                bridge.sendMessageToIframe({ type: 'shopify:section:deselect' });
            }
        }
    }, [activeBlockId, previewHtml, bridge]); // resend if HTML reloads

    // Send targeted HTML block updates to the iframe
    useEffect(() => {
        if (bridge && sectionUpdate) {
            bridge.sendMessageToIframe({ 
                type: 'shopify:section:load', 
                payload: { blockId: sectionUpdate.blockId, html: sectionUpdate.html } 
            });
        }
    }, [sectionUpdate, bridge]);

    // Calculate dimensions based on selected device toggle
    const getDeviceDimensions = () => {
        switch (device) {
            case 'mobile': return { width: 375, height: 812 };
            case 'tablet': return { width: 768, height: 1024 };
            case 'desktop': 
            default: return { width: '100%', height: '100%' };
        }
    };

    const dims = getDeviceDimensions();

    return (
        <section style={{
            flex: 1, height: '100%',
            background: '#eef2ff', // Light blue-gray PageFly background
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            overflowY: 'auto', overflowX: 'hidden', padding: 20,
            position: 'relative'
        }}>
            {/* The responsive "Iframe" container */}
            <div style={{
                width: dims.width,
                minHeight: device !== 'desktop' ? dims.height : 'calc(100vh - 100px)',
                background: '#ffffff',
                boxShadow: device !== 'desktop' ? '0 10px 40px rgba(0,0,0,0.1)' : 'none',
                borderRadius: device !== 'desktop' ? 16 : 0,
                border: device !== 'desktop' ? '8px solid #f8fafc' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
            }}>
                
                {!previewHtml && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
                        <div style={{ width: 24, height: 24, border: '2px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <p style={{ marginTop: 16, color: '#6b7280', fontSize: 13, fontWeight: 500 }}>Loading visual canvas...</p>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                )}
                
                {previewLoading && previewHtml && (
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255, 255, 255, 0.4)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(1px)' }}>
                        <div style={{ width: 24, height: 24, border: '2px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    </div>
                )}
                
                {previewHtml && (
                    <iframe
                        ref={iframeRef}
                        srcDoc={previewHtml}
                        style={{ width: '100%', height: '100%', flex: 1, border: 'none', transition: 'opacity 0.2s', backgroundColor: '#fff', opacity: previewLoading ? 0.5 : 1 }}
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        title="Live Preview"
                    />
                )}

            </div>
        </section>
    );
}
