import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getActiveTheme, getThemeAsset, readSectionFile } from "../lib/shopify.server";
import { removeSchemaTranslations } from "../lib/schema-fixer.server";
import { SECTION_FILES } from "../lib/constants";

/**
 * GET /app/api/section-schema?id=<sectionType>&shop=<shop>
 *
 * Returns the full parsed schema for a section, including:
 * - settings (all types, including header/paragraph)
 * - blocks (schema for blocks within the section)
 * - name, max_blocks
 *
 * Strategy:
 *  1. If it's a CF section (in SECTION_FILES), read from our local liquid files
 *  2. Otherwise, attempt to read from the live Shopify theme assets
 */
export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const { shop, accessToken } = session;

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return json({ settings: [], blocks: [], name: '', max_blocks: 0 });

    // ── Strategy 1: CF section from local files ──────────────────
    const meta = SECTION_FILES[id];
    if (meta) {
        let liquid = readSectionFile(meta.file);
        if (liquid) {
            liquid = removeSchemaTranslations(liquid);
            const schema = extractSchema(liquid);
            if (schema) {
                return json({
                    settings: schema.settings || [],
                    blocks: schema.blocks || [],
                    name: schema.name || meta.name,
                    max_blocks: schema.max_blocks || 16,
                });
            }
        }
        return json({ settings: [], blocks: [], name: meta.name, max_blocks: 0 });
    }

    // ── Strategy 2: Native theme section from Shopify ────────────
    try {
        const theme = await getActiveTheme(shop, accessToken);
        if (!theme) return json({ settings: [], blocks: [], name: titleCase(id), max_blocks: 0 });

        const assetKey = `sections/${id}.liquid`;
        const liquid = await getThemeAsset(shop, accessToken, theme.id, assetKey);
        if (!liquid) return json({ settings: [], blocks: [], name: titleCase(id), max_blocks: 0 });

        const schema = extractSchema(liquid);
        if (schema) {
            return json({
                settings: schema.settings || [],
                blocks: schema.blocks || [],
                name: schema.name || titleCase(id),
                max_blocks: schema.max_blocks || 16,
            });
        }
    } catch (e) {
        console.error('[section-schema]', e.message);
    }

    return json({ settings: [], blocks: [], name: titleCase(id), max_blocks: 0 });
};

function extractSchema(liquid) {
    const m = liquid.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
    if (!m) return null;
    try { return JSON.parse(m[1].trim()); } catch { return null; }
}

function titleCase(str) {
    return (str || '').replace(/^cf[-_]/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
