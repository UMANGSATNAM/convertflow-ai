import { json } from "@remix-run/node";
import { useLoaderData, useRouteError } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { getActiveTheme, getThemeAsset } from "../lib/shopify.server";
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

    return json({
        themeId: theme.id,
        shop,
        pageBlocks,
        themeName: theme.name || 'Dawn',
    });
};

export default function BuilderRoute() {
    const { pageBlocks, themeName, shop, themeId } = useLoaderData();

    return (
        <AppProvider i18n={{}}>
            <StoreBuilder pageBlocks={pageBlocks} />
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
