// API Route: Returns rendered HTML preview of a Liquid template as JSON
// Used by the template preview modal in the editor sidebar via fetcher
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { readTemplateFile } from "../utils/templateInstaller.server";

export const loader = async ({ request }) => {
    await authenticate.admin(request);

    const url = new URL(request.url);
    const liquidFile = url.searchParams.get("file");

    if (!liquidFile) {
        return json({ error: "No file specified", html: "" }, { status: 400 });
    }

    const content = readTemplateFile(liquidFile);

    if (!content) {
        return json({ error: "Template not found", html: "" }, { status: 404 });
    }

    // Strip Shopify Liquid tags to create a visual preview
    let previewHtml = content;

    // Extract schema defaults
    const schemaMatch = content.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
    let defaults = {};

    if (schemaMatch) {
        try {
            const schema = JSON.parse(schemaMatch[1]);
            if (schema.settings) {
                schema.settings.forEach(s => {
                    if (s.default !== undefined) defaults[s.id] = s.default;
                });
            }
        } catch (e) { /* ignore parse errors */ }
    }

    // Remove schema block
    previewHtml = previewHtml.replace(/\{%\s*schema\s*%\}[\s\S]*?\{%\s*endschema\s*%\}/, '');

    // Convert stylesheet_tag to link tags
    previewHtml = previewHtml.replace(/\{\{[^}]*\|\s*stylesheet_tag\s*\}\}/g, (match) => {
        const urlMatch = match.match(/'([^']+)'/);
        if (urlMatch) return `<link rel="stylesheet" href="${urlMatch[1]}">`;
        return '';
    });

    // Replace section.settings with defaults
    previewHtml = previewHtml.replace(/\{\{\s*section\.settings\.(\w+)\s*\}\}/g, (match, key) => {
        return defaults[key] !== undefined ? String(defaults[key]) : '';
    });

    // Replace section.settings in filters
    previewHtml = previewHtml.replace(/\{\{\s*section\.settings\.(\w+)\s*\|[^}]*\}\}/g, (match, key) => {
        return defaults[key] !== undefined ? String(defaults[key]) : '';
    });

    // Remove Liquid control flow tags but keep content
    previewHtml = previewHtml.replace(/\{%-?\s*(if|unless|elsif|else|endif|endunless|for|endfor|comment|endcomment)\s*[^%]*-?%\}/g, '');

    // Remove remaining Liquid output tags
    previewHtml = previewHtml.replace(/\{\{[^}]*\}\}/g, '');

    // Convert style/endstyle tags
    previewHtml = previewHtml.replace(/\{%-?\s*style\s*-?%\}/g, '<style>');
    previewHtml = previewHtml.replace(/\{%-?\s*endstyle\s*-?%\}/g, '</style>');

    // Build full preview document
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#1a1a2e}img{max-width:100%;height:auto}</style>
</head>
<body>${previewHtml}</body>
</html>`;

    return json({ html: fullHtml });
};
