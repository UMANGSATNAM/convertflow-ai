import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

/**
 * GET /app/api/storefront-proxy?page=home|product&themeId=XXX
 *
 * Simple proxy — no password bypass needed (store password removed).
 * Uses ?preview_theme_id=THEME_ID to show the exact theme being edited.
 * Returns { html } for Canvas.jsx srcDoc rendering.
 */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "home";
  const themeId = url.searchParams.get("themeId") || "";
  const activeBlockId = url.searchParams.get("activeBlockId") || "";

  const pathMap = {
    home: "/",
    product: "/products",
    collection: "/collections/all",
    cart: "/cart",
  };

  const storefrontBase = `https://${shop}`;
  const previewParam = themeId ? `?preview_theme_id=${themeId}` : "";
  const storefrontUrl = `${storefrontBase}${pathMap[page] || "/"}${previewParam}`;

  console.log("[proxy] Fetching:", storefrontUrl);

  let html = "";
  try {
    const response = await fetch(storefrontUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 ConvertFlow-AI/1.0",
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
    });

    console.log("[proxy] Status:", response.status);

    if (!response.ok) {
      return json({ html: errorHtml(shop, `HTTP ${response.status}`) });
    }

    html = await response.text();

    // Detect password page (just in case)
    if (html.includes("storefront_password") || html.includes("store is password protected")) {
      return json({ html: errorHtml(shop, "Storefront password is still enabled. Please disable it in Online Store → Preferences.") });
    }

    // Rewrite relative URLs to absolute
    html = html.replace(/(src|href|action)="(\/[^"]*?)"/g, (_, a, p) =>
      p.startsWith("//") ? `${a}="${p}"` : `${a}="${storefrontBase}${p}"`);
    html = html.replace(/srcset="([^"]*)"/g, (_, v) =>
      `srcset="${v.replace(/(^|\s|,)(\/[^\s,]+)/g, (__, pfx, p) => `${pfx}${storefrontBase}${p}`)}"`);
    html = html.replace(/url\((['"]?)(\/[^)'"]+)\1\)/g, (_, q, p) => `url(${q}${storefrontBase}${p}${q})`);
    html = html.replace(/<base[^>]*>/gi, "");
    html = html.includes("<head>")
      ? html.replace("<head>", `<head>\n  <base href="${storefrontBase}/">`)
      : `<base href="${storefrontBase}/">` + html;

    // Inject editor bridge
    const bridge = `
<style id="cf-editor-styles">
  a[href], form { pointer-events: none !important; }
  .shopify-section { pointer-events: auto !important; cursor: pointer; position: relative; outline: 2px solid transparent; transition: outline 0.15s ease; }
  .shopify-section:hover { outline: 2px solid #2c6ecb; outline-offset: -2px; z-index: 10; }
  .cf-section-active { outline: 3px solid #005bd3 !important; outline-offset: -3px !important; z-index: 11 !important; box-shadow: 0 0 0 4px rgba(0,91,211,0.15) !important; }
  .shopify-section::before { content: attr(data-cf-id); position: absolute; top: 6px; left: 6px; background: #005bd3; color: #fff; font: 600 10px/1 -apple-system,sans-serif; padding: 3px 8px; border-radius: 4px; opacity: 0; transition: opacity 0.15s; pointer-events: none; z-index: 9999; white-space: nowrap; }
  .shopify-section:hover::before { opacity: 1 !important; }
</style>
<script id="cf-editor-bridge">
(function(){
  var a=${JSON.stringify(activeBlockId)};
  document.querySelectorAll('.shopify-section').forEach(function(el){
    var id=(el.id||'').replace('shopify-section-',''); el.setAttribute('data-cf-id',id||el.id);
  });
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
    else if(t==='shopify:section:load'&&p.blockId&&p.html){var ex=g(p.blockId);if(ex)ex.outerHTML=p.html;else document.body.insertAdjacentHTML('beforeend',p.html);}
    else if(t==='shopify:section:remove'&&p.blockId){var el=g(p.blockId);if(el)el.remove();}
  });
  function rdy(){window.parent.postMessage({type:'IFRAME_READY',payload:{}},'*');}
  if(document.readyState==='complete')rdy();else window.addEventListener('load',rdy);
})();
</script>`;

    html = html.includes("</body>")
      ? html.replace("</body>", bridge + "\n</body>")
      : html + bridge;

    console.log("[proxy] SUCCESS — length:", html.length);
    return json({ html });

  } catch (err) {
    console.error("[proxy] Error:", err);
    return json({ html: errorHtml(shop, err.message) });
  }
};

function errorHtml(shop, msg) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,sans-serif;padding:48px;color:#333;max-width:600px;margin:0 auto}h2{color:#d91f1f}a{color:#005bd3}</style></head><body>
  <div style="font-size:48px">⚠️</div><h2>Preview Error</h2><p>${msg}</p>
  <p><a href="https://${shop}" target="_blank">Open ${shop} directly ↗</a></p>
  </body></html>`;
}
