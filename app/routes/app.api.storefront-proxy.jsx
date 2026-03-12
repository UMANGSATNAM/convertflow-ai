import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getActiveTheme } from "../lib/shopify.server";

/**
 * GET /app/api/storefront-proxy?page=home|product&themeId=XXX
 *
 * Fetches the REAL live Shopify storefront HTML from the server side
 * (bypasses iframe X-Frame-Options / CSP entirely by using srcDoc).
 *
 * Always uses ?preview_theme_id= so we preview the exact active theme.
 * If the store has a password, attempts to bypass using the _password cookie
 * retrieved via the Admin API storefront_access_tokens endpoint.
 */
export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const { shop, accessToken } = session;

    const url = new URL(request.url);
    const page = url.searchParams.get("page") || "home";
    const activeBlockId = url.searchParams.get("activeBlockId") || "";

    // Always get the real active theme ID
    let themeId = url.searchParams.get("themeId") || "";
    if (!themeId) {
        try {
            const theme = await getActiveTheme(shop, accessToken);
            themeId = theme?.id?.toString() || "";
        } catch (e) {
            console.error("[proxy] Could not get theme:", e.message);
        }
    }

    const pathMap = {
        home: "/",
        product: "/products",
        collection: "/collections/all",
        cart: "/cart",
    };

    const storefrontBase = `https://${shop}`;
    const path = pathMap[page] || "/";
    const previewParam = themeId ? `?preview_theme_id=${themeId}` : "";
    const storefrontUrl = `${storefrontBase}${path}${previewParam}`;

    console.log("[proxy] Fetching:", storefrontUrl);

    // Try to get storefront password to bypass password protection
    let passwordHeader = {};
    try {
        const pwRes = await fetch(
            `https://${shop}/admin/api/2025-01/storefront_access_tokens.json`,
            { headers: { "X-Shopify-Access-Token": accessToken } }
        );
        if (pwRes.ok) {
            const { storefront_access_tokens } = await pwRes.json();
            if (storefront_access_tokens?.length > 0) {
                // Not directly usable for password bypass, but we can try cookie approach
            }
        }
    } catch (e) { /* ignore */ }

    // --- Try fetching the storefront ---
    let html = "";
    let attempts = [storefrontUrl];

    // If home page, also try /en/ prefix variant
    if (page === "home" && !storefrontUrl.includes("/en/")) {
        attempts.push(`${storefrontBase}/en/${previewParam}`);
    }

    for (const tryUrl of attempts) {
        try {
            const response = await fetch(tryUrl, {
                method: "GET",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept-Encoding": "identity",
                    "Cache-Control": "no-cache, no-store",
                    "Pragma": "no-cache",
                },
                redirect: "follow",
            });

            console.log("[proxy] Status:", response.status, "for", tryUrl);

            if (!response.ok) {
                if (response.status === 401) {
                    return json({ html: errorHtml(shop, "Store is password protected. Go to Shopify Admin → Online Store → Preferences and disable the password.", themeId) });
                }
                continue;
            }

            html = await response.text();

            // Detect password page
            if (html.includes("Storefront.PasswordPage") || html.includes("storefront_password") || html.includes("store-password")) {
                return json({ html: errorHtml(shop, "Store is password protected. Please disable it in Shopify Admin → Online Store → Preferences → Password protection.", themeId) });
            }

            if (html.length > 500) break; // Got real HTML
        } catch (err) {
            console.error("[proxy] Fetch error:", err.message);
        }
    }

    if (!html || html.length < 100) {
        return json({ html: errorHtml(shop, "Could not load storefront. Please check the store is accessible.", themeId) });
    }

    // --- Rewrite relative URLs to absolute ---
    html = html.replace(/<base[^>]*>/gi, "");

    // src= and href= relative paths
    html = html.replace(/(src|href|action)="(\/[^"]*?)"/g, (_, attr, path) => {
        if (path.startsWith("//")) return `${attr}="${path}"`;
        return `${attr}="${storefrontBase}${path}"`;
    });

    // srcset=
    html = html.replace(/srcset="([^"]*)"/g, (_, v) =>
        `srcset="${v.replace(/(^|\s|,)(\/[^\s,]+)/g, (__, pfx, p) => `${pfx}${storefrontBase}${p}`)}"`
    );

    // CSS url()
    html = html.replace(/url\((['"]?)(\/[^)'"\s]+)\1\)/g, (_, q, p) => `url(${q}${storefrontBase}${p}${q})`);

    // Add base tag
    html = html.includes("<head>")
        ? html.replace("<head>", `<head>\n  <base href="${storefrontBase}/">`)
        : `<base href="${storefrontBase}/">` + html;

    // --- Inject editor bridge (highlight + messaging) ---
    const bridge = `
<style id="cf-editor-styles">
  /* Disable navigation */
  a[href], form { pointer-events: none !important; }

  /* Make each Shopify section clickable and hoverable */
  .shopify-section {
    pointer-events: auto !important;
    cursor: pointer;
    position: relative;
    outline: 2px solid transparent;
    transition: outline 0.12s ease, box-shadow 0.12s ease;
  }
  .shopify-section:hover {
    outline: 2px solid rgba(0,91,211,0.5);
    outline-offset: -2px;
    z-index: 10;
  }

  /* Active / selected section */
  .cf-section-active {
    outline: 2.5px solid #005bd3 !important;
    outline-offset: -2.5px !important;
    z-index: 11 !important;
    box-shadow: 0 0 0 4px rgba(0,91,211,0.12) !important;
  }

  /* Section label badge on hover */
  .shopify-section::before {
    content: attr(data-cf-label);
    position: absolute;
    top: 8px;
    left: 8px;
    background: #005bd3;
    color: #fff;
    font: 600 11px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 3px 9px;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.12s;
    pointer-events: none;
    z-index: 99999;
    white-space: nowrap;
    letter-spacing: 0;
  }
  .shopify-section:hover::before { opacity: 1 !important; }

  /* Scroll indicator */
  html { scroll-behavior: smooth; }
</style>
<script id="cf-editor-bridge">
(function() {
  'use strict';

  var activeId = ${JSON.stringify(activeBlockId)};

  // ── Label all sections ──────────────────────────────────────────
  function labelSections() {
    document.querySelectorAll('.shopify-section').forEach(function(el) {
      var rawId = (el.id || '').replace('shopify-section-', '');
      el.setAttribute('data-cf-id', rawId);
      // Build a nice human-readable label
      var label = rawId
        .replace(/^cf[_-]/, '')
        .replace(/[_-]/g, ' ')
        .replace(/\\b\\w/g, function(c) { return c.toUpperCase(); });
      el.setAttribute('data-cf-label', label || rawId);
    });
  }
  labelSections();

  // ── Helpers ─────────────────────────────────────────────────────
  function getSectionEl(id) {
    return document.getElementById('shopify-section-' + id)
        || document.querySelector('[data-cf-id="' + id + '"]')
        || document.querySelector('.shopify-section[id*="' + id + '"]');
  }

  function clearHighlights() {
    document.querySelectorAll('.cf-section-active').forEach(function(el) {
      el.classList.remove('cf-section-active');
    });
  }

  function highlightSection(id) {
    clearHighlights();
    var el = getSectionEl(id);
    if (el) {
      el.classList.add('cf-section-active');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    activeId = id;
  }

  // Restore active highlight on load
  if (activeId) {
    requestAnimationFrame(function() { highlightSection(activeId); });
  }

  // ── Click handler ────────────────────────────────────────────────
  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var section = e.target.closest('.shopify-section');
    if (section) {
      var id = section.getAttribute('data-cf-id') || (section.id || '').replace('shopify-section-', '');
      if (id) {
        highlightSection(id);
        window.parent.postMessage({ type: 'SECTION_CLICKED', payload: { blockId: id } }, '*');
      }
    }
  }, true);

  // ── Message handler ─────────────────────────────────────────────
  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.type) return;
    var type = e.data.type;
    var payload = e.data.payload || {};

    if (type === 'shopify:section:select' && payload.blockId) {
      highlightSection(payload.blockId);
    } else if (type === 'shopify:section:deselect') {
      clearHighlights();
      activeId = null;
    } else if (type === 'shopify:section:remove' && payload.blockId) {
      var el = getSectionEl(payload.blockId);
      if (el) el.remove();
    }
  });

  // ── Ready signal ─────────────────────────────────────────────────
  function sendReady() {
    window.parent.postMessage({ type: 'IFRAME_READY', payload: {} }, '*');
  }
  if (document.readyState === 'complete') {
    sendReady();
  } else {
    window.addEventListener('load', sendReady);
  }
})();
</script>`;

    html = html.includes("</body>")
        ? html.replace("</body>", bridge + "\n</body>")
        : html + bridge;

    console.log("[proxy] SUCCESS — length:", html.length, "chars");
    return json({ html });
};

function errorHtml(shop, msg, themeId) {
    const previewUrl = themeId
        ? `https://${shop}/?preview_theme_id=${themeId}`
        : `https://${shop}`;
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 48px 32px; color: #202223; max-width: 560px; margin: 0 auto; }
  .icon { font-size: 40px; margin-bottom: 16px; }
  h2 { font-size: 18px; font-weight: 600; color: #202223; margin: 0 0 10px; }
  p { font-size: 14px; color: #6d7175; line-height: 1.6; margin: 0 0 20px; }
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #303030; color: #fff; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; }
  .btn-secondary { background: none; color: #005bd3; border: 1px solid #c9cccf; margin-left: 8px; }
  .steps { background: #f4f6f8; border-radius: 8px; padding: 16px; font-size: 13px; color: #6d7175; line-height: 2; }
  .steps strong { color: #202223; }
</style>
</head><body>
  <div class="icon">⚠️</div>
  <h2>Preview Unavailable</h2>
  <p>${msg}</p>
  <div class="steps">
    <strong>To enable live preview:</strong><br>
    1. Shopify Admin → <strong>Online Store → Preferences</strong><br>
    2. Scroll to <strong>Password protection</strong><br>
    3. Uncheck <em>"Restrict access to"</em> and save
  </div>
  <br>
  <a href="${previewUrl}" target="_blank" class="btn">Open store directly ↗</a>
  <a href="https://${shop}/admin/online_store/preferences" target="_blank" class="btn btn-secondary">Disable password →</a>
</body></html>`;
}
