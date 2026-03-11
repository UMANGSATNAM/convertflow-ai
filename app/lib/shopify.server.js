import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, extname } from 'path';
import { removeSchemaTranslations } from './schema-fixer.server';

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
        let errMsg = err.errors || res.statusText;
        if (typeof errMsg === 'object') errMsg = JSON.stringify(errMsg);
        throw new Error(`${assetKey}: ${errMsg}`);
    }
    return true;
}

/** Publish a section to the active theme */
export async function publishSection(shop, accessToken, sectionKey, liquidContent) {
    const theme = await getActiveTheme(shop, accessToken);
    if (!theme) throw new Error('No active theme found');

    // Auto-fix schema translations before uploading
    const fixedLiquid = removeSchemaTranslations(liquidContent);

    await uploadAsset(shop, accessToken, theme.id, `sections/${sectionKey}.liquid`, fixedLiquid);
    return { themeId: theme.id, assetKey: `sections/${sectionKey}.liquid` };
}

/**
 * Re-uploads ALL local section files to the theme with translations stripped.
 * This retroactively fixes previously uploaded sections that had t: errors.
 */
export async function fixAllSections(shop, accessToken) {
    const theme = await getActiveTheme(shop, accessToken);
    if (!theme) throw new Error('No active theme found');

    const files = listFiles('sections').filter(f => f.endsWith('.liquid'));
    let success = 0, failed = 0, errors = [];

    for (const file of files) {
        try {
            const raw = readSectionFile(file);
            if (raw) {
                const fixed = removeSchemaTranslations(raw);
                // Key is cf-{filename without .liquid}
                const key = `sections/cf-${file.replace('.liquid', '')}.liquid`;
                await uploadAsset(shop, accessToken, theme.id, key, fixed);
                success++;
            }
        } catch (e) {
            failed++;
            errors.push(e.message);
        }
        // Rate limit
        if ((success + failed) % 4 === 0) await new Promise(r => setTimeout(r, 200));
    }

    return { total: files.length, success, failed, errors: errors.slice(0, 5) };
}

