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

    // Add our interactive wrapper script and global CSS resets
    const interactiveScript = `
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          body { 
            margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; 
            min-height: 100vh; background: #fff;
          }
          img { max-width: 100%; height: auto; display: block; }
          a { text-decoration: none; color: inherit; }

          .shopify-section:hover {
             outline: 2px solid #2c6ecb !important;
             outline-offset: -2px;
             cursor: pointer !important;
          }
        </style>
        <script>
          document.addEventListener('click', (e) => {
            const section = e.target.closest('.shopify-section');
            if (section) {
                e.preventDefault();
                e.stopPropagation();
                const blockId = section.id.replace('shopify-section-', '');
                window.parent.postMessage({ type: 'SECTION_CLICK', id: blockId }, '*');
            }
          }, true);
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
