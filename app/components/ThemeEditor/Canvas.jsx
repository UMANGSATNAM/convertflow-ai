import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useThemeEditor } from './ThemeEditorContext';

/**
 * Canvas — shows the live Shopify storefront in an iframe.
 *
 * Architecture: DIRECT IFRAME (no proxy, no srcDoc)
 * ─────────────────────────────────────────────────────────────────────
 * URL: https://SHOP/?preview_theme_id=THEME_ID
 *
 * Why this works:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  The browser naturally includes the user's .myshopify.com       │
 * │  admin session cookies in the iframe request.                   │
 * │  Shopify's ?preview_theme_id bypasses the storefront password   │
 * │  for authenticated admin sessions — exactly like Shopify's own  │
 * │  theme editor does.                                             │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Auto-reload: watches lastSavedAt from context. After any section
 * mutation succeeds, the themeId + timestamp makes a new src URL,
 * which forces the iframe to reload — showing the updated theme.
 *
 * Cross-origin note: We can't inject a bridge script into the iframe
 * (cross-origin restriction). Section selection highlighting is done
 * via sidebar only. A full bridge requires a Shopify App Extension.
 */
export function Canvas() {
    const {
        activeBlock,
        selectedBlockId,
        device,
        shop,
        templateFile,
        themeId,
        lastSavedAt,
        fetcher,
    } = useThemeEditor();

    const iframeRef = useRef(null);
    const [iframeKey, setIframeKey] = useState(0);
    const [loading, setLoading] = useState(true);

    // ── Build the preview URL ───────────────────────────────────────────
    // ?preview_theme_id tells Shopify which theme to render
    // ?_fd=0 disables the storefront password check for admin sessions
    const previewUrl = shop && themeId
        ? `https://${shop}/?preview_theme_id=${themeId}&_fd=0`
        : null;

    // ── Auto-reload after any section mutation ────────────────────────
    useEffect(() => {
        if (!lastSavedAt) return;
        // Force iframe to reload by bumping the key (remounts <iframe>)
        const t = setTimeout(() => {
            setLoading(true);
            setIframeKey(k => k + 1);
        }, 800); // give Shopify CDN 800ms to propagate the JSON change
        return () => clearTimeout(t);
    }, [lastSavedAt]);

    const isSaving = fetcher?.state !== 'idle';

    // Determine the page-specific URL
    const pageUrl = previewUrl
        ? templateFile?.includes('product')
            ? previewUrl.replace('/?', '/products?')
            : previewUrl
        : null;

    return (
        <section style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#f1f1f1',
            padding: '12px',
            overflow: 'hidden',
        }}>
            {/* Top bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                fontFamily: '-apple-system, sans-serif',
            }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                    {activeBlock
                        ? `✏️ Editing: ${activeBlock.type}`
                        : pageUrl
                            ? `🌐 Live Preview — ${shop}`
                            : 'Loading…'}
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {pageUrl && (
                        <a
                            href={pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 11, color: '#2563eb', textDecoration: 'none' }}
                            title="Open in new tab"
                        >
                            ↗ Open
                        </a>
                    )}
                    <button
                        onClick={() => { setLoading(true); setIframeKey(k => k + 1); }}
                        style={{
                            fontSize: 11, color: '#2563eb', background: 'none',
                            border: 'none', cursor: 'pointer',
                        }}
                        title="Reload preview"
                    >
                        ↺ Reload
                    </button>
                </div>
            </div>

            {/* iframe wrapper */}
            <div style={{
                flex: 1,
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                position: 'relative',
                width: device === 'mobile' ? 400 : '100%',
                maxWidth: device === 'mobile' ? 400 : 'none',
                margin: device === 'mobile' ? '0 auto' : '0',
                transition: 'width 0.3s ease',
            }}>
                {/* Progress bar — visible while loading or saving */}
                {(loading || isSaving) && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'cf-slide 1.2s linear infinite',
                        zIndex: 20,
                        borderRadius: '10px 10px 0 0',
                    }} />
                )}

                {pageUrl ? (
                    <iframe
                        key={iframeKey}
                        ref={iframeRef}
                        src={pageUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            display: 'block',
                            opacity: loading ? 0.5 : 1,
                            transition: 'opacity 0.3s ease',
                        }}
                        title="Live theme preview"
                        onLoad={() => setLoading(false)}
                        onError={() => setLoading(false)}
                        // No sandbox — browser cookies must flow freely for admin bypass
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                ) : (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        fontFamily: '-apple-system, sans-serif', gap: 8,
                    }}>
                        <div style={{ fontSize: 32 }}>🔄</div>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>
                            Connecting to your store…
                        </span>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes cf-slide {
                    0%   { background-position: 200% 0 }
                    100% { background-position: -200% 0 }
                }
            `}</style>
        </section>
    );
}
