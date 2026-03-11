/**
 * GET /app/api/storefront-proxy?shop=clothingwaley.myshopify.com&page=home
 *
 * NO admin auth required — this route fetches PUBLIC storefront HTML and
 * injects the ConvertFlow editor bridge script.
 *
 * The shop is passed via query param (from Canvas.jsx) — we never need
 * the Shopify admin token for a public storefront fetch.
 *
 * Password bypass: 3-step CSRF flow
 *   1. GET /password  → grab CSRF authenticity_token + session cookies
 *   2. POST /password → submit password + CSRF token → get pw auth cookie
 *   3. GET /          → fetch the real storefront HTML with the pw cookie
 */
export const loader = async ({ request }) => {
  const url = new URL(request.url);

  // shop MUST come from the query param — no admin auth needed
  const shop = url.searchParams.get("shop") || "";
  const page = url.searchParams.get("page") || "home";
  const activeBlockId = url.searchParams.get("activeBlockId") || "";

  if (!shop) {
    return errorPage("unknown", `<h2>Missing shop parameter</h2><p>The preview could not load because no shop was specified.</p>`);
  }

  const pathMap = {
    home: "/",
    product: "/products",
    collection: "/collections/all",
    cart: "/cart",
  };
  const storefrontPath = pathMap[page] || "/";
  const storefrontBase = `https://${shop}`;
  const storefrontUrl = `${storefrontBase}${storefrontPath}`;

  const STOREFRONT_PASSWORD = "1";

  let html = "";
  try {
    // ── Step 1: GET /password → CSRF token + initial session cookies ───
    let sessionCookie = "";
    try {
      const pwPageRes = await fetch(`${storefrontBase}/password`, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 ConvertFlow-AI/1.0",
          "Accept": "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });

      const pwPageHtml = await pwPageRes.text();

      // Extract CSRF token from the form HTML
      let csrfToken = "";
      const tokenMatch =
        pwPageHtml.match(/authenticity_token[^>]*value="([^"]+)"/) ||
        pwPageHtml.match(/name="authenticity_token"\s+value="([^"]+)"/);
      if (tokenMatch) csrfToken = tokenMatch[1];

      // Capture initial cookies (e.g. _shopify_y)
      const initialCookieStr = (pwPageRes.headers.get("set-cookie") || "")
        .split(/,(?=[^ ])/)
        .map(c => c.split(";")[0].trim())
        .filter(Boolean)
        .join("; ");

      console.log("[proxy] CSRF token:", csrfToken ? "found" : "NOT FOUND");
      console.log("[proxy] Initial cookies:", initialCookieStr.slice(0, 100));

      // ── Step 2: POST to /password with CSRF token + password ──────────
      const pwForm = new URLSearchParams({
        form_type: "storefront_password",
        utf8: "✓",
        password: STOREFRONT_PASSWORD,
        ...(csrfToken ? { authenticity_token: csrfToken } : {}),
      });

      const pwPostRes = await fetch(`${storefrontBase}/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 ConvertFlow-AI/1.0",
          "Origin": storefrontBase,
          "Referer": `${storefrontBase}/password`,
          "Accept": "text/html,application/xhtml+xml",
          ...(initialCookieStr ? { Cookie: initialCookieStr } : {}),
        },
        body: pwForm.toString(),
        redirect: "manual",
      });

      const postCookies = pwPostRes.headers.get("set-cookie") || "";
      const pwCookieMatch = postCookies.match(/_shopify_storefront_password=[^;,\s]+/);
      if (pwCookieMatch) {
        // Combine initial cookies + the new password cookie
        sessionCookie = initialCookieStr
          ? `${initialCookieStr}; ${pwCookieMatch[0]}`
          : pwCookieMatch[0];
        console.log("[proxy] Password cookie acquired");
      } else {
        sessionCookie = initialCookieStr;
        console.log("[proxy] No pw cookie in POST response — using initial cookies only");
      }
    } catch (pwErr) {
      console.warn("[proxy] Password bypass failed:", pwErr.message);
    }

    // ── Step 3: Fetch the actual storefront page ────────────────────────
    const fetchHeaders = {
      "User-Agent": "Mozilla/5.0 ConvertFlow-AI/1.0",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      ...(sessionCookie ? { Cookie: sessionCookie } : {}),
    };

    // Follow redirects manually to intercept bad destinations
    let currentUrl = storefrontUrl;
    let finalResponse = await fetch(currentUrl, { headers: fetchHeaders, redirect: "manual" });
    let hops = 0;

    while ([301, 302, 303, 307, 308].includes(finalResponse.status) && hops < 5) {
      const location = finalResponse.headers.get("location") || "";
      console.log(`[proxy] Redirect ${hops + 1}: ${location.slice(0, 80)}`);

      if (location.includes("accounts.shopify.com") || location.includes("account.shopify.com")) {
        return errorPage(shop, `
          <h2>Shopify Customer Accounts Redirect</h2>
          <p>Shopify redirected to <strong>accounts.shopify.com</strong> when loading the store preview.</p>
          <p>This usually means:</p>
          <ul>
            <li>The storefront password <strong>"${STOREFRONT_PASSWORD}"</strong> was not accepted, <strong>or</strong></li>
            <li>The store uses Shopify's new "Customer Accounts" system which blocks server-side fetching</li>
          </ul>
          <p>
            <strong>Quickest fix:</strong> Go to 
            <a href="https://${shop}/admin/online_store/preferences" target="_blank">
              Online Store &rsaquo; Preferences
            </a>
            and temporarily <strong>disable the storefront password</strong>.
            The editor works with public stores. For dev stores, this is the fastest path.
          </p>
        `);
      }

      currentUrl = location.startsWith("http") ? location : `${storefrontBase}${location}`;
      finalResponse = await fetch(currentUrl, { headers: fetchHeaders, redirect: "manual" });
      hops++;
    }

    if (!finalResponse.ok && finalResponse.status !== 200) {
      return errorPage(shop, `<h2>HTTP ${finalResponse.status}</h2><p>The storefront returned an error when loading the preview.</p>`);
    }

    html = await finalResponse.text();

    // Still on the password page?
    if (html.includes('form_type" value="storefront_password"') || html.includes('storefront_password')) {
      return errorPage(shop, `
        <h2>Password Not Accepted</h2>
        <p>The password <strong>"${STOREFRONT_PASSWORD}"</strong> was not accepted by your store.</p>
        <p>Double-check the password in 
          <a href="https://${shop}/admin/online_store/preferences" target="_blank">Online Store › Preferences</a>,
          or disable the password for preview to work.
        </p>
      `);
    }

    // Still going to accounts.shopify.com?
    if (html.includes("accounts.shopify.com") && html.includes("shop_domain")) {
      return errorPage(shop, `
        <h2>Customer Accounts Detected</h2>
        <p>Please disable the storefront password in 
          <a href="https://${shop}/admin/online_store/preferences" target="_blank">Online Store › Preferences</a>.
        </p>
      `);
    }

    // ── Rewrite URLs to absolute ────────────────────────────────────────
    html = html.replace(/(src|href|action)="(\/[^"]*?)"/g, (_, attr, path) => {
      if (path.startsWith("//")) return `${attr}="${path}"`;
      return `${attr}="${storefrontBase}${path}"`;
    });
    html = html.replace(/srcset="([^"]*)"/g, (_, val) => {
      const fixed = val.replace(/(^|\s|,)(\/[^\s,]+)/g, (__, pfx, p) => `${pfx}${storefrontBase}${p}`);
      return `srcset="${fixed}"`;
    });
    html = html.replace(/url\((['"]?)(\/[^)'"]+)\1\)/g, (_, q, p) => `url(${q}${storefrontBase}${p}${q})`);
    html = html.replace(/<base[^>]*>/gi, "");

    // Add a base tag so remaining relative URLs resolve correctly
    const baseTag = `<base href="${storefrontBase}/">`;
    html = html.includes("<head>")
      ? html.replace("<head>", `<head>\n  ${baseTag}`)
      : baseTag + html;

    // ── Inject editor bridge styles + script ────────────────────────────
    const editorStyles = `
<style id="cf-editor-styles">
  a[href], form:not(#cf-pw-form) { pointer-events: none !important; }
  .shopify-section { pointer-events: auto !important; cursor: pointer; position: relative; }
  .shopify-section { outline: 2px solid transparent; transition: outline 0.15s ease; }
  .shopify-section:hover { outline: 2px solid #2c6ecb; outline-offset: -2px; z-index: 10; }
  .cf-section-active { outline: 3px solid #005bd3 !important; outline-offset: -3px !important; z-index: 11 !important; box-shadow: 0 0 0 4px rgba(0,91,211,0.15) !important; }
  .shopify-section::before {
    content: attr(data-cf-id); position: absolute; top: 6px; left: 6px;
    background: #005bd3; color: #fff; font: 600 10px/1 -apple-system, sans-serif;
    padding: 3px 8px; border-radius: 4px; opacity: 0; transition: opacity 0.15s;
    pointer-events: none; z-index: 9999; white-space: nowrap;
  }
  .shopify-section:hover::before { opacity: 1 !important; }
</style>`;

    const bridgeScript = `
<script id="cf-editor-bridge">
(function() {
  'use strict';
  var activeBlockId = ${JSON.stringify(activeBlockId)};
  document.querySelectorAll('.shopify-section').forEach(function(el) {
    var id = (el.id || '').replace('shopify-section-', '');
    el.setAttribute('data-cf-id', id || el.id);
  });
  function getEl(id) { return document.getElementById('shopify-section-' + id) || document.querySelector('[data-cf-id="' + id + '"]'); }
  function clearActive() { document.querySelectorAll('.cf-section-active').forEach(function(e) { e.classList.remove('cf-section-active'); }); }
  function highlight(id) {
    clearActive();
    var el = getEl(id);
    if (el) { el.classList.add('cf-section-active'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    activeBlockId = id;
  }
  if (activeBlockId) requestAnimationFrame(function() { highlight(activeBlockId); });
  document.addEventListener('click', function(e) {
    e.preventDefault(); e.stopPropagation();
    var sec = e.target.closest('.shopify-section');
    if (sec) {
      var id = (sec.id || '').replace('shopify-section-', '') || sec.getAttribute('data-cf-id');
      highlight(id);
      window.parent.postMessage({ type: 'SECTION_CLICKED', payload: { blockId: id } }, '*');
    }
  }, true);
  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.type) return;
    var t = e.data.type, p = e.data.payload || {};
    if (t === 'shopify:section:select' && p.blockId) highlight(p.blockId);
    else if (t === 'shopify:section:deselect') { clearActive(); activeBlockId = null; }
    else if (t === 'shopify:section:reorder' && Array.isArray(p.order)) {
      var par = document.querySelector('.shopify-section')?.parentElement || document.body;
      p.order.forEach(function(id) { var el = getEl(id); if (el) par.appendChild(el); });
    }
    else if (t === 'shopify:section:load' && p.blockId && p.html) {
      var ex = getEl(p.blockId);
      if (ex) ex.outerHTML = p.html;
      else if (p.afterBlockId) { var af = getEl(p.afterBlockId); if (af) af.insertAdjacentHTML('afterend', p.html); else document.body.insertAdjacentHTML('beforeend', p.html); }
      else document.body.insertAdjacentHTML('beforeend', p.html);
    }
    else if (t === 'shopify:section:remove' && p.blockId) { var el = getEl(p.blockId); if (el) el.remove(); }
  });
  function ready() { window.parent.postMessage({ type: 'IFRAME_READY', payload: {} }, '*'); }
  if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready);
})();
</script>`;

    html = html.includes("</body>")
      ? html.replace("</body>", editorStyles + bridgeScript + "\n</body>")
      : html + editorStyles + bridgeScript;

  } catch (err) {
    console.error("[proxy] Fatal error:", err);
    return errorPage(shop, `<h2>Preview error</h2><p>${err.message}</p>`);
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
    <style>body{font-family:-apple-system,sans-serif;padding:48px;color:#333;max-width:600px;margin:0 auto}h2{color:#d91f1f;margin-top:0}a{color:#005bd3}ul{padding-left:18px;line-height:1.8}.icon{font-size:48px;margin-bottom:16px}</style>
    </head><body><div class="icon">🔒</div>${bodyHtml}</body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
