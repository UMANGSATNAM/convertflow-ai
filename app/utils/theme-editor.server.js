/**
 * Theme Editor Details API — ConvertFlow AI
 * This module interacts with Shopify's Asset API to read and modify JSON templates,
 * powering the "Theme Map" visual builder.
 */

// Generate a random 16-character string for block IDs (to match Shopify's format)
function generateBlockId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Friendly labels for template files
const TEMPLATE_LABELS = {
    'templates/index.json': { label: 'Homepage', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>', order: 0 },
    'templates/product.json': { label: 'Product Page', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/></svg>', order: 1 },
    'templates/collection.json': { label: 'Collection', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/></svg>', order: 2 },
    'templates/collection.list.json': { label: 'Collection List', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></svg>', order: 3 },
    'templates/cart.json': { label: 'Cart', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>', order: 4 },
    'templates/blog.json': { label: 'Blog', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>', order: 5 },
    'templates/article.json': { label: 'Article', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>', order: 6 },
    'templates/page.json': { label: 'Page', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>', order: 7 },
    'templates/page.contact.json': { label: 'Contact Page', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/></svg>', order: 8 },
    'templates/search.json': { label: 'Search', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>', order: 9 },
    'templates/404.json': { label: '404 Page', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', order: 10 },
    'templates/password.json': { label: 'Password', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>', order: 11 },
    'templates/gift_card.liquid': { label: 'Gift Card', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"/></svg>', order: 12 },
    'templates/customers/account.json': { label: 'Account', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', order: 13 },
    'templates/customers/login.json': { label: 'Login', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>', order: 14 },
    'templates/customers/register.json': { label: 'Register', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>', order: 15 },
    'templates/customers/order.json': { label: 'Order Details', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></svg>', order: 16 },
};

/**
 * Get the active (main) theme ID and name
 */
async function getActiveTheme(admin) {
    const themesResponse = await admin.graphql(
        `#graphql
        query {
            themes(first: 1, roles: [MAIN]) {
                nodes { id name role }
            }
        }`
    );
    const themesData = await themesResponse.json();
    const activeTheme = themesData.data?.themes?.nodes?.[0];
    if (!activeTheme) return null;
    return {
        id: activeTheme.id.split('/').pop(),
        name: activeTheme.name,
        gid: activeTheme.id
    };
}

/**
 * List ALL JSON template files available in the active theme
 */
export async function listAllTemplates(admin, session) {
    try {
        const theme = await getActiveTheme(admin);
        if (!theme) return { success: false, error: "No active theme found." };

        // Fetch all assets from the theme
        const restUrl = `https://${session.shop}/admin/api/2025-01/themes/${theme.id}/assets.json`;
        const response = await fetch(restUrl, {
            method: 'GET',
            headers: { 'X-Shopify-Access-Token': session.accessToken, 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            return { success: false, error: `Failed to list assets: ${response.statusText}` };
        }

        const data = await response.json();
        const allAssets = data.assets || [];

        // Filter for JSON template files only
        const jsonTemplates = allAssets
            .filter(a => a.key.startsWith('templates/') && a.key.endsWith('.json'))
            .map(a => {
                const meta = TEMPLATE_LABELS[a.key];
                return {
                    key: a.key,
                    label: meta?.label || a.key.replace('templates/', '').replace('.json', '').split(/[-_.]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    icon: meta?.icon || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>',
                    order: meta?.order ?? 99
                };
            })
            .sort((a, b) => a.order - b.order);

        return {
            success: true,
            themeName: theme.name,
            themeId: theme.id,
            templates: jsonTemplates
        };
    } catch (error) {
        console.error("Error listing templates:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch the exact structure of a JSON template (default: templates/index.json)
 */
export async function getThemeStructure(admin, session, template = 'templates/index.json') {
    try {
        // 1. Get the active (main) theme via GraphQL
        const themesResponse = await admin.graphql(
            `#graphql
            query {
                themes(first: 1, roles: [MAIN]) {
                    nodes {
                        id
                        name
                        role
                    }
                }
            }`
        );

        const themesData = await themesResponse.json();
        const activeTheme = themesData.data?.themes?.nodes?.[0];

        if (!activeTheme) {
            return { success: false, error: "No active theme found. Please publish a theme first." };
        }

        const numericId = activeTheme.id.split('/').pop();

        // 2. Fetch the JSON template file using REST Asset API
        const shop = session.shop;
        const accessToken = session.accessToken;

        const restUrl = `https://${shop}/admin/api/2025-01/themes/${numericId}/assets.json?asset[key]=${template}`;
        const rawResponse = await fetch(restUrl, {
            method: 'GET',
            headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' },
        });

        if (!rawResponse.ok) {
            return { success: false, error: `Failed to load template ${template}: ${rawResponse.statusText}` };
        }

        const assetData = await rawResponse.json();
        const jsonContent = JSON.parse(assetData.asset.value);

        return {
            success: true,
            themeId: numericId,
            themeName: activeTheme.name,
            template: template,
            structure: jsonContent
        };

    } catch (error) {
        console.error("Error fetching theme structure:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Replaces a specific block/section in a JSON template with a ConvertFlow section
 */
export async function replaceSectionInTheme(admin, session, oldBlockId, cfSectionCode, cfSectionId, template = 'templates/index.json') {
    try {
        const structureResult = await getThemeStructure(admin, session, template);
        if (!structureResult.success) throw new Error(structureResult.error);

        let jsonContent = structureResult.structure;

        // Determine which format the template uses
        const useSections = !!jsonContent.sections;
        const container = useSections ? jsonContent.sections : jsonContent.blocks;

        if (!container || !container[oldBlockId]) {
            throw new Error(`Section ID ${oldBlockId} not found in ${template}`);
        }

        // 2. Create the new section/block entry
        const newBlockId = `cf_${generateBlockId()}`;
        const newBlock = {
            type: cfSectionId,
            settings: {}
        };

        // 3. Update the container (sections or blocks)
        const newContainer = {};
        for (const [key, value] of Object.entries(container)) {
            if (key === oldBlockId) {
                newContainer[newBlockId] = newBlock;
            } else {
                newContainer[key] = value;
            }
        }

        if (useSections) {
            jsonContent.sections = newContainer;
        } else {
            jsonContent.blocks = newContainer;
        }

        // 4. Update the order array
        if (jsonContent.order && Array.isArray(jsonContent.order)) {
            jsonContent.order = jsonContent.order.map(id => id === oldBlockId ? newBlockId : id);
        }

        // 5. Upload the modified JSON back to Shopify
        const shop = session.shop;
        const accessToken = session.accessToken;
        const restUrl = `https://${shop}/admin/api/2025-01/themes/${structureResult.themeId}/assets.json`;

        const uploadResponse = await fetch(restUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            },
            body: JSON.stringify({
                asset: {
                    key: template,
                    value: JSON.stringify(jsonContent, null, 2),
                },
            }),
        });

        if (!uploadResponse.ok) {
            const errText = await uploadResponse.text();
            throw new Error(`Failed to save template: ${errText}`);
        }

        return { success: true, message: `Successfully replaced section in ${structureResult.themeName}!` };

    } catch (error) {
        console.error("Replacement error:", error);
        return { success: false, error: error.message };
    }
}
