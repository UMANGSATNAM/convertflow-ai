import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getThemeAsset, readSectionFile } from "../lib/shopify.server";
import { simulateLiquidRendering } from "../lib/liquid-preview.server";

// Helper to simulate Liquid rendering of a single section
function renderSectionHtml(sectionType, settings, blockId) {
  const raw = readSectionFile(sectionType + '.liquid') || readSectionFile(sectionType);
  if (!raw) return '';

  const html = simulateLiquidRendering(raw, settings, blockId);

  return `<div id="shopify-section-${blockId}" class="shopify-section">
      ${html}
    </div>`;
}

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const { shop, accessToken } = session;
  const url = new URL(request.url);
  const themeId = url.searchParams.get("themeId");

  try {
    // Fetch the index.json directly from the live theme via Admin API
    const indexStr = await getThemeAsset(shop, accessToken, themeId, 'templates/index.json');
    if (!indexStr) throw new Error("Could not load templates/index.json");

    const indexJson = JSON.parse(indexStr);
    const order = indexJson.order || [];
    const sections = indexJson.sections || {};

    let bodyHtml = '';

    // Render every section in order
    for (const blockId of order) {
      const type = sections[blockId]?.type;
      if (!type) continue;
      const settings = sections[blockId]?.settings || {};
      bodyHtml += renderSectionHtml(type, settings, blockId);
    }

    const interactiveScript = `
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; min-height: 100vh; background: #fff; }
      img { max-width: 100%; height: auto; display: block; }
      a { text-decoration: none; color: inherit; }
      
      .shopify-section { outline: 2px solid transparent; transition: outline 0.2s ease, box-shadow 0.2s ease; position: relative; }
      .shopify-section:hover { outline: 2px solid #2c6ecb; outline-offset: -2px; cursor: pointer; z-index: 10; }
      .shopify-section.active { outline: 3px solid #005bd3; outline-offset: -3px; z-index: 11; box-shadow: 0 0 0 4px rgba(0,91,211,0.15); }
      
      /* Disable navigation in preview */
      a[href], form, button:not(.cf-editor-btn) { pointer-events: none !important; }
      .shopify-section { pointer-events: auto !important; }
    </style>
    <script>
      (function() {
        'use strict';
        let activeBlockId = '';
        
        function getSectionEl(blockId) { return document.getElementById('shopify-section-' + blockId); }
        function clearAllActive() { document.querySelectorAll('.shopify-section.active').forEach(el => el.classList.remove('active')); }
        function highlightSection(blockId) {
          clearAllActive();
          const el = getSectionEl(blockId);
          if (el) { el.classList.add('active'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          activeBlockId = blockId;
        }
        
        document.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          const section = e.target.closest('.shopify-section');
          if (section) {
            const blockId = section.id.replace('shopify-section-', '');
            highlightSection(blockId);
            window.parent.postMessage({ type: 'SECTION_CLICKED', payload: { blockId } }, '*');
          }
        }, true);
        
        window.addEventListener('message', (event) => {
          if (!event.data || !event.data.type) return;
          const { type, payload } = event.data;
          switch (type) {
            case 'shopify:section:select': if (payload?.blockId) highlightSection(payload.blockId); break;
            case 'shopify:section:deselect': clearAllActive(); activeBlockId = null; break;
            case 'shopify:section:reorder':
              if (!payload?.order || !Array.isArray(payload.order)) break;
              payload.order.forEach(id => { const el = getSectionEl(id); if (el) document.body.appendChild(el); });
              break;
            case 'shopify:section:load':
              if (payload?.blockId && payload?.html) {
                const existing = getSectionEl(payload.blockId);
                if (existing) existing.outerHTML = payload.html;
                else document.body.insertAdjacentHTML('beforeend', payload.html);
                if (activeBlockId === payload.blockId) requestAnimationFrame(() => highlightSection(payload.blockId));
              }
              break;
            case 'shopify:section:remove':
              if (payload?.blockId) {
                const el = getSectionEl(payload.blockId);
                if (el) el.remove();
                if (activeBlockId === payload.blockId) activeBlockId = null;
              }
              break;
          }
        });
      })();
    </script>`;

    const fullHtml = `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          ${interactiveScript}
        </head>
        <body>
          ${bodyHtml}
        </body>
        </html>`;

    return new Response(fullHtml, {
      headers: {
        "Content-Type": "text/html",
        "Content-Security-Policy": "frame-ancestors 'self' https://*.shopifyapps.com https://admin.shopify.com;"
      }
    });
  } catch (e) {
    return new Response("Error loading live theme preview: " + e.message, { status: 500 });
  }
};
