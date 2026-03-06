// Server-only utility for publishing sections and dependencies to Shopify themes
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, extname } from 'path';

const API_VERSION = '2025-01';

/** Read a section file */
export function readSectionFile(filename) {
    const filePath = resolve(process.cwd(), 'app', 'sections', filename);
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, 'utf-8');
}

/** Read a snippet file */
export function readSnippetFile(filename) {
    const filePath = resolve(process.cwd(), 'app', 'snippets', filename);
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, 'utf-8');
}

/** Read a locale file */
export function readLocaleFile(filename) {
    const filePath = resolve(process.cwd(), 'app', 'locales', filename);
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, 'utf-8');
}

/** Read a config file */
export function readConfigFile(filename) {
    const filePath = resolve(process.cwd(), 'app', 'config-theme', filename);
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, 'utf-8');
}

/** List all files in a directory */
export function listFiles(dir) {
    const dirPath = resolve(process.cwd(), 'app', dir);
    if (!existsSync(dirPath)) return [];
    return readdirSync(dirPath).filter(f => !f.startsWith('.'));
}

/** Get the active theme */
export async function getActiveTheme(shop, accessToken) {
    const res = await fetch(
        `https://${shop}/admin/api/${API_VERSION}/themes.json`,
        { headers: { 'X-Shopify-Access-Token': accessToken } }
    );
    if (!res.ok) throw new Error(`Failed to fetch themes: ${res.statusText}`);
    const data = await res.json();
    return data.themes?.find(t => t.role === 'main') || null;
}

/** Upload a single asset to the theme */
export async function uploadAsset(shop, accessToken, themeId, assetKey, content) {
    const res = await fetch(
        `https://${shop}/admin/api/${API_VERSION}/themes/${themeId}/assets.json`,
        {
            method: 'PUT',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ asset: { key: assetKey, value: content } })
        }
    );
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`${assetKey}: ${err.errors || res.statusText}`);
    }
    return true;
}

/** Publish a section to the active theme */
export async function publishSection(shop, accessToken, sectionKey, liquidContent) {
    const theme = await getActiveTheme(shop, accessToken);
    if (!theme) throw new Error('No active theme found');
    await uploadAsset(shop, accessToken, theme.id, `sections/${sectionKey}.liquid`, liquidContent);
    return { themeId: theme.id, assetKey: `sections/${sectionKey}.liquid` };
}

/** Bulk publish all snippets to the theme */
export async function publishAllSnippets(shop, accessToken) {
    const theme = await getActiveTheme(shop, accessToken);
    if (!theme) throw new Error('No active theme found');

    const files = listFiles('snippets').filter(f => f.endsWith('.liquid'));
    let success = 0, failed = 0, errors = [];

    for (const file of files) {
        try {
            const content = readSnippetFile(file);
            if (content) {
                await uploadAsset(shop, accessToken, theme.id, `snippets/${file}`, content);
                success++;
            }
        } catch (e) {
            failed++;
            errors.push(e.message);
        }
        // Small delay to avoid rate limiting
        if (success % 4 === 0) await new Promise(r => setTimeout(r, 250));
    }

    return { total: files.length, success, failed, errors: errors.slice(0, 5) };
}

/** Bulk publish locale files to the theme */
export async function publishAllLocales(shop, accessToken) {
    const theme = await getActiveTheme(shop, accessToken);
    if (!theme) throw new Error('No active theme found');

    const files = listFiles('locales').filter(f => f.endsWith('.json'));
    let success = 0, failed = 0, errors = [];

    for (const file of files) {
        try {
            const content = readLocaleFile(file);
            if (content) {
                await uploadAsset(shop, accessToken, theme.id, `locales/${file}`, content);
                success++;
            }
        } catch (e) {
            failed++;
            errors.push(e.message);
        }
        if (success % 4 === 0) await new Promise(r => setTimeout(r, 250));
    }

    return { total: files.length, success, failed, errors: errors.slice(0, 5) };
}

/** Publish config/settings_schema.json to the theme */
export async function publishConfig(shop, accessToken) {
    const theme = await getActiveTheme(shop, accessToken);
    if (!theme) throw new Error('No active theme found');

    const settingsSchema = readConfigFile('settings_schema.json');
    if (settingsSchema) {
        await uploadAsset(shop, accessToken, theme.id, 'config/settings_schema.json', settingsSchema);
    }

    return { success: true };
}
