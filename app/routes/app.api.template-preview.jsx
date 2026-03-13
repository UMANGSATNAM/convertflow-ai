import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { readSectionFile } from "../lib/shopify.server";
import { simulateLiquidRendering } from "../lib/liquid-preview.server";
import { SECTION_FILES } from "../lib/constants";

function renderSectionHtml(sectionType, settings, blockId) {
  const raw = readSectionFile(sectionType + '.liquid') || readSectionFile(sectionType);
  if (!raw) return null;
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
    // Render SINGLE TEMPLATE preview
    let settings = {};
    try { settings = JSON.parse(formData.get("settings") || "{}"); } catch { }
    const blockId = formData.get("blockId") || 'preview-section';
    const html = renderSectionHtml(sectionId, settings, blockId);
    if (html === null) return json({ ignored: true, message: "Native section locally simulated rendering not supported." });
    bodyHtml = html;
  } else if (categoryId) {
    // Render MULTIPLE TEMPLATES for Visual Grid Picker
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
        
        // ── State ──────────────────────────────────────────────
        let activeBlockId = '${activeBlockId || ''}';
        
        // ── Helpers ────────────────────────────────────────────
        function getSectionEl(blockId) {
          return document.getElementById('shopify-section-' + blockId);
        }
        
        function clearAllActive() {
          document.querySelectorAll('.shopify-section.active').forEach(el => el.classList.remove('active'));
        }
        
        function highlightSection(blockId) {
          clearAllActive();
          const el = getSectionEl(blockId);
          if (el) {
            el.classList.add('active');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          activeBlockId = blockId;
        }
        
        // ── Initial highlight ──────────────────────────────────
        if (activeBlockId) {
          requestAnimationFrame(() => highlightSection(activeBlockId));
        }
        
        // ── Click handler (Iframe → Parent) ────────────────────
        document.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const section = e.target.closest('.shopify-section');
          if (section) {
            const blockId = section.id.replace('shopify-section-', '');
            highlightSection(blockId);
            window.parent.postMessage({ type: 'SECTION_CLICKED', payload: { blockId } }, '*');
          }
        }, true);
        
        // ── Message handler (Parent → Iframe) ──────────────────
        window.addEventListener('message', (event) => {
          if (!event.data || !event.data.type) return;
          const { type, payload } = event.data;
          
          switch (type) {
            // ── Select: Highlight + Scroll ──────────────────────
            case 'shopify:section:select': {
              if (payload?.blockId) highlightSection(payload.blockId);
              break;
            }
            
            // ── Deselect: Remove all highlights ─────────────────
            case 'shopify:section:deselect': {
              clearAllActive();
              activeBlockId = null;
              break;
            }
            
            // ── Reorder: Move DOM nodes to match new order ──────
            case 'shopify:section:reorder': {
              if (!payload?.order || !Array.isArray(payload.order)) break;
              const container = document.body;
              for (const blockId of payload.order) {
                const el = getSectionEl(blockId);
                if (el) container.appendChild(el);
              }
              break;
            }
            
            // ── Setting Update: CSS Variable injection ──────────
            case 'shopify:setting:update': {
              if (payload?.key && payload?.value !== undefined) {
                document.documentElement.style.setProperty('--' + payload.key, payload.value);
              }
              break;
            }
            
            // ── Load: Inject new section HTML ───────────────────
            case 'shopify:section:load': {
              if (payload?.blockId && payload?.html) {
                const existing = getSectionEl(payload.blockId);
                if (existing) {
                  existing.outerHTML = payload.html;
                } else {
                  document.body.insertAdjacentHTML('beforeend', payload.html);
                }
                // Re-highlight if this was the active block
                if (activeBlockId === payload.blockId) {
                  requestAnimationFrame(() => highlightSection(payload.blockId));
                }
              }
              break;
            }
            
            // ── Remove: Delete section DOM node ─────────────────
            case 'shopify:section:remove': {
              if (payload?.blockId) {
                const el = getSectionEl(payload.blockId);
                if (el) el.remove();
                if (activeBlockId === payload.blockId) {
                  activeBlockId = null;
                }
              }
              break;
            }
          }
        });
        
        // ── Signal ready to parent ─────────────────────────────
        window.parent.postMessage({ type: 'IFRAME_READY', payload: {} }, '*');
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

  return json({ html: fullHtml, sectionHtml: bodyHtml });
};
