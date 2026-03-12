import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getActiveTheme, getThemeAsset, uploadAsset, readSectionFile } from "../lib/shopify.server";
import { removeSchemaTranslations } from "../lib/schema-fixer.server";
import { SECTION_FILES } from "../lib/constants";
import { PAGE_TEMPLATES } from "../lib/page-templates";

// ─── Helpers ────────────────────────────────────────────────────

function isValidShopifyUrl(v) {
    if (!v || typeof v !== 'string') return false;
    if (v.includes('cdn.shopify')) return true;
    if (v.startsWith('shopify://')) return true;
    if (v.startsWith('/') && !v.startsWith('//')) return true;
    return false;
}

function sanitizeSettingsForTheme(settings) {
    if (!settings || typeof settings !== 'object') return {};
    const clean = {};
    for (const [key, val] of Object.entries(settings)) {
        if (typeof val === 'string') {
            if (val.startsWith('data:')) continue;
            const isImageKey = /image|img|bg_image|background|photo|banner|logo|icon_image|hero_image/i.test(key);
            if (isImageKey && val && !isValidShopifyUrl(val)) continue;
        }
        clean[key] = val;
    }
    return clean;
}

/** Upload a CF section's .liquid file to the Shopify theme */
async function ensureSectionAsset(shop, accessToken, themeId, sectionId) {
    const meta = SECTION_FILES[sectionId];
    if (!meta) return false;
    let liquid = readSectionFile(meta.file);
    if (!liquid) return false;
    liquid = removeSchemaTranslations(liquid);
    await uploadAsset(shop, accessToken, themeId, `sections/${sectionId}.liquid`, liquid);
    return true;
}

/** Build a pageBlocks array from an index/product JSON structure */
function buildPageBlocks(idx) {
    const sections = idx.sections || {};
    const order = idx.order || Object.keys(sections);
    return order.map(id => ({
        id,
        type: sections[id]?.type || id,
        settings: sections[id]?.settings || {},
        isCf: id.startsWith('cf_'),
    }));
}

// ─── Main Action ────────────────────────────────────────────────

