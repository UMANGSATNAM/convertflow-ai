// Template file reader — .server.js suffix ensures Remix excludes this from client bundle
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Reads a Liquid template file from the app/templates directory.
 * Returns the file content as a string, or null if not found.
 */
export function readTemplateFile(relativePath) {
    try {
        const templatePath = resolve(process.cwd(), 'app', 'templates', relativePath);
        if (existsSync(templatePath)) {
            return readFileSync(templatePath, 'utf-8');
        }
        return null;
    } catch (e) {
        console.error('[TemplateReader] Error reading template:', e.message);
        return null;
    }
}

/**
 * Installs a Liquid template to the active Shopify theme.
 * Uses direct fetch() with the session's access token.
 */
export async function installTemplateToTheme(shop, accessToken, templateId, liquidContent) {
    const apiVersion = '2025-01';
    const headers = {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
    };

    // Get active theme
    const themesRes = await fetch(`https://${shop}/admin/api/${apiVersion}/themes.json`, { headers });
    if (!themesRes.ok) {
        throw new Error(`Failed to fetch themes: ${themesRes.statusText}`);
    }

    const themesData = await themesRes.json();
    const activeTheme = themesData.themes?.find(t => t.role === 'main');

    if (!activeTheme) {
        throw new Error('No active theme found');
    }

    const sectionName = `cf-tpl-${templateId}`;
    const assetRes = await fetch(`https://${shop}/admin/api/${apiVersion}/themes/${activeTheme.id}/assets.json`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
            asset: {
                key: `sections/${sectionName}.liquid`,
                value: liquidContent,
            }
        })
    });

    if (!assetRes.ok) {
        const errData = await assetRes.json().catch(() => ({}));
        throw new Error(`Upload failed: ${errData.errors || assetRes.statusText}`);
    }

    return { sectionName, themeId: activeTheme.id };
}

/**
 * Publishes compiled Liquid to the active Shopify theme.
 */
export async function publishLiquidToTheme(shop, accessToken, sectionName, liquidContent) {
    const apiVersion = '2025-01';
    const headers = {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
    };

    const themesRes = await fetch(`https://${shop}/admin/api/${apiVersion}/themes.json`, { headers });
    if (!themesRes.ok) {
        throw new Error(`Failed to fetch themes: ${themesRes.statusText}`);
    }

    const themesData = await themesRes.json();
    const activeTheme = themesData.themes?.find(t => t.role === 'main');

    if (!activeTheme) {
        throw new Error('No active theme found');
    }

    await fetch(`https://${shop}/admin/api/${apiVersion}/themes/${activeTheme.id}/assets.json`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
            asset: {
                key: `sections/${sectionName}.liquid`,
                value: liquidContent,
            }
        })
    });

    return { themeId: activeTheme.id };
}
