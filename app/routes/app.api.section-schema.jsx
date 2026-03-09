import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { readSectionFile } from "../lib/shopify.server";
import { removeSchemaTranslations } from "../lib/schema-fixer.server";
import { SECTION_FILES } from "../lib/constants";

/**
 * GET /app/api/section-schema?id=cf-header-premium
 * Returns the parsed schema settings for a section (used by the theme editor right panel).
 */
export const loader = async ({ request }) => {
    await authenticate.admin(request);
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    const meta = SECTION_FILES[id];
    if (!meta) return json({ settings: [], name: '' });

    let liquid = readSectionFile(meta.file);
    if (!liquid) return json({ settings: [], name: meta.name });

    liquid = removeSchemaTranslations(liquid);

    const m = liquid.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
    if (!m) return json({ settings: [], name: meta.name });

    try {
        const schema = JSON.parse(m[1].trim());
        const ALLOWED = ['text', 'color', 'color_background', 'range', 'checkbox', 'select', 'textarea'];
        const settings = (schema.settings || []).filter(s => ALLOWED.includes(s.type));
        return json({ settings, name: schema.name || meta.name });
    } catch {
        return json({ settings: [], name: meta.name });
    }
};
