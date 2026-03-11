import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getActiveTheme, getThemeAsset, uploadAsset, readSectionFile } from "../lib/shopify.server";
import { removeSchemaTranslations } from "../lib/schema-fixer.server";
import { SECTION_FILES } from "../lib/constants";

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

export const action = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const { shop, accessToken } = session;
    const fd = await request.formData();
    const intent = fd.get("intent");

    const theme = await getActiveTheme(shop, accessToken);
    if (!theme) return json({ ok: false, error: "No active theme" });

    const getIndex = async () => {
        const str = await getThemeAsset(shop, accessToken, theme.id, 'templates/index.json');
        const json = str ? JSON.parse(str) : { sections: {}, order: [] };
        json.sections = json.sections || {};
        json.order = json.order || Object.keys(json.sections);
        return json;
    };

    const saveIndex = async (idx) => {
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
        await uploadAsset(shop, accessToken, theme.id, 'templates/index.json', payload);
    };

    try {
        if (intent === "inject_section") {
            const sectionId = fd.get("sectionId");
            const settings = JSON.parse(fd.get("settings") || "{}");
            const placement = fd.get("placement") || "bottom";
            const trustedOrder = JSON.parse(fd.get("trustedOrder") || "[]");

            const meta = SECTION_FILES[sectionId];
            if (!meta) return json({ ok: false, error: "Unknown section" });

            let liquid = readSectionFile(meta.file);
            if (!liquid) return json({ ok: false, error: "Section file missing" });
            liquid = removeSchemaTranslations(liquid);

            const assetKey = `sections/${sectionId}.liquid`;
            await uploadAsset(shop, accessToken, theme.id, assetKey, liquid);

            const verifyRes = await fetch(
                `https://${shop}/admin/api/2025-01/themes/${theme.id}/assets.json?asset[key]=${assetKey}`,
                { headers: { 'X-Shopify-Access-Token': accessToken } }
            );
            if (!verifyRes.ok) return json({ ok: false, error: `Upload failed.` });

            await new Promise(r => setTimeout(r, 500));

            const idx = await getIndex();
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
                if (!idx.sections[id]) idx.sections[id] = { type: id.replace('cf_', ''), settings: {} };
            });

            await saveIndex(idx);

            const newBlocks = idx.order.map(id => ({
                id, type: idx.sections[id]?.type || id,
                settings: idx.sections[id]?.settings || {},
                isCf: id.startsWith('cf_'),
            }));
            return json({ ok: true, message: `${meta.name} injected!`, pageBlocks: newBlocks, newBlockId: blockId });
        }

        if (intent === "remove_section") {
            const blockId = fd.get("blockId");
            const idx = await getIndex();
            delete idx.sections[blockId];
            idx.order = idx.order.filter(id => id !== blockId);
            await saveIndex(idx);
            const newBlocks = idx.order.map(id => ({
                id, type: idx.sections[id]?.type || id,
                settings: idx.sections[id]?.settings || {},
                isCf: id.startsWith('cf_'),
            }));
            return json({ ok: true, pageBlocks: newBlocks });
        }

        if (intent === "update_settings") {
            const blockId = fd.get("blockId");
            const settings = JSON.parse(fd.get("settings") || "{}");
            const idx = await getIndex();
            if (idx.sections[blockId]) idx.sections[blockId].settings = sanitizeSettingsForTheme(settings);
            await saveIndex(idx);
            return json({ ok: true, message: "Settings saved to theme!" });
        }

        if (intent === "reorder") {
            const newOrder = JSON.parse(fd.get("order") || "[]");
            const idx = await getIndex();
            idx.order = newOrder;
            await saveIndex(idx);
            return json({ ok: true, message: "Sections reordered successfully!" });
        }

        return json({ ok: false, error: "Unknown intent" });
    } catch (e) {
        console.error("Theme Editor Action Error:", e);
        return json({ ok: false, error: e.message });
    }
};
