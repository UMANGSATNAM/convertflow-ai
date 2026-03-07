import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { readSectionFile } from "../lib/shopify.server";

// POST /app/api/template-preview
// body: sectionId=..., settings=JSON
export const action = async ({ request }) => {
    // must be authenticated (Shopify embedded context)
    await authenticate.admin(request);

    const formData = await request.formData();
    const sectionId = formData.get("sectionId");
    if (!sectionId) return json({ error: "Missing sectionId" }, { status: 400 });

    // Try both "id.liquid" and raw "id" lookups
    const raw = readSectionFile(sectionId + '.liquid') || readSectionFile(sectionId);
    if (!raw) return json({ error: "Section not found: " + sectionId }, { status: 404 });

    let settings = {};
    try { settings = JSON.parse(formData.get("settings") || "{}"); } catch { }

    // ── Render HTML from Liquid (regex-based, no Liquid engine) ──────────
    let html = raw;

    // 1. Remove schema block entirely
    html = html.replace(/\{%-?\s*schema\s*-?%\}[\s\S]*?\{%-?\s*endschema\s*-?%\}/g, '');

    // 2. Convert style blocks to HTML style tags
    html = html.replace(/\{%-?\s*style\s*-?%\}/g, '<style>');
    html = html.replace(/\{%-?\s*endstyle\s*-?%\}/g, '</style>');

    // 3. Inject user settings into CSS custom-property assignments (inside <style> blocks)
    //    Replace --var: {{ section.settings.key }}px  →  --var: 80px
    html = html.replace(/\{\{\s*section\.settings\.([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
        return settings[key] !== undefined ? String(settings[key]) : getDefaultPlaceholder(key);
    });

    // 4. Handle simple if/unless for settings booleans
    html = html.replace(
        /\{%-?\s*if\s+section\.settings\.([a-zA-Z0-9_]+)\s*-?%\}([\s\S]*?)\{%-?\s*endif\s*-?%\}/g,
        (_, key, inner) => (settings[key] === false ? '' : inner)
    );
    html = html.replace(
        /\{%-?\s*unless\s+section\.settings\.([a-zA-Z0-9_]+)\s*-?%\}([\s\S]*?)\{%-?\s*endunless\s*-?%\}/g,
        (_, key, inner) => (settings[key] !== false ? '' : inner)
    );

    // 5. Replace common Liquid variables
    html = html.replace(/\{\{\s*routes\.[a-zA-Z0-9_]+\s*\}\}/g, '#');
    html = html.replace(/\{\{\s*shop\.name\s*\}\}/g, 'Preview Store');
    html = html.replace(/\{\{\s*cart\.item_count\s*\}\}/g, '0');
    html = html.replace(/\{\{\s*section\.id\s*\}\}/g, 'preview-section');

    // 6. Strip remaining Liquid tags/variables
    html = html.replace(/\{%-?.*?-?%\}/gs, '');
    html = html.replace(/\{\{.*?\}\}/gs, '');

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
