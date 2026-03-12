import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getActiveTheme } from "../lib/shopify.server";

/**
 * GET /app/api/render-section?sectionId=X&themeId=Y&blockId=Z
 *
 * Calls Shopify's Section Rendering API:
 *   https://{shop}/sections?sections={sectionId}&preview_theme_id={themeId}
 *
 * Returns { html } — the fully-rendered HTML for ONE section so the Canvas
 * can inject it directly via postMessage WITHOUT doing a full page reload.
 * This is exactly how Shopify's own Theme Editor works internally.
 */
export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const { shop, accessToken } = session;

    const url = new URL(request.url);
    const sectionId = url.searchParams.get("sectionId"); // e.g. "cf_hero_banner_abc123"
    const blockId   = url.searchParams.get("blockId") || sectionId; // the template section key
    let   themeId   = url.searchParams.get("themeId") || "";

    if (!sectionId) return json({ html: "" });

    // Auto-resolve themeId if not provided
    if (!themeId) {
        try {
            const theme = await getActiveTheme(shop, accessToken);
            themeId = theme?.id?.toString() || "";
        } catch { /* ignore */ }
    }

    // The Shopify section rendering API uses the SECTION TYPE (not block id)
    // The section in index.json has: { "type": "cf-hero-banner", "settings": {...} }
    // We pass the `type` value as the sections param.
    // The blockId is the key in sections map, type is what's passed to /sections
    // We'll try sectionId first as the type, then the blockId itself.

    const storefrontBase = `https://${shop}`;
    const renderUrl = new URL(`${storefrontBase}`);
    renderUrl.searchParams.set('sections', sectionId);
    if (themeId) renderUrl.searchParams.set('preview_theme_id', themeId);
    
    // Shopify cache busters
    renderUrl.searchParams.set('_t', Date.now().toString());
    renderUrl.searchParams.set('_fd', '0');
    renderUrl.searchParams.set('pb', '0');

    console.log("[render-section] Fetching:", renderUrl.toString());

    try {
        const res = await fetch(renderUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 ConvertFlow-AI/1.0",
                "Accept": "application/json",
                "Cache-Control": "no-cache",
            },
        });

        if (!res.ok) {
            console.error("[render-section] Failed:", res.status);
            return json({ html: "" });
        }

        const data = await res.json();

        // Shopify returns { "section-type": "<div class='shopify-section'>...html...</div>" }
        // Try the exact sectionId key first, then fall back to first value
        let html = data[sectionId] || Object.values(data)[0] || "";

        if (!html) return json({ html: "" });

        // Rewrite relative URLs to absolute
        html = html.replace(/(src|href)="(\/[^"]*?)"/g, (_, attr, path) => {
            if (path.startsWith("//")) return `${attr}="${path}"`;
            return `${attr}="${storefrontBase}${path}"`;
        });
        html = html.replace(/url\((['"]?)(\/[^)'"\s]+)\1\)/g, (_, q, p) => `url(${q}${storefrontBase}${p}${q})`);

        console.log("[render-section] Got HTML, length:", html.length);
        return json({ html, sectionId, blockId });

    } catch (err) {
        console.error("[render-section] Error:", err.message);
        return json({ html: "" });
    }
};
