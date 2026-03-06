// Server-only utility for publishing sections to Shopify themes
// .server.js suffix ensures Remix excludes this from client bundle
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const API_VERSION = '2025-01';

/**
 * Read a section Liquid file from the app/sections directory
 */
export function readSectionFile(filename) {
    const filePath = resolve(process.cwd(), 'app', 'sections', filename);
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, 'utf-8');
}

/**
 * Get the active (main) theme for a shop
 */
export async function getActiveTheme(shop, accessToken) {
    const res = await fetch(
        `https://${shop}/admin/api/${API_VERSION}/themes.json`,
        { headers: { 'X-Shopify-Access-Token': accessToken } }
    );
    if (!res.ok) throw new Error(`Failed to fetch themes: ${res.statusText}`);
    const data = await res.json();
    return data.themes?.find(t => t.role === 'main') || null;
}

/**
 * Upload a Liquid section to the active Shopify theme
 */
export async function publishSection(shop, accessToken, sectionKey, liquidContent) {
    const theme = await getActiveTheme(shop, accessToken);
    if (!theme) throw new Error('No active theme found');

    const res = await fetch(
        `https://${shop}/admin/api/${API_VERSION}/themes/${theme.id}/assets.json`,
        {
            method: 'PUT',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                asset: {
                    key: `sections/${sectionKey}.liquid`,
                    value: liquidContent,
                }
            })
        }
    );

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.errors || res.statusText);
    }

    return { themeId: theme.id, assetKey: `sections/${sectionKey}.liquid` };
}