export const action = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const { shop, accessToken } = session;
    const fd = await request.formData();
    const intent = fd.get("intent");

    const theme = await getActiveTheme(shop, accessToken);
    if (!theme) return json({ ok: false, error: "No active theme" });

    // Determine which template file we're editing
    const templateFile = fd.get("templateFile") || "templates/index.json";

    const getTemplate = async () => {
        const str = await getThemeAsset(shop, accessToken, theme.id, templateFile);
        const parsed = str ? JSON.parse(str) : { sections: {}, order: [] };
        parsed.sections = parsed.sections || {};
        parsed.order = parsed.order || Object.keys(parsed.sections);
        return parsed;
    };

    const saveTemplate = async (idx) => {
        idx.sections = idx.sections || {};
        idx.order = idx.order || [];
        idx.order = idx.order.filter(id => !!idx.sections[id]);

        const orderSet = new Set(idx.order);
        for (const key of Object.keys(idx.sections)) {
            if (!orderSet.has(key)) delete idx.sections[key];
        }

        for (const key of Object.keys(idx.sections)) {
            if (idx.sections[key].settings) {
                idx.sections[key].settings = sanitizeSettingsForTheme(idx.sections[key].settings);
            }
        }

        const payload = JSON.stringify(idx);
        if (payload.length > 500000) {
            throw new Error('Template is too large for Shopify limits.');
        }
        await uploadAsset(shop, accessToken, theme.id, templateFile, payload);
    };

    try {
        // ═══════════════════════════════════════════════════════════
        // INTENT: inject_section (original — adds to top/bottom)
        // ═══════════════════════════════════════════════════════════
        if (intent === "inject_section") {
            const sectionId = fd.get("sectionId");
            const settings = JSON.parse(fd.get("settings") || "{}");
            const placement = fd.get("placement") || "bottom";
            const trustedOrder = JSON.parse(fd.get("trustedOrder") || "[]");

            const ok = await ensureSectionAsset(shop, accessToken, theme.id, sectionId);
            if (!ok) return json({ ok: false, error: "Section file missing" });

            await new Promise(r => setTimeout(r, 300));

            const idx = await getTemplate();
            if (trustedOrder.length >= idx.order.length) idx.order = trustedOrder;

            const blockId = `cf_${sectionId}_${Date.now().toString(36)}`;
            idx.sections[blockId] = { type: sectionId, settings: sanitizeSettingsForTheme(settings) };

            if (placement === "top") {
                const hi = idx.order.findIndex(id => id.toLowerCase().includes("header"));
                hi !== -1 ? idx.order.splice(hi + 1, 0, blockId) : idx.order.unshift(blockId);
            } else {
                const fi = idx.order.findIndex(id => id.toLowerCase().includes("footer"));
                fi !== -1 ? idx.order.splice(fi, 0, blockId) : idx.order.push(blockId);
            }

            idx.order.forEach(id => {
                if (!idx.sections[id]) idx.sections[id] = { type: id, settings: {} };
            });

            await saveTemplate(idx);
            const meta = SECTION_FILES[sectionId];
            return json({ ok: true, message: `${meta?.name || sectionId} injected!`, pageBlocks: buildPageBlocks(idx), newBlockId: blockId });
        }

        // ═══════════════════════════════════════════════════════════
        // INTENT: insert_at (NEW — insert AFTER a specific block)
        // ═══════════════════════════════════════════════════════════
        if (intent === "insert_at") {
            const sectionId = fd.get("sectionId");
            const afterBlockId = fd.get("afterBlockId"); // insert after this block
            const settings = JSON.parse(fd.get("settings") || "{}");

            const ok = await ensureSectionAsset(shop, accessToken, theme.id, sectionId);
            if (!ok) return json({ ok: false, error: "Section file missing" });

            await new Promise(r => setTimeout(r, 300));

            const idx = await getTemplate();
            const blockId = `cf_${sectionId}_${Date.now().toString(36)}`;
            idx.sections[blockId] = { type: sectionId, settings: sanitizeSettingsForTheme(settings) };

            // Find the target position
            const targetIdx = idx.order.indexOf(afterBlockId);
            if (targetIdx !== -1) {
                idx.order.splice(targetIdx + 1, 0, blockId);
            } else {
                // Fallback: insert before footer
                const fi = idx.order.findIndex(id => id.toLowerCase().includes("footer"));
                fi !== -1 ? idx.order.splice(fi, 0, blockId) : idx.order.push(blockId);
            }

            await saveTemplate(idx);
            const meta = SECTION_FILES[sectionId];
            return json({ ok: true, message: `${meta?.name || sectionId} inserted!`, pageBlocks: buildPageBlocks(idx), newBlockId: blockId });
        }

        // ═══════════════════════════════════════════════════════════
        // INTENT: swap_section (NEW — replace in-place)
        // ═══════════════════════════════════════════════════════════
        if (intent === "swap_section") {
            const targetBlockId = fd.get("targetBlockId"); // the block to replace
            const newSectionId = fd.get("newSectionId");   // the CF section to swap in

            const ok = await ensureSectionAsset(shop, accessToken, theme.id, newSectionId);
            if (!ok) return json({ ok: false, error: "Section file missing" });

            await new Promise(r => setTimeout(r, 300));

            const idx = await getTemplate();

            // Find position in order
            const posIdx = idx.order.indexOf(targetBlockId);
            if (posIdx === -1) return json({ ok: false, error: "Target block not found in template" });

            // Remove old block
            delete idx.sections[targetBlockId];

            // Create new block at the same position
            const blockId = `cf_${newSectionId}_${Date.now().toString(36)}`;
            idx.sections[blockId] = { type: newSectionId, settings: {} };
            idx.order[posIdx] = blockId;

            await saveTemplate(idx);
            const meta = SECTION_FILES[newSectionId];
            return json({ ok: true, message: `Swapped to ${meta?.name || newSectionId}!`, pageBlocks: buildPageBlocks(idx), newBlockId: blockId });
        }

        // ═══════════════════════════════════════════════════════════
        // INTENT: apply_titan (NEW — full page template replacement)
        // ═══════════════════════════════════════════════════════════
        if (intent === "apply_titan") {
            const titanId = fd.get("titanId");
            const titan = PAGE_TEMPLATES.find(t => t.id === titanId);
            if (!titan) return json({ ok: false, error: "Titan template not found" });

            // Upload all required section assets
            for (const sectionId of titan.sections) {
                await ensureSectionAsset(shop, accessToken, theme.id, sectionId);
            }

            const idx = await getTemplate();

            // Identify header and footer blocks to preserve
            const headerBlocks = [];
            const footerBlocks = [];
            for (const id of idx.order) {
                const t = (idx.sections[id]?.type || id).toLowerCase();
                if (t.includes('header') || t.includes('announcement')) {
                    headerBlocks.push(id);
                } else if (t.includes('footer')) {
                    footerBlocks.push(id);
                }
            }

            // Remove all middle sections (everything except header/footer)
            const preserveIds = new Set([...headerBlocks, ...footerBlocks]);
            for (const id of idx.order) {
                if (!preserveIds.has(id)) delete idx.sections[id];
            }

            // Build new middle section from Titan template
            const newMiddleIds = [];
            for (let i = 0; i < titan.sections.length; i++) {
                const sectionId = titan.sections[i];
                const blockId = `cf_${sectionId.replace(/^cf-cro-/, '')}_${i}`;
                idx.sections[blockId] = { type: sectionId, settings: {} };
                newMiddleIds.push(blockId);
            }

            // Reconstruct order: header → titan sections → footer
            idx.order = [...headerBlocks, ...newMiddleIds, ...footerBlocks];

            await saveTemplate(idx);
            return json({ ok: true, message: `Titan "${titan.name}" applied!`, pageBlocks: buildPageBlocks(idx) });
        }

        // ═══════════════════════════════════════════════════════════
        // INTENT: remove_section (existing)
        // ═══════════════════════════════════════════════════════════
        if (intent === "remove_section") {
            const blockId = fd.get("blockId");
            const idx = await getTemplate();
            delete idx.sections[blockId];
            idx.order = idx.order.filter(id => id !== blockId);
            await saveTemplate(idx);
            return json({ ok: true, pageBlocks: buildPageBlocks(idx) });
        }

        // ═══════════════════════════════════════════════════════════
        // INTENT: update_settings (existing)
        // ═══════════════════════════════════════════════════════════
        if (intent === "update_settings") {
            const blockId = fd.get("blockId");
            const settings = JSON.parse(fd.get("settings") || "{}");
            const idx = await getTemplate();
            if (idx.sections[blockId]) idx.sections[blockId].settings = sanitizeSettingsForTheme(settings);
            await saveTemplate(idx);
            return json({ ok: true, message: "Settings saved to theme!" });
        }

        // ═══════════════════════════════════════════════════════════
        // INTENT: reorder (existing)
        // ═══════════════════════════════════════════════════════════
        if (intent === "reorder") {
            const newOrder = JSON.parse(fd.get("order") || "[]");
            const idx = await getTemplate();
            idx.order = newOrder;
            await saveTemplate(idx);
            return json({ ok: true, message: "Sections reordered!", pageBlocks: buildPageBlocks(idx) });
        }

        // ═══════════════════════════════════════════════════════════
        // INTENT: toggle_section_visibility (hide/show a section)
        // ═══════════════════════════════════════════════════════════
        if (intent === "toggle_section_visibility") {
            const blockId = fd.get("blockId");
            const hidden = fd.get("hidden") === "true";
            const idx = await getTemplate();
            if (idx.sections[blockId]) {
                idx.sections[blockId].disabled = hidden;
            }
            await saveTemplate(idx);
            return json({ ok: true, message: hidden ? "Section hidden" : "Section visible", pageBlocks: buildPageBlocks(idx) });
        }

        // ═══════════════════════════════════════════════════════════
        // INTENT: add_block — add a block to a section
        // ═══════════════════════════════════════════════════════════
        if (intent === "add_block") {
            const sectionId = fd.get("sectionId"); // which section to add block to
            const blockType = fd.get("blockType");  // the block's type
            const settings = JSON.parse(fd.get("settings") || "{}");

            const idx = await getTemplate();
            const section = idx.sections[sectionId];
            if (!section) return json({ ok: false, error: "Section not found" });

            // Initialize blocks if they don't exist
            section.blocks = section.blocks || {};
            section.block_order = section.block_order || [];

            const blockKey = `${blockType}_${Date.now().toString(36)}`;
            section.blocks[blockKey] = { type: blockType, settings: sanitizeSettingsForTheme(settings) };
            section.block_order.push(blockKey);

            await saveTemplate(idx);
            return json({ ok: true, message: `Block added`, pageBlocks: buildPageBlocks(idx), newBlockKey: blockKey });
        }

        // ═══════════════════════════════════════════════════════════
        // INTENT: remove_block — remove a block from a section
        // ═══════════════════════════════════════════════════════════
        if (intent === "remove_block") {
            const sectionId = fd.get("sectionId");
            const blockKey = fd.get("blockKey");

            const idx = await getTemplate();
            const section = idx.sections[sectionId];
            if (!section) return json({ ok: false, error: "Section not found" });

            delete section.blocks?.[blockKey];
            section.block_order = (section.block_order || []).filter(k => k !== blockKey);

            await saveTemplate(idx);
            return json({ ok: true, message: "Block removed", pageBlocks: buildPageBlocks(idx) });
        }

        // ═══════════════════════════════════════════════════════════
        // INTENT: reorder_blocks — change block order within a section
        // ═══════════════════════════════════════════════════════════
        if (intent === "reorder_blocks") {
            const sectionId = fd.get("sectionId");
            const newOrder = JSON.parse(fd.get("blockOrder") || "[]");

            const idx = await getTemplate();
            const section = idx.sections[sectionId];
            if (!section) return json({ ok: false, error: "Section not found" });

            section.block_order = newOrder;
            await saveTemplate(idx);
            return json({ ok: true, message: "Blocks reordered", pageBlocks: buildPageBlocks(idx) });
        }

        // ═══════════════════════════════════════════════════════════
        // INTENT: update_block_settings — save block-level settings
        // ═══════════════════════════════════════════════════════════
        if (intent === "update_block_settings") {
            const sectionId = fd.get("sectionId");
            const blockKey = fd.get("blockKey");
            const settings = JSON.parse(fd.get("settings") || "{}");

            const idx = await getTemplate();
            const section = idx.sections[sectionId];
            if (!section || !section.blocks?.[blockKey]) return json({ ok: false, error: "Block not found" });

            section.blocks[blockKey].settings = sanitizeSettingsForTheme(settings);
            await saveTemplate(idx);
            return json({ ok: true, message: "Block settings saved!" });
        }

        return json({ ok: false, error: "Unknown intent" });
    } catch (e) {
        console.error("Theme Editor Action Error:", e);
        return json({ ok: false, error: e.message });
    }
};

