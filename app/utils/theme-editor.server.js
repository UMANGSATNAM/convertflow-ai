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
    'templates/index.json': { label: 'Homepage', icon: '🏠', order: 0 },
    'templates/product.json': { label: 'Product Page', icon: '🛍️', order: 1 },
    'templates/collection.json': { label: 'Collection', icon: '📦', order: 2 },
    'templates/collection.list.json': { label: 'Collection List', icon: '📋', order: 3 },
    'templates/cart.json': { label: 'Cart', icon: '🛒', order: 4 },
    'templates/blog.json': { label: 'Blog', icon: '📝', order: 5 },
    'templates/article.json': { label: 'Article', icon: '📰', order: 6 },
    'templates/page.json': { label: 'Page', icon: '📄', order: 7 },
    'templates/page.contact.json': { label: 'Contact Page', icon: '✉️', order: 8 },
    'templates/search.json': { label: 'Search', icon: '🔍', order: 9 },
    'templates/404.json': { label: '404 Page', icon: '❌', order: 10 },
    'templates/password.json': { label: 'Password', icon: '🔒', order: 11 },
    'templates/gift_card.liquid': { label: 'Gift Card', icon: '🎁', order: 12 },
    'templates/customers/account.json': { label: 'Account', icon: '👤', order: 13 },
    'templates/customers/login.json': { label: 'Login', icon: '🔐', order: 14 },
    'templates/customers/register.json': { label: 'Register', icon: '📝', order: 15 },
    'templates/customers/order.json': { label: 'Order Details', icon: '📋', order: 16 },
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
                    icon: meta?.icon || '📄',
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
