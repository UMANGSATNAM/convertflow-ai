import { json } from "@remix-run/node";
import { useLoaderData, useRouteError } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { getActiveTheme, getThemeAsset, uploadAsset, readSectionFile } from "../lib/shopify.server";
import { removeSchemaTranslations } from "../lib/schema-fixer.server";
import { SECTION_FILES, getCategoriesWithCounts } from "../lib/constants";
import { StoreBuilder } from "../components/builder/StoreBuilder";
import { AppProvider } from '@shopify/polaris';

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const { shop, accessToken } = session;

    const theme = await getActiveTheme(shop, accessToken);
    if (!theme) return json({ error: "No active theme found" });

    let pageBlocks = [];
    try {
        const templateStr = await getThemeAsset(shop, accessToken, theme.id, 'templates/index.json');
        if (templateStr) {
            const templateJson = JSON.parse(templateStr);
            const sections = templateJson.sections || {};
            const order = templateJson.order || Object.keys(sections);
            pageBlocks = order.map(id => ({
                id,
                name: sections[id]?.type || id,
                type: sections[id]?.type || id,
                settings: sections[id]?.settings || {},
                isCf: id.startsWith('cf_'),
            }));
        }
    } catch (e) { /* ignore */ }

    const categories = getCategoriesWithCounts();

    return json({
        themeId: theme.id,
        shop,
        pageBlocks,
        categories,
        themeName: theme.name || 'Dawn',
    });
};

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
        await uploadAsset(shop, accessToken, theme.id, 'templates/index.json', JSON.stringify(idx, null, 2));
    };

    try {
        if (intent === "inject_section") {
            const sectionId = fd.get("sectionId");
            const settings = JSON.parse(fd.get("settings") || "{}");
            const placement = fd.get("placement") || "bottom";

            const meta = SECTION_FILES[sectionId];
            if (!meta) return json({ ok: false, error: "Unknown section" });

            let liquid = readSectionFile(meta.file);
            if (!liquid) return json({ ok: false, error: "Section file missing" });
            liquid = removeSchemaTranslations(liquid);

            const assetKey = `sections/${sectionId}.liquid`;
            await uploadAsset(shop, accessToken, theme.id, assetKey, liquid);

            const idx = await getIndex();
            const blockId = `cf_${sectionId}_${Date.now().toString(36)}`;
            idx.sections[blockId] = { type: sectionId, settings };

            if (placement === "top") {
                const hi = idx.order.findIndex(id => id.toLowerCase().includes("header"));
                hi !== -1 ? idx.order.splice(hi + 1, 0, blockId) : idx.order.unshift(blockId);
            } else {
                const fi = idx.order.findIndex(id => id.toLowerCase().includes("footer"));
                fi !== -1 ? idx.order.splice(fi, 0, blockId) : idx.order.push(blockId);
            }
            await saveIndex(idx);

            const newBlocks = idx.order.map(id => ({
                id, name: idx.sections[id]?.type || id, type: idx.sections[id]?.type || id,
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
                id, name: idx.sections[id]?.type || id, type: idx.sections[id]?.type || id,
                settings: idx.sections[id]?.settings || {},
                isCf: id.startsWith('cf_'),
            }));
            return json({ ok: true, pageBlocks: newBlocks });
        }

        if (intent === "update_settings") {
            const blockId = fd.get("blockId");
            const settings = JSON.parse(fd.get("settings") || "{}");
            const idx = await getIndex();
            if (idx.sections[blockId]) idx.sections[blockId].settings = settings;
            await saveIndex(idx);
            return json({ ok: true, message: "Settings saved to theme!" });
        }

        if (intent === "reorder") {
            const newOrder = JSON.parse(fd.get("order") || "[]");
            const idx = await getIndex();
            idx.order = newOrder;
            await saveIndex(idx);
            return json({ ok: true });
        }

        return json({ ok: false, error: "Unknown intent" });
    } catch (e) {
        return json({ ok: false, error: e.message }, { status: 500 });
    }
};

export default function BuilderRoute() {
    const { pageBlocks, themeName, shop, themeId, categories } = useLoaderData();

    return (
        <AppProvider i18n={{}}>
            <StoreBuilder pageBlocks={pageBlocks} themeId={themeId} shop={shop} categories={categories} />
        </AppProvider>
    );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error("BuilderRoute Error:", error);
  return (
    <div style={{ padding: "20px", color: "red" }}>
      <h2>Error Loading Builder</h2>
      <pre>{error.message || JSON.stringify(error)}</pre>
      {error.stack && <pre>{error.stack}</pre>}
    </div>
  );
}
