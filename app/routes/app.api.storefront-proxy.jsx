import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

/**
 * GET /app/api/storefront-proxy?page=home|product
 *
 * Called via React fetch() from Canvas.jsx (carries session cookie).
 * Returns: { html: "<full storefront HTML with editor bridge>" }
 *
 * ── Key fix: use headers.getSetCookie() (Node 18+) to capture ALL
 *    Set-Cookie headers, not just the first one. headers.get('set-cookie')
 *    only returns the first header, dropping _shopify_essential etc.
 *
 * Password bypass (3-step):
 *  1. GET /password  → CSRF token + ALL initial cookies
 *  2. POST /password → ALL post cookies (includes _shopify_essential auth)
 *  3. GET /page      → combine all cookies → should get real page
 *
 * Client-side fallback: if still on password page, inject auto-submit JS.
 */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "home";
  const activeBlockId = url.searchParams.get("activeBlockId") || "";
  const STOREFRONT_PASSWORD = "1";

  const pathMap = { home: "/", product: "/products", collection: "/collections/all", cart: "/cart" };
  const storefrontBase = `https://${shop}`;
  const storefrontUrl = `${storefrontBase}${pathMap[page] || "/"}`;

  // ── Helper: get ALL Set-Cookie header values (Node 18+ getSetCookie) ──
  function getAllSetCookies(headers) {
    // getSetCookie() returns array of individual Set-Cookie strings (Node 18+)
    if (typeof headers.getSetCookie === "function") {
      return headers.getSetCookie();
    }
    // Fallback: get() returns comma-joined, split carefully
    const raw = headers.get("set-cookie") || "";
    return raw ? raw.split(/,(?=[^ ]+=[^,;]+(?:;|$))/) : [];
  }

  function parseCookies(headers) {
    return getAllSetCookies(headers)
      .map(c => c.split(";")[0].trim())
      .filter(Boolean);
  }

  function joinCookies(...arrays) {
    const seen = new Map();
    for (const arr of arrays) {
      for (const c of arr) {
        const [name] = c.split("=");
        seen.set(name.trim(), c); // later wins (overwrite with fresher value)
      }
    }
    return [...seen.values()].join("; ");
  }

  let html = "";
  try {
    // ── Step 1: GET /password ──────────────────────────────────────────
    let combinedCookies = "";
    try {
      const pwPageRes = await fetch(`${storefrontBase}/password`, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
        redirect: "follow",
      });
      const pwHtml = await pwPageRes.text();

      const csrfMatch =
        pwHtml.match(/name="authenticity_token"\s+value="([^"]+)"/) ||
        pwHtml.match(/authenticity_token[^>]*value="([^"]+)"/);
      const csrfToken = csrfMatch ? csrfMatch[1] : "";

      const getCookies = parseCookies(pwPageRes.headers);

      console.log("[proxy] CSRF:", csrfToken ? "found" : "MISSING");
      console.log("[proxy] GET cookies:", getCookies.join("; ").slice(0, 120));

      // ── Step 2: POST /password ────────────────────────────────────────
      const pwForm = new URLSearchParams({
        form_type: "storefront_password",
        "utf8": "\u2713",
        password: STOREFRONT_PASSWORD,
        ...(csrfToken ? { authenticity_token: csrfToken } : {}),
      });

      const cookieHeader = joinCookies(getCookies);
      const pwPostRes = await fetch(`${storefrontBase}/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0",
          Origin: storefrontBase,
          Referer: `${storefrontBase}/password`,
          Accept: "text/html,application/xhtml+xml",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        body: pwForm.toString(),
        redirect: "manual",
      });

      const postCookies = parseCookies(pwPostRes.headers);
      const postLocation = pwPostRes.headers.get("location") || "";

      console.log("[proxy] POST status:", pwPostRes.status, "→", postLocation.slice(0, 60));
      console.log("[proxy] POST cookies:", postCookies.join("; ").slice(0, 200));

      // Merge: POST cookies override GET cookies (fresher session)
      combinedCookies = joinCookies(getCookies, postCookies);
      console.log("[proxy] Combined cookie count:", combinedCookies.split(";").length);

    } catch (e) {
      console.warn("[proxy] Password bypass error:", e.message);
    }

    // ── Step 3: Fetch the actual storefront page ───────────────────────
    const fetchHeaders = {
      "User-Agent": "Mozilla/5.0",
      Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      ...(combinedCookies ? { Cookie: combinedCookies } : {}),
    };

    let fetchUrl = storefrontUrl;
    let pageRes = await fetch(fetchUrl, { headers: fetchHeaders, redirect: "manual" });
    let hops = 0;

    while ([301, 302, 303, 307, 308].includes(pageRes.status) && hops < 5) {
      const loc = pageRes.headers.get("location") || "";
      console.log(`[proxy] GET Redirect ${hops + 1}: ${loc.slice(0, 80)}`);

      if (loc.includes("accounts.shopify.com")) {
        return json({ html: makeErrorHtml(shop, STOREFRONT_PASSWORD, "Shopify redirected to customer accounts") });
      }
      fetchUrl = loc.startsWith("http") ? loc : `${storefrontBase}${loc}`;
      pageRes = await fetch(fetchUrl, { headers: fetchHeaders, redirect: "manual" });
      hops++;
    }

    html = await pageRes.text();

    // ── If still on password page → inject client-side auto-submit ─────
    const isPasswordPage =
      html.includes("storefront_password") ||
      html.includes("store is password protected") ||
      html.includes("Enter store password");

    if (isPasswordPage) {
      console.log("[proxy] Still on password page — injecting browser auto-submit");

      html = rewriteUrls(html, storefrontBase);

      // Script: fills & submits the password form in the BROWSER
      // After success, the iframe navigates to / naturally (Shopify sets cookie in browser)
      // Then Canvas (listening to onLoad) can re-fetch with the now-authed browser session
      const autoSubmit = `
<script>
(function(){
  var pw = ${JSON.stringify(STOREFRONT_PASSWORD)};
  function trySubmit() {
    var input = document.querySelector('input[type="password"], input[name="password"]');
    var form = input && input.closest('form');
    if (!form || !input) return;
    input.value = pw;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
    console.log('[cf] Auto-submitting storefront password form...');
    form.submit();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(trySubmit, 200); });
  else setTimeout(trySubmit, 200);
  window.parent.postMessage({type:'CF_ON_PASSWORD_PAGE',payload:{}},'*');
})();
</script>`;

      html = html.includes("</body>") ? html.replace("</body>", autoSubmit + "\n</body>") : html + autoSubmit;
      return json({ html, isPasswordPage: true });
    }

    // ── SUCCESS ────────────────────────────────────────────────────────
    html = rewriteUrls(html, storefrontBase);
    html = injectBridge(html, activeBlockId);
    console.log("[proxy] SUCCESS — page length:", html.length);
    return json({ html });

  } catch (err) {
    console.error("[proxy] Fatal:", err);
    return json({ html: makeErrorHtml(shop, STOREFRONT_PASSWORD, err.message) });
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────

function rewriteUrls(html, base) {
  html = html.replace(/(src|href|action)="(\/[^"]*?)"/g, (_, a, p) =>
    p.startsWith("//") ? `${a}="${p}"` : `${a}="${base}${p}"`);
  html = html.replace(/srcset="([^"]*)"/g, (_, v) =>
    `srcset="${v.replace(/(^|\s|,)(\/[^\s,]+)/g, (__, pfx, p) => `${pfx}${base}${p}`)}"`);
  html = html.replace(/url\((['"]?)(\/[^)'"]+)\1\)/g, (_, q, p) => `url(${q}${base}${p}${q})`);
  html = html.replace(/<base[^>]*>/gi, "");
  return html.includes("<head>")
    ? html.replace("<head>", `<head>\n  <base href="${base}/">`)
    : `<base href="${base}/">` + html;
}

function injectBridge(html, activeBlockId) {
  const styles = `
