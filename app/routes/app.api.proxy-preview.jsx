import { authenticate } from "../shopify.server";

/**
 * Store Preview Proxy
 * 
 * GET /app/api/proxy-preview?themeId=THEME_ID
 * 
 * Fetches the merchant's real storefront server-side (bypassing X-Frame-Options),
 * rewrites all relative URLs to absolute, removes framing restriction headers,
 * and serves the HTML so our Canvas iframe can load it.
 * 
 * This is the standard approach used by PageFly, GemPages, Shogun, etc.
 */
export async function loader({ request }) {
    const { session } = await authenticate.admin(request);
    const { shop, accessToken } = session;

    const url = new URL(request.url);
    const themeId = url.searchParams.get("themeId");
    const path = url.searchParams.get("path") || "/";

    if (!themeId) {
        return new Response("Missing themeId", { status: 400 });
    }

    // Fetch the real storefront page server-side (no X-Frame-Options restrictions)
    const storeUrl = `https://${shop}${path}?preview_theme_id=${themeId}`;

    let html;
    try {
        const res = await fetch(storeUrl, {
            headers: {
                // Send merchant session cookie so Shopify returns the theme preview
                "X-Shopify-Access-Token": accessToken,
                "Accept": "text/html",
                "User-Agent": "ConvertFlowAI/1.0"
            },
            redirect: "follow"
        });

        if (!res.ok) {
            return new Response(`Store fetch failed: ${res.status} ${res.statusText}`, { status: 502 });
        }

        html = await res.text();
    } catch (err) {
        return new Response(`Proxy error: ${err.message}`, { status: 502 });
    }

    // Rewrite all relative URLs to absolute so assets load correctly
    const baseUrl = `https://${shop}`;
    html = html
        // href="/..." and src="/..."
        .replace(/(href|src)="\/(?!\/)/g, `$1="${baseUrl}/`)
        // url('/...')
        .replace(/url\('\/(?!\/)/g, `url('${baseUrl}/`)
        .replace(/url\("\/(?!\/)/g, `url("${baseUrl}/`);

    // Inject our communication bridge script into the real store HTML
    // This script listens for postMessage from the parent app and
    // implements Shopify's design mode section highlight protocol
    const bridgeScript = `
<script>
(function() {
    // Listen for messages from the ConvertFlow AI parent app
    window.addEventListener('message', function(e) {
        const msg = e.data;
        if (!msg || !msg.type) return;

        if (msg.type === 'shopify:section:select') {
            const id = msg.detail?.sectionId || msg.payload?.blockId;
            // Remove previous highlights
            document.querySelectorAll('[data-cf-selected]').forEach(function(el) {
                el.removeAttribute('data-cf-selected');
                el.style.outline = '';
            });
            if (id) {
                const el = document.getElementById('shopify-section-' + id) 
                        || document.querySelector('[data-shopify-section-id="' + id + '"]')
                        || document.querySelector('[id*="' + id + '"]');
                if (el) {
                    el.setAttribute('data-cf-selected', '1');
                    el.style.outline = '2px solid #5c6ac4';
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

        if (msg.type === 'shopify:section:deselect') {
            document.querySelectorAll('[data-cf-selected]').forEach(function(el) {
                el.removeAttribute('data-cf-selected');
                el.style.outline = '';
            });
        }
    });

    // Notify parent when any section-like element is clicked
    document.addEventListener('click', function(e) {
        var el = e.target.closest('[id^="shopify-section-"], [data-shopify-section-id], section, .shopify-section');
        if (el) {
            var id = el.id?.replace('shopify-section-', '') 
                  || el.dataset.shopifySectionId 
                  || el.id;
            if (id) {
                window.parent.postMessage({ 
                    type: 'SECTION_CLICKED', 
                    payload: { blockId: id } 
                }, '*');
            }
        }
    }, true);
})();
</script>`;

    // Inject the bridge before </body>
    html = html.includes('</body>')
        ? html.replace('</body>', `${bridgeScript}</body>`)
        : html + bridgeScript;

    return new Response(html, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            // Strip ALL framing restrictions — our proxy is now the source
            "X-Frame-Options": "SAMEORIGIN",
            "Content-Security-Policy": "frame-ancestors 'self'",
            "Cache-Control": "no-store"
        }
    });
}
