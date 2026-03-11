import { authenticate } from "../shopify.server";

/**
 * GET /app/api/storefront-proxy?page=home|product|...
 *
 * Two-step flow:
 *  1. POST to /password with the storefront password → capture session cookie
 *  2. GET the real storefront page with that cookie
 *
 * Fully rewrites asset URLs to absolute so the iframe renders correctly.
 * Injects the ConvertFlow editor bridge script for click → highlight → postMessage.
 */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "home";
  const activeBlockId = url.searchParams.get("activeBlockId") || "";

  const pathMap = {
    home: "/",
    product: "/products",
    collection: "/collections/all",
    cart: "/cart",
  };
  const storefrontPath = pathMap[page] || "/";
  const storefrontBase = `https://${shop}`;
  const storefrontUrl = `${storefrontBase}${storefrontPath}`;

  // ── Storefront password ─────────────────────────────────────────────
  // Hardcoded here; move to a DB/env column later for multi-merchant
  const STOREFRONT_PASSWORD = "1";

  let html = "";
  try {
    // ── Step 1: POST the password to get the session cookie ────────────
    let sessionCookie = "";
    try {
      const pwForm = new URLSearchParams({
        form_type: "storefront_password",
        utf8: "✓",
        password: STOREFRONT_PASSWORD,
      });

      const pwResponse = await fetch(`${storefrontBase}/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 ConvertFlow-AI/1.0",
          "Origin": storefrontBase,
          "Referer": `${storefrontBase}/password`,
          "Accept": "text/html,application/xhtml+xml",
        },
        body: pwForm.toString(),
        redirect: "manual", // capture the Set-Cookie before the redirect
      });

      // Look for the storefront password cookie in all set-cookie headers
      // node-fetch returns them comma-joined; split carefully
      const rawCookies = pwResponse.headers.get("set-cookie") || "";
      const match = rawCookies.match(/_shopify_storefront_password=[^;,\s]+/);
      if (match) {
        sessionCookie = match[0];
        console.log("[proxy] Got storefront cookie:", sessionCookie);
      } else {
        console.log("[proxy] No storefront cookie found, raw:", rawCookies.slice(0, 200));
      }
    } catch (pwErr) {
      console.warn("[proxy] Password POST failed:", pwErr.message);
    }

    // ── Step 2: Fetch the storefront page ──────────────────────────────
    // Use redirect:"manual" so we can detect bad redirects (accounts.shopify.com)
    const fetchOptions = {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 ConvertFlow-AI/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        ...(sessionCookie ? { Cookie: sessionCookie } : {}),
      },
      redirect: "manual",
    };

    let finalResponse = await fetch(storefrontUrl, fetchOptions);
    let finalUrl = storefrontUrl;

    // Follow redirects manually (up to 5) so we can intercept bad ones
    let redirectCount = 0;
    while (
      [301, 302, 303, 307, 308].includes(finalResponse.status) &&
      redirectCount < 5
    ) {
      const location = finalResponse.headers.get("location") || "";
      console.log(`[proxy] Redirect ${redirectCount + 1}: ${location}`);

      // Detect redirect to accounts.shopify.com — bail out with friendly error
      if (location.includes("accounts.shopify.com") || location.includes("account.shopify.com")) {
        return errorPage(shop, `
          <h2>Customer Accounts Redirect Detected</h2>
          <p>Shopify redirected the preview to <strong>accounts.shopify.com</strong>.</p>
          <p>To fix this, go to 
            <a href="https://${shop}/admin/online_store/preferences" target="_blank">
              Online Store &rsaquo; Preferences
            </a>
            and check one of the following:
          </p>
          <ul>
            <li>Disable the <strong>storefront password</strong> temporarily, or</li>
            <li>Make sure the storefront password is set to <strong>"${STOREFRONT_PASSWORD}"</strong></li>
          </ul>
          <p>The preview will show your real live theme once password protection is removed or correctly authenticated.</p>
        `);
      }

      // Absolute redirect? Use as-is. Root-relative? Prepend base.
      const nextUrl = location.startsWith("http")
        ? location
        : `${storefrontBase}${location}`;

      finalUrl = nextUrl;
      finalResponse = await fetch(nextUrl, fetchOptions);
      redirectCount++;
    }

    // Still a redirect after 5 hops → show error
    if ([301, 302, 303, 307, 308].includes(finalResponse.status)) {
      return errorPage(shop, `<h2>Too many redirects</h2><p>The storefront kept redirecting and the preview couldn't load.</p>`);
    }

    if (!finalResponse.ok && finalResponse.status !== 200) {
      return errorPage(shop, `<h2>HTTP ${finalResponse.status}</h2><p>The storefront returned an error.</p>`);
    }

    html = await finalResponse.text();

    // ── Detect if we landed on the password page anyway ────────────────
    if (
      html.includes('form_type" value="storefront_password"') ||
      (html.includes('name="password"') && html.includes("storefront_password"))
    ) {
      return errorPage(shop, `
        <h2>Password page detected</h2>
        <p>The storefront password <strong>"${STOREFRONT_PASSWORD}"</strong> was not accepted.</p>
        <p>Please verify the password in your Shopify Admin → 
          <a href="https://${shop}/admin/online_store/preferences" target="_blank">Online Store › Preferences</a>
        </p>
      `);
    }

    // ── Detect if we landed on the Shopify accounts login page ─────────
    if (html.includes("accounts.shopify.com") && html.includes("shop_domain")) {
      return errorPage(shop, `
        <h2>Shopify Accounts Login Detected</h2>
        <p>Shopify is trying to redirect to the customer accounts login page.</p>
        <p>Please disable the storefront password in 
          <a href="https://${shop}/admin/online_store/preferences" target="_blank">Online Store › Preferences</a>
          and try again.
        </p>
      `);
    }

    // ── Rewrite root-relative URLs to absolute ─────────────────────────
    // src, href, action
    html = html.replace(/(src|href|action)="(\/[^"]*?)"/g, (_, attr, path) => {
      // Skip anchor links and data URIs
      if (path.startsWith("//") || path.startsWith("#")) return `${attr}="${path}"`;
      return `${attr}="${storefrontBase}${path}"`;
    });

    // srcset
    html = html.replace(/srcset="([^"]*)"/g, (_, val) => {
      const fixed = val.replace(/(^|\s|,)(\/[^\s,]+)/g, (__, pfx, p) => `${pfx}${storefrontBase}${p}`);
      return `srcset="${fixed}"`;
    });

    // CSS url() references
    html = html.replace(/url\((['"]?)(\/[^)'"]+)\1\)/g, (_, q, p) => `url(${q}${storefrontBase}${p}${q})`);

    // Remove <base> tags (breaks relative URL resolution)
    html = html.replace(/<base[^>]*>/gi, "");

    // ── Add a <base> pointing to the storefront so relative URLs work ──
    const baseTag = `<base href="${storefrontBase}/">`;
    html = html.replace(/<head>/i, `<head>\n  ${baseTag}`);
    if (!html.includes("<head>")) {
      html = baseTag + html;
    }

    // ── Editor bridge: styles + postMessage script ─────────────────────
    const editorStyles = `
<style id="cf-editor-styles">
  /* Navigation disabled — only section clicks work */
  a[href], form:not(#cf-pw-form) { pointer-events: none !important; }
  .shopify-section { pointer-events: auto !important; }

  /* Section hover ring */
  .shopify-section {
    outline: 2px solid transparent;
    transition: outline 0.15s ease, box-shadow 0.15s ease;
    position: relative;
    cursor: pointer;
  }
  .shopify-section:hover {
    outline: 2px solid #2c6ecb;
    outline-offset: -2px;
    z-index: 10;
  }
  .cf-section-active {
    outline: 3px solid #005bd3 !important;
    outline-offset: -3px !important;
    z-index: 11 !important;
    box-shadow: 0 0 0 4px rgba(0,91,211,0.15) !important;
  }
  /* Section type badge on hover */
  .shopify-section::before {
    content: attr(data-cf-id);
    position: absolute;
    top: 6px;
    left: 6px;
    background: #005bd3;
    color: #fff;
    font: 600 10px/1 -apple-system, sans-serif;
    letter-spacing: 0.04em;
    padding: 3px 8px;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.15s;
    pointer-events: none;
    z-index: 9999;
    white-space: nowrap;
  }
  .shopify-section:hover::before { opacity: 1 !important; }
</style>`;

    const bridgeScript = `
<script id="cf-editor-bridge">
(function() {
  'use strict';

  var activeBlockId = ${JSON.stringify(activeBlockId)};

  // Tag every .shopify-section with the block ID
  document.querySelectorAll('.shopify-section').forEach(function(el) {
    var raw = el.id || '';
    var id = raw.replace('shopify-section-', '');
    el.setAttribute('data-cf-id', id || raw);
  });

  function getSectionEl(id) {
    return document.getElementById('shopify-section-' + id) || document.querySelector('[data-cf-id="' + id + '"]');
  }

  function clearActive() {
    document.querySelectorAll('.cf-section-active').forEach(function(el) {
      el.classList.remove('cf-section-active');
    });
  }

  function highlight(id) {
    clearActive();
    var el = getSectionEl(id);
    if (el) {
      el.classList.add('cf-section-active');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    activeBlockId = id;
  }

  if (activeBlockId) requestAnimationFrame(function() { highlight(activeBlockId); });

  // Click → notify parent
  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var section = e.target.closest('.shopify-section');
    if (section) {
      var id = (section.id || '').replace('shopify-section-', '') || section.getAttribute('data-cf-id');
      highlight(id);
      window.parent.postMessage({ type: 'SECTION_CLICKED', payload: { blockId: id } }, '*');
    }
  }, true);

  // Messages from parent
  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.type) return;
    var t = e.data.type, p = e.data.payload || {};
    if (t === 'shopify:section:select' && p.blockId) highlight(p.blockId);
    else if (t === 'shopify:section:deselect') { clearActive(); activeBlockId = null; }
    else if (t === 'shopify:section:reorder' && Array.isArray(p.order)) {
      var parent = document.querySelector('.shopify-section')?.parentElement || document.body;
      p.order.forEach(function(id) { var el = getSectionEl(id); if (el) parent.appendChild(el); });
    }
    else if (t === 'shopify:section:load' && p.blockId && p.html) {
      var ex = getSectionEl(p.blockId);
      if (ex) ex.outerHTML = p.html;
      else if (p.afterBlockId) {
        var after = getSectionEl(p.afterBlockId);
        if (after) after.insertAdjacentHTML('afterend', p.html);
        else document.body.insertAdjacentHTML('beforeend', p.html);
      } else document.body.insertAdjacentHTML('beforeend', p.html);
      if (activeBlockId === p.blockId) requestAnimationFrame(function() { highlight(p.blockId); });
    }
    else if (t === 'shopify:section:remove' && p.blockId) {
      var el = getSectionEl(p.blockId);
      if (el) el.remove();
      if (activeBlockId === p.blockId) activeBlockId = null;
    }
  });

  // Signal ready
  function signalReady() {
    window.parent.postMessage({ type: 'IFRAME_READY', payload: {} }, '*');
  }
  if (document.readyState === 'complete') signalReady();
  else window.addEventListener('load', signalReady);
})();
</script>`;

    // Inject before </body> (or append)
    if (html.includes("</body>")) {
      html = html.replace("</body>", editorStyles + bridgeScript + "\n</body>");
    } else {
      html += editorStyles + bridgeScript;
    }
  } catch (err) {
    console.error("[storefront-proxy] Error:", err);
    html = `<html><body style="font-family:sans-serif;padding:40px;color:#444">
      <h2>Preview error</h2><p>${err.message}</p>
    </body></html>`;
  }

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
      "Cache-Control": "private, max-age=15",
    },
  });
};

function errorPage(shop, bodyHtml) {
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body { font-family: -apple-system, sans-serif; padding: 48px; color: #333; max-width: 600px; margin: 0 auto; }
      h2 { color: #d91f1f; margin-top: 0; }
      a { color: #005bd3; }
      ul { padding-left: 18px; line-height: 1.8; }
      .icon { font-size: 48px; margin-bottom: 16px; }
    </style>
    </head><body>
    <div class="icon">🔒</div>
    ${bodyHtml}
    </body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
