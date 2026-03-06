// API Route: Returns rendered HTML preview of a Liquid template
// Used by the template preview modal in the editor sidebar
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { readTemplateFile } from "../utils/templateInstaller.server";

export const loader = async ({ request }) => {
    await authenticate.admin(request);

    const url = new URL(request.url);
    const liquidFile = url.searchParams.get("file");

    if (!liquidFile) {
        return json({ error: "No file specified" }, { status: 400 });
    }

    const content = readTemplateFile(liquidFile);

    if (!content) {
        return json({ error: "Template not found" }, { status: 404 });
    }

    // Strip Shopify Liquid tags to create a visual preview
    // Replace {{ section.settings.xxx }} with defaults from the schema
    let previewHtml = content;

    // Extract schema defaults
    const schemaMatch = content.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
    let defaults = {};
    let blockDefaults = [];

    if (schemaMatch) {
        try {
            const schema = JSON.parse(schemaMatch[1]);

            // Collect setting defaults
            if (schema.settings) {
                schema.settings.forEach(s => {
                    if (s.default !== undefined) defaults[s.id] = s.default;
                });
            }

            // Collect preset block defaults
            if (schema.presets?.[0]?.blocks) {
                blockDefaults = schema.presets[0].blocks;
            }
        } catch (e) {
            // Schema parse error, continue with empty defaults
        }
    }

    // Remove schema block from preview
    previewHtml = previewHtml.replace(/\{%\s*schema\s*%\}[\s\S]*?\{%\s*endschema\s*%\}/, '');

    // Remove Liquid tags (stylesheet_tag, comment, endcomment, style, endstyle are kept as-is)
    previewHtml = previewHtml.replace(/\{\{[^}]*\|\s*stylesheet_tag\s*\}\}/g, (match) => {
        // Extract the URL from the stylesheet tag and return a <link> tag
        const urlMatch = match.match(/'([^']+)'/);
        if (urlMatch) return `<link rel="stylesheet" href="${urlMatch[1]}">`;
        return '';
    });

    // Replace section.settings references with defaults
    previewHtml = previewHtml.replace(/\{\{\s*section\.settings\.(\w+)\s*\}\}/g, (match, key) => {
        return defaults[key] !== undefined ? String(defaults[key]) : '';
    });

    // Replace section.settings references in filters (like | times: 0.01)
    previewHtml = previewHtml.replace(/\{\{\s*section\.settings\.(\w+)\s*\|[^}]*\}\}/g, (match, key) => {
        return defaults[key] !== undefined ? String(defaults[key]) : '';
    });

    // Remove Liquid control flow tags (if, for, unless, etc.) but keep content
    previewHtml = previewHtml.replace(/\{%-?\s*(if|unless|elsif|else|endif|endunless|for|endfor|comment|endcomment)\s*[^%]*-?%\}/g, '');

    // Remove remaining Liquid output tags
    previewHtml = previewHtml.replace(/\{\{[^}]*\}\}/g, '');

    // Remove {%- style -%} and {%- endstyle -%} tags, keep CSS inside
    previewHtml = previewHtml.replace(/\{%-?\s*style\s*-?%\}/g, '<style>');
    previewHtml = previewHtml.replace(/\{%-?\s*endstyle\s*-?%\}/g, '</style>');

    // Remove block.shopify_attributes
    previewHtml = previewHtml.replace(/\{\{\s*block\.shopify_attributes\s*\}\}/g, '');

    // Remove section.id references
    previewHtml = previewHtml.replace(/\{\{\s*section\.id\s*\}\}/g, 'preview');

    // Build the full preview HTML document
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #1a1a2e; }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
${previewHtml}
</body>
</html>
    `.trim();

    return new Response(fullHtml, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
};