/** Get a specific asset from the theme */
export async function getThemeAsset(shop, accessToken, themeId, assetKey) {
    const res = await fetch(
        `https://${shop}/admin/api/${API_VERSION}/themes/${themeId}/assets.json?asset[key]=${assetKey}`,
        { headers: { 'X-Shopify-Access-Token': accessToken } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.asset?.value || null;
}

/** 
 * Inject a published section directly into the homepage (index.json) 
 * so the user doesn't have to open the Shopify Theme Editor.
 * 
 * IMPORTANT: The `type` in index.json must be EXACTLY the asset key
 * WITHOUT `sections/` prefix and WITHOUT `.liquid` extension.
 * e.g. if the file is at sections/cf-header-01.liquid, type = "cf-header-01"
 */
export async function injectSectionIntoTheme(shop, accessToken, themeId, sectionKey, settings = {}, placement = 'bottom') {
    // 1. Fetch current templates/index.json
    const indexJsonStr = await getThemeAsset(shop, accessToken, themeId, 'templates/index.json');
    if (!indexJsonStr) throw new Error("Could not read templates/index.json — make sure your theme has a homepage template.");

    let indexJson;
    try {
        indexJson = JSON.parse(indexJsonStr);
    } catch {
        throw new Error("templates/index.json is not valid JSON — it may be corrupted.");
    }

    // 2. Ensure sections and order exist
    indexJson.sections = indexJson.sections || {};
    indexJson.order = indexJson.order || [];

    // 3. Generate unique block key
    const blockId = `cf_${sectionKey.replace(/^cf-/, '')}_${Date.now().toString(36)}`;

    // 4. Add section block — type MUST match bare asset name (no path, no extension)
    indexJson.sections[blockId] = { type: sectionKey, settings };

    // 5. Insert based on placement preference
    if (placement === 'top') {
        const headerIdx = indexJson.order.findIndex(id => id.toLowerCase().includes('header'));
        if (headerIdx !== -1) indexJson.order.splice(headerIdx + 1, 0, blockId);
        else indexJson.order.unshift(blockId);
    } else {
        const footerIdx = indexJson.order.findIndex(id => id.toLowerCase().includes('footer'));
        if (footerIdx !== -1) indexJson.order.splice(footerIdx, 0, blockId);
        else indexJson.order.push(blockId);
    }

    // 6. Save back to Shopify
    await uploadAsset(shop, accessToken, themeId, 'templates/index.json', JSON.stringify(indexJson, null, 2));

    return { success: true, blockId };
}

/**
 * Remove ALL ConvertFlow-injected sections (cf_ prefix) from the homepage index.json.
 * Use this to do a clean slate before re-injecting corrected sections.
 */
export async function removeAllCfSections(shop, accessToken) {
    const theme = await getActiveTheme(shop, accessToken);
    if (!theme) throw new Error('No active theme found');

    const indexJsonStr = await getThemeAsset(shop, accessToken, theme.id, 'templates/index.json');
    if (!indexJsonStr) throw new Error('Could not read templates/index.json');

    const indexJson = JSON.parse(indexJsonStr);

    const before = (indexJson.order || []).length;

    // Remove all cf_ prefixed entries from sections map
    Object.keys(indexJson.sections || {}).forEach(key => {
        if (key.startsWith('cf_')) delete indexJson.sections[key];
    });

    // Remove from order array
    indexJson.order = (indexJson.order || []).filter(id => !id.startsWith('cf_'));

    const removed = before - indexJson.order.length;

    await uploadAsset(shop, accessToken, theme.id, 'templates/index.json', JSON.stringify(indexJson, null, 2));

    return { removed };
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

/** Check if dependencies are already installed on the theme */
export async function checkDepsInstalled(shop, accessToken) {
    try {
        const theme = await getActiveTheme(shop, accessToken);
        if (!theme) return false;
        const res = await fetch(
            `https://${shop}/admin/api/${API_VERSION}/themes/${theme.id}/assets.json?asset[key]=snippets/cf-deps-marker.liquid`,
            { headers: { 'X-Shopify-Access-Token': accessToken } }
        );
        return res.ok;
    } catch {
        return false;
    }
}

/** Install ALL dependencies (snippets + locales + config) in one go */
export async function installAllDeps(shop, accessToken) {
    const theme = await getActiveTheme(shop, accessToken);
    if (!theme) throw new Error('No active theme found');

    const results = { snippets: 0, locales: 0, config: false, totalFiles: 0, errors: [] };

    // 1. Upload all snippets
    const snippetFiles = listFiles('snippets').filter(f => f.endsWith('.liquid'));
    for (const file of snippetFiles) {
        try {
            const content = readSnippetFile(file);
            if (content) {
                await uploadAsset(shop, accessToken, theme.id, `snippets/${file}`, content);
                results.snippets++;
            }
        } catch (e) { results.errors.push(e.message); }
        if (results.snippets % 4 === 0) await new Promise(r => setTimeout(r, 200));
    }

    // 2. Upload all locales
    const localeFiles = listFiles('locales').filter(f => f.endsWith('.json'));
    for (const file of localeFiles) {
        try {
            const content = readLocaleFile(file);
            if (content) {
                await uploadAsset(shop, accessToken, theme.id, `locales/${file}`, content);
                results.locales++;
            }
        } catch (e) { results.errors.push(e.message); }
        if (results.locales % 4 === 0) await new Promise(r => setTimeout(r, 200));
    }

    // 3. Upload config
    try {
        const settingsSchema = readConfigFile('settings_schema.json');
        if (settingsSchema) {
            await uploadAsset(shop, accessToken, theme.id, 'config/settings_schema.json', settingsSchema);
            results.config = true;
        }
    } catch (e) { results.errors.push(e.message); }

    // 4. Upload marker so we don't re-run
    try {
        await uploadAsset(shop, accessToken, theme.id, 'snippets/cf-deps-marker.liquid', '{% comment %}ConvertFlow deps installed{% endcomment %}');
    } catch { }

    results.totalFiles = results.snippets + results.locales + (results.config ? 1 : 0);
    return results;
}

/**
 * Publishes a FULL JSON Page Template to the theme containing all requested sections.
 * This uploads to `templates/page.{id}.json` or `templates/product.{id}.json`.
 */
export async function publishPageTemplate(shop, accessToken, template) {
    const theme = await getActiveTheme(shop, accessToken);
    if (!theme) throw new Error('No active theme found');

    const pageJson = {
      "sections": {},
      "order": []
    };

    // Auto-populate the template with the configured sections
    for (let idx = 0; idx < template.sections.length; idx++) {
      const sectionFile = template.sections[idx];
      const blockId = `cf_${sectionFile.replace(/^cf-cro-/, '')}_${idx}`;
      
      pageJson.sections[blockId] = {
        type: sectionFile,
        settings: {}
      };
      pageJson.order.push(blockId);
      
      // Before creating the template, we must ensure the individual sections exist!
      // In a real flow, the user might not have injected the sections individually.
      // We will upload each required section on the fly.
      const rawLiquid = readSectionFile(sectionFile + '.liquid');
      if (rawLiquid) {
          const fixedLiquid = removeSchemaTranslations(rawLiquid);
          await uploadAsset(shop, accessToken, theme.id, `sections/${sectionFile}.liquid`, fixedLiquid);
      }
    }

    const prefix = template.type === 'product' ? 'product' : 'page';
    const assetKey = `templates/${prefix}.${template.id}.json`;
    
    await uploadAsset(shop, accessToken, theme.id, assetKey, JSON.stringify(pageJson, null, 2));
    
    return { success: true, assetKey, templateId: template.id };
}
