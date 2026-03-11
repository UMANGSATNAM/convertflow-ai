import { authenticate } from "../shopify.server";

/**
 * GET /app/api/storefront-proxy?page=home|product|...
 *
 * Fetches the live storefront HTML from Shopify (via Online Store) and
 * injects the ConvertFlow editor bridge script so the Canvas can:
 *   - Highlight hovered/selected sections
 *   - Fire SECTION_CLICKED → parent
 *   - Receive shopify:section:select / deselect / reorder / load / remove
 *
 * The proxy rewrites all internal links/assets to absolute URLs so the
 * page renders correctly inside the iframe.
 */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const { shop, accessToken } = session;

  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "home";
  const activeBlockId = url.searchParams.get("activeBlockId") || "";

  // Map page param to storefront path
  const pathMap = {
    home: "/",
    product: "/products",
    collection: "/collections/all",
    cart: "/cart",
  };
  const storefrontPath = pathMap[page] || "/";
  const storefrontBase = `https://${shop}`;
  const storefrontUrl = `${storefrontBase}${storefrontPath}`;

  // Storefront password (hardcoded for this store; can be moved to env/DB later)
  const STOREFRONT_PASSWORD = "1";

  let html = "";
  try {
    // ── Step 1: POST the password to get the session cookie ────────────
    let sessionCookie = "";
    try {
      const pwForm = new URLSearchParams();
      pwForm.append("form_type", "storefront_password");
      pwForm.append("utf8", "✓");
      pwForm.append("password", STOREFRONT_PASSWORD);

      const pwResponse = await fetch(`${storefrontBase}/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "ConvertFlow-AI/1.0 (Theme Editor Preview)",
        },
        body: pwForm.toString(),
        redirect: "manual", // don't follow — we just need the Set-Cookie header
      });

      // Extract the storefront password cookie from the response
      const setCookie = pwResponse.headers.get("set-cookie") || "";
      const cookieMatch = setCookie.match(/(_shopify_storefront_password=[^;]+)/);
      if (cookieMatch) {
        sessionCookie = cookieMatch[1];
      }
    } catch (_) {
      // If password POST fails, try without cookie (public store)
    }

    // ── Step 2: Fetch the actual storefront page with the cookie ───────
    const response = await fetch(storefrontUrl, {
      headers: {
        "User-Agent": "ConvertFlow-AI/1.0 (Theme Editor Preview)",
        Accept: "text/html",
        ...(sessionCookie ? { Cookie: sessionCookie } : {}),
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return new Response(
        `<html><body style="font-family:sans-serif;padding:40px;color:#444">
          <h2>Could not load live preview</h2>
          <p>The storefront returned HTTP ${response.status}.</p>
          <p>If your store has a password, make sure the password <strong>"${STOREFRONT_PASSWORD}"</strong> is correct.
          You can also disable the password in <a href="https://${shop}/admin/online_store/preferences" target="_blank">Online Store › Preferences</a>.</p>
        </body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    html = await response.text();

    // ── If we still get the password page, bail with a friendly message ─
    if (html.includes('name="password"') && html.includes("storefront_password")) {
      return new Response(
        `<html><body style="font-family:sans-serif;padding:40px;color:#444">
          <h2>Password page detected</h2>
          <p>The storefront password <strong>"${STOREFRONT_PASSWORD}"</strong> was not accepted.</p>
          <p>Please check the password in your Shopify Admin and update it in the proxy route, or disable
          the password in <a href="https://${shop}/admin/online_store/preferences" target="_blank">Online Store › Preferences</a>.</p>
        </body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    // ── Rewrite absolute URLs so assets load cross-origin ──────────────
    // Replace root-relative URLs (/cdn/..., /.../assets/...) with absolute
    html = html.replace(/(href|src|action)="(\/[^"]*?)"/g, (_, attr, path) => {
      return `${attr}="${storefrontBase}${path}"`;
    });

    // Rewrite srcset
    html = html.replace(/srcset="([^"]*)"/g, (_, val) => {
      const fixed = val.replace(/(\s|,|^)(\/[^\s,]+)/g, (__, pfx, p) => `${pfx}${storefrontBase}${p}`);
      return `srcset="${fixed}"`;
    });

    // ── Remove <base> tags to avoid conflicts ──────────────────────────
    html = html.replace(/<base[^>]*>/gi, "");

    // ── Disable all navigation so clicks don't navigate ───────────────
    const noNavScript = `
<style>
  /* Disable all navigation but keep sections clickable */
  a[href], form { pointer-events: none !important; }
  .shopify-section { pointer-events: auto !important; }
  
  /* Hover / active highlight ring */
  .shopify-section {
    outline: 2px solid transparent;
    transition: outline 0.15s ease, box-shadow 0.15s ease;
    position: relative;
  }
  .shopify-section:hover {
    outline: 2px solid #2c6ecb;
    outline-offset: -2px;
    cursor: pointer;
    z-index: 10;
  }
  .cf-section-active {
    outline: 3px solid #005bd3 !important;
    outline-offset: -3px !important;
    z-index: 11 !important;
    box-shadow: 0 0 0 4px rgba(0,91,211,0.15) !important;
  }
  /* Section label badge */
  .shopify-section::before {
    content: attr(data-section-type);
    position: absolute;
    top: 4px;
    left: 4px;
    background: #2c6ecb;
    color: #fff;
    font-size: 10px;
    font-family: -apple-system, sans-serif;
    padding: 2px 6px;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.15s;
    pointer-events: none;
    z-index: 9999;
  }
  .shopify-section:hover::before { opacity: 1; }
</style>
`;

    const bridgeScript = `
<script>
(function() {
  'use strict';
  
  // ── State ──────────────────────────────────────────────────────────
  var activeBlockId = ${JSON.stringify(activeBlockId)};

  // ── Tag every .shopify-section with its data-section-type ─────────
  document.querySelectorAll('.shopify-section').forEach(function(el) {
    var id = el.id.replace('shopify-section-', '');
    el.setAttribute('data-section-type', id);
  });

  // ── Helpers ────────────────────────────────────────────────────────
  function getSectionEl(blockId) {
    return document.getElementById('shopify-section-' + blockId);
  }

  function clearAllActive() {
    document.querySelectorAll('.cf-section-active').forEach(function(el) {
      el.classList.remove('cf-section-active');
    });
  }

  function highlightSection(blockId) {
    clearAllActive();
    var el = getSectionEl(blockId);
    if (el) {
      el.classList.add('cf-section-active');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    activeBlockId = blockId;
  }

  // ── Initial highlight ──────────────────────────────────────────────
  if (activeBlockId) {
    requestAnimationFrame(function() { highlightSection(activeBlockId); });
  }

  // ── Disable link navigation + intercept section clicks ─────────────
  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var section = e.target.closest('.shopify-section');
    if (section) {
      var blockId = section.id.replace('shopify-section-', '');
      highlightSection(blockId);
      window.parent.postMessage({ type: 'SECTION_CLICKED', payload: { blockId: blockId } }, '*');
    }
  }, true);

  // ── Message handler (Parent → Iframe) ─────────────────────────────
  window.addEventListener('message', function(event) {
    if (!event.data || !event.data.type) return;
    var type = event.data.type;
    var payload = event.data.payload || {};

    switch (type) {
      case 'shopify:section:select':
        if (payload.blockId) highlightSection(payload.blockId);
        break;

      case 'shopify:section:deselect':
        clearAllActive();
        activeBlockId = null;
        break;

      case 'shopify:section:reorder':
        if (Array.isArray(payload.order)) {
          var container = document.querySelector('.shopify-section')?.parentElement || document.body;
          payload.order.forEach(function(blockId) {
            var el = getSectionEl(blockId);
            if (el) container.appendChild(el);
          });
        }
        break;

      case 'shopify:section:load':
        // Inject a new CF section HTML into the page
        if (payload.blockId && payload.html) {
          var existing = getSectionEl(payload.blockId);
          if (existing) {
            existing.outerHTML = payload.html;
          } else if (payload.afterBlockId) {
            var after = getSectionEl(payload.afterBlockId);
            if (after) after.insertAdjacentHTML('afterend', payload.html);
            else document.body.insertAdjacentHTML('beforeend', payload.html);
          } else {
            document.body.insertAdjacentHTML('beforeend', payload.html);
          }
          if (activeBlockId === payload.blockId) {
            requestAnimationFrame(function() { highlightSection(payload.blockId); });
          }
        }
        break;

      case 'shopify:section:remove':
        if (payload.blockId) {
          var el = getSectionEl(payload.blockId);
          if (el) el.remove();
          if (activeBlockId === payload.blockId) activeBlockId = null;
        }
        break;
    }
  });

  // ── Signal ready to parent ─────────────────────────────────────────
  window.addEventListener('load', function() {
    window.parent.postMessage({ type: 'IFRAME_READY', payload: {} }, '*');
  });

  // Also fire immediately in case load already happened
  window.parent.postMessage({ type: 'IFRAME_READY', payload: {} }, '*');
})();
</script>
`;

    // Inject the no-nav style + bridge script just before </body>
    if (html.includes("</body>")) {
      html = html.replace("</body>", noNavScript + bridgeScript + "</body>");
    } else {
      html += noNavScript + bridgeScript;
    }
  } catch (err) {
    console.error("[storefront-proxy] fetch error:", err);
    html = `<html><body style="font-family:sans-serif;padding:40px;color:#444">
      <h2>Preview error</h2>
      <p>${err.message}</p>
      <p>The store may be password-protected. Please disable the password in <strong>Online Store › Preferences</strong>.</p>
    </body></html>`;
  }

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Allow the iframe to embed this proxy response
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "frame-ancestors 'self'",
      // Cache briefly so rapid re-renders don't hammer the storefront
      "Cache-Control": "private, max-age=10",
    },
  });
};
