import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { readSectionFile } from "../lib/shopify.server";
import { simulateLiquidRendering } from "../lib/liquid-preview.server";

// POST /app/api/template-preview
// body: sectionId=..., settings=JSON
export const action = async ({ request }) => {
  // must be authenticated (Shopify embedded context)
  await authenticate.admin(request);

  const formData = await request.formData();
  const sectionId = formData.get("sectionId");
  const blockId = formData.get("blockId");
  if (!sectionId) return json({ error: "Missing sectionId" }, { status: 400 });

  // Try both "id.liquid" and raw "id" lookups
  const raw = readSectionFile(sectionId + '.liquid') || readSectionFile(sectionId);
  if (!raw) return json({ error: "Section not found: " + sectionId }, { status: 404 });

  let settings = {};
  try { settings = JSON.parse(formData.get("settings") || "{}"); } catch { }

  const html = simulateLiquidRendering(raw, settings, blockId || 'preview-section');

  const interactiveScript = blockId ? `<script>
      document.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: 'SECTION_CLICK', id: '${blockId}' }, '*');
      });
      document.body.style.cursor = 'pointer';
      document.body.addEventListener('mouseenter', () => document.body.style.outline = '2px solid #2c6ecb');
      document.body.addEventListener('mouseleave', () => document.body.style.outline = 'none');
    </script>` : '';

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; min-height: 100vh; }
    img { max-width: 100%; height: auto; display: block; }
    a { text-decoration: none; color: inherit; }
  </style>
</head>
<body>
${html}
${interactiveScript}
</body>
</html>`;

  return json({ html: fullHtml });
};

function getDefaultPlaceholder(key) {
  if (key.includes('color')) return '#111111';
  if (key.includes('bg')) return '#ffffff';
  if (key.includes('height') || key.includes('width') || key.includes('size') || key.includes('padding')) return '80';
  if (key.includes('text') || key.includes('title') || key.includes('heading')) return 'Sample Text';
  return '';
}