<style id="cf-editor-styles">
  a[href], form { pointer-events: none !important; }
  .shopify-section { pointer-events: auto !important; cursor: pointer; position: relative;
    outline: 2px solid transparent; transition: outline 0.15s ease; }
  .shopify-section:hover { outline: 2px solid #2c6ecb; outline-offset: -2px; z-index: 10; }
  .cf-section-active { outline: 3px solid #005bd3 !important; outline-offset: -3px !important;
    z-index: 11 !important; box-shadow: 0 0 0 4px rgba(0,91,211,0.15) !important; }
  .shopify-section::before { content: attr(data-cf-id); position: absolute; top: 6px; left: 6px;
    background: #005bd3; color: #fff; font: 600 10px/1 -apple-system,sans-serif;
    padding: 3px 8px; border-radius: 4px; opacity: 0; transition: opacity 0.15s;
    pointer-events: none; z-index: 9999; white-space: nowrap; }
  .shopify-section:hover::before { opacity: 1 !important; }
</style>`;

  const script = `
<script id="cf-editor-bridge">
(function(){
  var a=${JSON.stringify(activeBlockId)};
  document.querySelectorAll('.shopify-section').forEach(function(el){
    var id=(el.id||'').replace('shopify-section-',''); el.setAttribute('data-cf-id',id||el.id);});
  function g(id){return document.getElementById('shopify-section-'+id)||document.querySelector('[data-cf-id="'+id+'"]');}
  function clr(){document.querySelectorAll('.cf-section-active').forEach(function(e){e.classList.remove('cf-section-active');});}
  function hi(id){clr();var el=g(id);if(el){el.classList.add('cf-section-active');el.scrollIntoView({behavior:'smooth',block:'center'});}a=id;}
  if(a) requestAnimationFrame(function(){hi(a);});
  document.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    var s=e.target.closest('.shopify-section');
    if(s){var id=(s.id||'').replace('shopify-section-','')||s.getAttribute('data-cf-id');hi(id);window.parent.postMessage({type:'SECTION_CLICKED',payload:{blockId:id}},'*');}
  },true);
  window.addEventListener('message',function(e){
    if(!e.data||!e.data.type)return;
    var t=e.data.type,p=e.data.payload||{};
    if(t==='shopify:section:select'&&p.blockId)hi(p.blockId);
    else if(t==='shopify:section:deselect'){clr();a=null;}
    else if(t==='shopify:section:load'&&p.blockId&&p.html){var ex=g(p.blockId);if(ex)ex.outerHTML=p.html;else{var af=p.afterBlockId?g(p.afterBlockId):null;if(af)af.insertAdjacentHTML('afterend',p.html);else document.body.insertAdjacentHTML('beforeend',p.html);}}
    else if(t==='shopify:section:remove'&&p.blockId){var el=g(p.blockId);if(el)el.remove();}
    else if(t==='shopify:section:reorder'&&Array.isArray(p.order)){var par=(document.querySelector('.shopify-section')||{}).parentElement||document.body;p.order.forEach(function(id){var el=g(id);if(el)par.appendChild(el);});}
  });
  function rdy(){window.parent.postMessage({type:'IFRAME_READY',payload:{}},'*');}
  if(document.readyState==='complete')rdy();else window.addEventListener('load',rdy);
})();
</script>`;

  const inject = styles + script;
  return html.includes("</body>") ? html.replace("</body>", inject + "\n</body>") : html + inject;
}

function makeErrorHtml(shop, pw, msg = "") {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>body{font-family:-apple-system,sans-serif;padding:48px;color:#333;max-width:600px;margin:0 auto}h2{color:#d91f1f}a{color:#005bd3}ul{line-height:1.8}code{background:#f4f4f4;padding:2px 6px;border-radius:3px}</style>
  </head><body>
  <div style="font-size:48px;margin-bottom:16px">🔒</div>
  <h2>${msg || "Storefront Preview Blocked"}</h2>
  <p>The fastest fix for a dev store: go to <a href="https://${shop}/admin/online_store/preferences" target="_blank">Online Store &rsaquo; Preferences</a> and <strong>disable the storefront password</strong>. For production stores, update <code>STOREFRONT_PASSWORD</code> in the proxy route.</p>
  </body></html>`;
}
