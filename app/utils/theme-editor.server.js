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
