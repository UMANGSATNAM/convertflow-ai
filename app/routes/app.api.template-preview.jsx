import { json } from "@remix-run/node";
import { readSectionFile } from "../lib/shopify.server";

export const action = async ({ request }) => {
    const formData = await request.formData();
    const sectionId = formData.get("sectionId");

    if (!sectionId) return json({ error: "Missing sectionId" }, { status: 400 });

    let rawLiquid = readSectionFile(sectionId + '.liquid') || readSectionFile(sectionId);
    if (!rawLiquid) return json({ error: "Section not found" }, { status: 404 });

    // 1. Extract Settings JSON from FormData
    let settings = {};
    const settingsJson = formData.get("settings");
    if (settingsJson) {
        try { settings = JSON.parse(settingsJson); } catch (e) { }
    }

    // 2. Mock Liquid Drops (Fallback if actual Liquid parsing fails in preview)
    const mockShop = { name: "Preview Store" };
    const mockCart = { item_count: 2 };
    const mockRoutes = {
        root_url: "/",
        search_url: "/search",
        account_url: "/account",
        account_login_url: "/account/login",
        cart_url: "/cart"
    };

    // 3. Render pure HTML preview
    // * Note: To keep the preview fast and lightweight within the local app editor,
    // we do simple Regex replacements for section.settings and routes.
    // This avoids entirely spinning up a heavy Liquid engine in the browser.

    let html = rawLiquid;

    // Strip {% schema %} entirely
    html = html.replace(/{% schema %}[\s\S]*?{% endschema %}/g, "");

    // Strip {% style %} tags
    html = html.replace(/{%-?\s*style\s*-?%}/g, "<style>");
    html = html.replace(/{%-?\s*endstyle\s*-?%}/g, "</style>");

    // Replace {{ section.settings.xyz }}
    html = html.replace(/\{\{\s*section\.settings\.([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
        // If user provided a setting, use it. Otherwise, return a placeholder
        if (settings[key] !== undefined) return settings[key];
        return `/* ${key} */`;
    });

    // Replace Routes
    html = html.replace(/\{\{\s*routes\.([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => mockRoutes[key] || "#");
    html = html.replace(/\{\{\s*shop\.name\s*\}\}/g, mockShop.name);
    html = html.replace(/\{\{\s*cart\.item_count\s*\}\}/g, mockCart.item_count);

    // Replace Checkboxes / If statements
    // Simplistic replacement for the preview: Assume checking for settings is always true
    html = html.replace(/{%-?\s*if\s+section\.settings\.([a-zA-Z0-9_]+)\s*-?%}([\s\S]*?){%-?\s*endif\s*-?%}/g, (m, key, inner) => {
        if (settings[key] === false) return "";
        return inner;
    });

    // Strip other common Liquid logic tags
    html = html.replace(/{%-?\s*(if|else|elsif|for|endfor|endif|render|include|assign|capture|endcapture|comment|endcomment).*-?%}/g, "");

    // Wrap in boilerplate so styles apply inside the iframe
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
              body { margin: 0; padding: 0; font-family: -apple-system, sans-serif; }
              * { box-sizing: border-box; }
              img { max-width: 100%; height: auto; }
          </style>
      </head>
      <body>
          ${html}
          <script>
            // Auto-resize iframe script
            const resizeObserver = new ResizeObserver(entries => {
              window.parent.postMessage({ type: 'resize', height: document.body.scrollHeight }, '*');
            });
            resizeObserver.observe(document.body);
          </script>
      </body>
      </html>
  `;

    return json({ html: fullHtml });
};
