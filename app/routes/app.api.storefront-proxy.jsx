import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

/**
 * POST /app/api/storefront-proxy
 *
 * Called from Canvas.jsx via a React fetch() — NOT as an iframe src.
 * This bypasses all CSP/X-Frame-Options issues.
 *
 * Returns: { html: "<full page html>" }
 *
 * Requires admin auth because it's called as a standard fetch from
 * the React app (which carries the session cookie). The shop is
 * read from the authenticated session — no need to pass it manually.
 *
 * Password bypass: 3-step CSRF flow
 *   1. GET /password  → grab authenticity_token + session cookies
 *   2. POST /password → submit password + CSRF → get pw auth cookie
 *   3. GET /page      → fetch real storefront HTML with pw cookie
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
  const STOREFRONT_PASSWORD = "1";

  let html = "";
  try {
    // ── Step 1: GET /password → CSRF token + initial session cookies ────
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

      let csrfToken = "";
      const tokenMatch =
        pwPageHtml.match(/name="authenticity_token"\s+value="([^"]+)"/) ||
        pwPageHtml.match(/authenticity_token[^>]*value="([^"]+)"/);
      if (tokenMatch) csrfToken = tokenMatch[1];

      // Capture initial session cookies from GET response
      const initialCookieStr = (pwPageRes.headers.get("set-cookie") || "")
        .split(/,(?=[^ ])/)
        .map(c => c.split(";")[0].trim())
        .filter(Boolean)
        .join("; ");

      console.log("[proxy] CSRF token:", csrfToken ? `found (${csrfToken.slice(0, 20)}...)` : "NOT FOUND");
      console.log("[proxy] Initial cookies:", initialCookieStr.slice(0, 100));

      // ── Step 2: POST the password with CSRF token ──────────────────────
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

      console.log("[proxy] Password POST status:", pwPostRes.status);

      const postSetCookie = pwPostRes.headers.get("set-cookie") || "";
      console.log("[proxy] POST set-cookie:", postSetCookie.slice(0, 200));

      // Look for the password cookie in the POST response
      const pwCookieMatch = postSetCookie.match(/_shopify_storefront_password=[^;,\s]+/);
      if (pwCookieMatch) {
        sessionCookie = initialCookieStr
          ? `${initialCookieStr}; ${pwCookieMatch[0]}`
          : pwCookieMatch[0];
        console.log("[proxy] Password cookie acquired:", pwCookieMatch[0].slice(0, 60));
      } else {
        // 302 redirect after POST = password accepted — follow it and grab cookies from the redirect response
        if ([301, 302, 303].includes(pwPostRes.status)) {
          const redirectLoc = pwPostRes.headers.get("location") || "/";
          const followUrl = redirectLoc.startsWith("http") ? redirectLoc : `${storefrontBase}${redirectLoc}`;
          console.log("[proxy] Following POST redirect to:", followUrl);

          const followRes = await fetch(followUrl, {
            headers: {
              Cookie: initialCookieStr,
              "User-Agent": "Mozilla/5.0 ConvertFlow-AI/1.0",
              Accept: "text/html",
            },
            redirect: "manual",
          });
          const followSetCookie = followRes.headers.get("set-cookie") || "";
          const followCookieMatch = followSetCookie.match(/_shopify_storefront_password=[^;,\s]+/);
          if (followCookieMatch) {
            sessionCookie = `${initialCookieStr}; ${followCookieMatch[0]}`;
            console.log("[proxy] Password cookie acquired from redirect follow");
          } else {
            // If redirect went back to password page, the password was wrong
            sessionCookie = initialCookieStr;
          }
        } else {
          sessionCookie = initialCookieStr;
        }
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

    let currentUrl = storefrontUrl;
    let finalResponse = await fetch(currentUrl, { headers: fetchHeaders, redirect: "manual" });
    let hops = 0;

    while ([301, 302, 303, 307, 308].includes(finalResponse.status) && hops < 5) {
      const location = finalResponse.headers.get("location") || "";
      console.log(`[proxy] GET Redirect ${hops + 1}: ${location.slice(0, 80)}`);

      if (location.includes("accounts.shopify.com") || location.includes("account.shopify.com")) {
        const errHtml = makeErrorHtml(shop, STOREFRONT_PASSWORD);
        return json({ html: errHtml });
      }

      currentUrl = location.startsWith("http") ? location : `${storefrontBase}${location}`;
      finalResponse = await fetch(currentUrl, { headers: fetchHeaders, redirect: "manual" });
      hops++;
    }

    if (!finalResponse.ok && finalResponse.status !== 200) {
      return json({ html: makeErrorHtml(shop, STOREFRONT_PASSWORD, `HTTP ${finalResponse.status}`) });
    }

    html = await finalResponse.text();

    // Still on password page?
    if (html.includes("storefront_password") && html.includes('form_type" value="storefront_password"')) {
      return json({
        html: makeErrorHtml(shop, STOREFRONT_PASSWORD, `Password "${STOREFRONT_PASSWORD}" was not accepted`)
      });
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
    html = html.includes("<head>")
      ? html.replace("<head>", `<head>\n  <base href="${storefrontBase}/">`)
      : `<base href="${storefrontBase}/">` + html;

    // ── Inject editor bridge ────────────────────────────────────────────
    const editorStyles = `
<style id="cf-editor-styles">
  a[href], form { pointer-events: none !important; }
  .shopify-section { pointer-events: auto !important; cursor: pointer; position: relative;
    outline: 2px solid transparent; transition: outline 0.15s ease; }
  .shopify-section:hover { outline: 2px solid #2c6ecb; outline-offset: -2px; z-index: 10; }
  .cf-section-active { outline: 3px solid #005bd3 !important; outline-offset: -3px !important;
    z-index: 11 !important; box-shadow: 0 0 0 4px rgba(0,91,211,0.15) !important; }
  .shopify-section::before { content: attr(data-cf-id); position: absolute; top: 6px; left: 6px;
    background: #005bd3; color: #fff; font: 600 10px/1 -apple-system, sans-serif;
    padding: 3px 8px; border-radius: 4px; opacity: 0; transition: opacity 0.15s;
    pointer-events: none; z-index: 9999; white-space: nowrap; }
  .shopify-section:hover::before { opacity: 1 !important; }
</style>`;

    const bridgeScript = `
<script id="cf-editor-bridge">
(function() {
  var activeBlockId = ${JSON.stringify(activeBlockId)};
  document.querySelectorAll('.shopify-section').forEach(function(el) {
    var id = (el.id || '').replace('shopify-section-', ''); el.setAttribute('data-cf-id', id || el.id); });
  function getEl(id) { return document.getElementById('shopify-section-' + id) || document.querySelector('[data-cf-id="' + id + '"]'); }
  function clearActive() { document.querySelectorAll('.cf-section-active').forEach(function(e) { e.classList.remove('cf-section-active'); }); }
  function highlight(id) { clearActive(); var el = getEl(id); if (el) { el.classList.add('cf-section-active'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } activeBlockId = id; }
  if (activeBlockId) requestAnimationFrame(function() { highlight(activeBlockId); });
  document.addEventListener('click', function(e) {
    e.preventDefault(); e.stopPropagation();
    var sec = e.target.closest('.shopify-section');
    if (sec) { var id = (sec.id || '').replace('shopify-section-', '') || sec.getAttribute('data-cf-id'); highlight(id); window.parent.postMessage({ type: 'SECTION_CLICKED', payload: { blockId: id } }, '*'); }
  }, true);
  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.type) return;
    var t = e.data.type, p = e.data.payload || {};
    if (t === 'shopify:section:select' && p.blockId) highlight(p.blockId);
    else if (t === 'shopify:section:deselect') { clearActive(); activeBlockId = null; }
    else if (t === 'shopify:section:load' && p.blockId && p.html) {
      var ex = getEl(p.blockId); if (ex) ex.outerHTML = p.html;
      else { var af = p.afterBlockId ? getEl(p.afterBlockId) : null; if (af) af.insertAdjacentHTML('afterend', p.html); else document.body.insertAdjacentHTML('beforeend', p.html); }
    }
    else if (t === 'shopify:section:remove' && p.blockId) { var el = getEl(p.blockId); if (el) el.remove(); }
    else if (t === 'shopify:section:reorder' && Array.isArray(p.order)) {
      var par = (document.querySelector('.shopify-section') || {}).parentElement || document.body;
      p.order.forEach(function(id) { var el = getEl(id); if (el) par.appendChild(el); });
    }
  });
  function ready() { window.parent.postMessage({ type: 'IFRAME_READY', payload: {} }, '*'); }
  if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready);
})();
</script>`;

    html = html.includes("</body>")
      ? html.replace("</body>", editorStyles + bridgeScript + "\n</body>")
      : html + editorStyles + bridgeScript;

  } catch (err) {
    console.error("[proxy] Fatal:", err);
    html = makeErrorHtml("unknown", STOREFRONT_PASSWORD, err.message);
  }

  return json({ html });
};

function makeErrorHtml(shop, pw, extraMsg = "") {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>body{font-family:-apple-system,sans-serif;padding:48px;color:#333;max-width:600px;margin:0 auto}h2{color:#d91f1f}a{color:#005bd3}ul{line-height:1.8}</style>
  </head><body>
  <div style="font-size:48px;margin-bottom:16px">🔒</div>
  <h2>${extraMsg || "Storefront Preview Blocked"}</h2>
  <p>Your store <strong>${shop}</strong> has a storefront password enabled.</p>
  <p>The proxy tried password <strong>"${pw}"</strong> but it was not accepted.</p>
  <p><strong>Fix options:</strong></p>
  <ul>
    <li>Go to <a href="https://${shop}/admin/online_store/preferences" target="_blank">Online Store &rsaquo; Preferences</a> and <strong>disable the storefront password</strong> (recommended for dev)</li>
    <li>Or verify the correct password and update <code>STOREFRONT_PASSWORD</code> in the proxy route</li>
  </ul>
  </body></html>`;
}
