import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { readSectionFile } from "../lib/shopify.server";
import { simulateLiquidRendering } from "../lib/liquid-preview.server";

// Helper to render a single section
function renderSectionHtml(sectionType, settings, blockId) {
  const raw = readSectionFile(sectionType + '.liquid') || readSectionFile(sectionType);
  if (!raw) return '';
  const html = simulateLiquidRendering(raw, settings, blockId);
  return `<div id="shopify-section-${blockId}" class="shopify-section">${html}</div>`;
}

// POST /app/api/template-preview
export const action = async ({ request }) => {
  // must be authenticated (Shopify embedded context)
  await authenticate.admin(request);

  const formData = await request.formData();

  const blocksJson = formData.get("blocks"); // Optional array of full page blocks
  const sectionId = formData.get("sectionId"); // Used for single template preview
  const categoryId = formData.get("categoryId"); // Used for fetching a grid of templates
  const activeBlockId = formData.get("activeBlockId");

  let bodyHtml = '';

  if (blocksJson) {
    // Render FULL PAGE builder state
    let blocks = [];
    try { blocks = JSON.parse(blocksJson); } catch { }
    for (const b of blocks) {
      bodyHtml += renderSectionHtml(b.type, b.settings || {}, b.id);
    }
  } else if (sectionId) {
    // Render SINGLE TEMPLATE preview (e.g., hovering in template library)
    let settings = {};
    try { settings = JSON.parse(formData.get("settings") || "{}"); } catch { }
    const blockId = formData.get("blockId") || 'preview-section';
    bodyHtml = renderSectionHtml(sectionId, settings, blockId);
  } else if (categoryId) {
    // Render MULTIPLE TEMPLATES for Visual Grid Picker
    const { SECTION_FILES } = require("../lib/constants");
    const templates = Object.entries(SECTION_FILES).filter(([_, meta]) => meta.category === categoryId);

    const results = {};
    for (const [id, _] of templates) {
      // For grid previews we use empty settings to rely on placeholders
      results[id] = renderSectionHtml(id, {}, 'preview-grid-' + id);
    }
    // Return early with the JSON map, no full document needed for the grid snippets
    return json({ templates: results });
  } else {
    return json({ error: "Missing blocks, sectionId, or categoryId" }, { status: 400 });
  }

  const interactiveScript = `
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; min-height: 100vh; background: #fff; }
      img { max-width: 100%; height: auto; display: block; }
      a { text-decoration: none; color: inherit; }
      
      .shopify-section { outline: 2px solid transparent; transition: outline 0.15s; position: relative; }
      .shopify-section:hover { outline: 2px solid #2c6ecb; outline-offset: -2px; cursor: pointer; z-index: 10; }
      .shopify-section.active { outline: 3px solid #005bd3; outline-offset: -3px; z-index: 11; }
      
      /* Disable links and forms in the preview iframe to prevent Shopify routing errors */
      a, form, button { pointer-events: none !important; }
    </style>
    <script>
      // Cancel all click events on links to prevent 404 No Route Matches error
      document.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('form')) {
          e.preventDefault();
        }
      }, true);

      // Highlight active block if provided
      const activeId = '${activeBlockId || ''}';
      if (activeId) {
          const el = document.getElementById('shopify-section-' + activeId);
          if (el) el.classList.add('active');
      }

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

  return json({ html: fullHtml });
};
