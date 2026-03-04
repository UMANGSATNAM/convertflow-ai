import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getThemeStructure, replaceSectionInTheme, listAllTemplates } from "../utils/theme-editor.server";
import { installSectionToTheme } from "../utils/theme-integration.server";
import db from "../db.server";

/**
 * Helper: Parse a Shopify JSON template structure into a flat sections array
 */
function parseSections(jsonContent) {
    const parsedSections = [];

    // Format 1: Shopify OS2.0 "sections" + "order" (most common)
    if (jsonContent.sections && jsonContent.order && Array.isArray(jsonContent.order)) {
        jsonContent.order.forEach((sectionId, index) => {
            const sectionData = jsonContent.sections[sectionId];
            if (sectionData) {
                const type = sectionData.type || 'unknown';
                let friendlyName = type.split(/[-_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                const isCF = type.startsWith('cf-');
                if (isCF) friendlyName = "ConvertFlow Section";

                parsedSections.push({
                    id: sectionId,
                    type,
                    name: friendlyName,
                    isCF,
                    order: index,
                    settings: sectionData.settings || {},
                    disabled: sectionData.disabled || false
                });
            }
        });
    }
    // Format 2: "blocks" + "order"
    else if (jsonContent.blocks && jsonContent.order && Array.isArray(jsonContent.order)) {
        jsonContent.order.forEach((blockId, index) => {
            const blockData = jsonContent.blocks[blockId];
            if (blockData) {
                const type = blockData.type || 'unknown';
                let friendlyName = type.split(/[-_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                const isCF = type.startsWith('cf-');
                if (isCF) friendlyName = "ConvertFlow Section";

                parsedSections.push({
                    id: blockId,
                    type,
                    name: friendlyName,
                    isCF,
                    order: index,
                    settings: blockData.settings || {},
                    disabled: blockData.disabled || false
                });
            }
        });
    }
    // Format 3: Just "sections" without "order"
    else if (jsonContent.sections) {
        Object.entries(jsonContent.sections).forEach(([sectionId, sectionData], index) => {
            const type = sectionData.type || 'unknown';
            let friendlyName = type.split(/[-_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const isCF = type.startsWith('cf-');
            if (isCF) friendlyName = "ConvertFlow Section";

            parsedSections.push({
                id: sectionId,
                type,
                name: friendlyName,
                isCF,
                order: index,
                settings: sectionData.settings || {},
                disabled: sectionData.disabled || false
            });
        });
    }

    return parsedSections;
}

export const loader = async ({ request }) => {
    try {
        const { admin, session } = await authenticate.admin(request);
        const url = new URL(request.url);
        const mode = url.searchParams.get('list');
        const templateKey = url.searchParams.get('template') || 'templates/index.json';

        // Mode 1: List all available templates
        if (mode === 'templates') {
            const result = await listAllTemplates(admin, session);
            return json(result);
        }

        // Mode 2: Load a specific template's sections
        const structureResult = await getThemeStructure(admin, session, templateKey);

        if (!structureResult.success) {
            return json({ success: false, error: structureResult.error }, { status: 400 });
        }

        const jsonContent = structureResult.structure || {};
        const parsedSections = parseSections(jsonContent);

        console.log(`[ThemeEditor] Parsed ${parsedSections.length} sections from "${templateKey}" (${structureResult.themeName})`);

        return json({
            success: true,
            themeId: structureResult.themeId,
            themeName: structureResult.themeName,
            template: templateKey,
            sections: parsedSections,
            rawJson: jsonContent
        });
    } catch (error) {
        console.error("Theme Editor Loader Error:", error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
};

export const action = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const actionType = formData.get("_action");

    if (actionType === "replace_section") {
        const oldBlockId = formData.get("oldBlockId");
        const newSectionId = formData.get("newSectionId");
        const templateKey = formData.get("template") || 'templates/index.json';

        try {
            // 1. Fetch the requested ConvertFlow section from DB
            const section = await db.sections.getById(newSectionId);
            if (!section) return json({ success: false, error: "CF Section not found in DB." });

            // 2. Upload the .liquid file to the theme
            const installResult = await installSectionToTheme(admin, session, section, {}, 'all');
            if (!installResult.success) {
                return json({ success: false, error: "Failed to inject liquid file: " + installResult.error });
            }

            // The section type in JSON must match the filename without .liquid
            const expectedType = installResult.sectionFile.replace('sections/', '').replace('.liquid', '');

            // 3. Edit the correct template's JSON to replace the old block
            const replaceResult = await replaceSectionInTheme(
                admin,
                session,
                oldBlockId,
                section.html_code,
                expectedType,
                templateKey  // Now targets the correct template!
            );

            if (!replaceResult.success) {
                return json({ success: false, error: "Failed to modify JSON template: " + replaceResult.error });
            }

            return json({ success: true, message: `Successfully replaced section with CF: ${section.name}` });

        } catch (error) {
            console.error("Replace API Error:", error);
            return json({ success: false, error: error.message }, { status: 500 });
        }
    }

    if (actionType === "remove_section") {
        const sectionId = formData.get("sectionId");
        const templateKey = formData.get("template") || 'templates/index.json';

        try {
            const structureResult = await getThemeStructure(admin, session, templateKey);
            if (!structureResult.success) throw new Error(structureResult.error);

            let jsonContent = structureResult.structure;
            const container = jsonContent.sections || jsonContent.blocks;

            if (!container || !container[sectionId]) {
                throw new Error(`Section ${sectionId} not found in ${templateKey}`);
            }

            // Remove from container
            delete container[sectionId];

            // Remove from order array
            if (jsonContent.order && Array.isArray(jsonContent.order)) {
                jsonContent.order = jsonContent.order.filter(id => id !== sectionId);
            }

            // Save back to Shopify
            const restUrl = `https://${session.shop}/admin/api/2025-01/themes/${structureResult.themeId}/assets.json`;
            const uploadResponse = await fetch(restUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': session.accessToken },
                body: JSON.stringify({ asset: { key: templateKey, value: JSON.stringify(jsonContent, null, 2) } }),
            });

            if (!uploadResponse.ok) throw new Error(`Failed to save: ${await uploadResponse.text()}`);

            return json({ success: true, message: "Section removed successfully!" });
        } catch (error) {
            console.error("Remove Section Error:", error);
            return json({ success: false, error: error.message }, { status: 500 });
        }
    }

    if (actionType === "add_section") {
        const cfSectionId = formData.get("cfSectionId");
        const templateKey = formData.get("template") || 'templates/index.json';
        const position = formData.get("position") || "end"; // "start" or "end"

        try {
            const section = await db.sections.getById(cfSectionId);
            if (!section) return json({ success: false, error: "CF Section not found." });

            // Install the .liquid file first
            const installResult = await installSectionToTheme(admin, session, section, {}, 'all');
            if (!installResult.success) {
                return json({ success: false, error: "Failed to inject liquid: " + installResult.error });
            }

            const expectedType = installResult.sectionFile.replace('sections/', '').replace('.liquid', '');

            // Get current template
            const structureResult = await getThemeStructure(admin, session, templateKey);
            if (!structureResult.success) throw new Error(structureResult.error);

            let jsonContent = structureResult.structure;
            const container = jsonContent.sections || jsonContent.blocks || {};
            const newId = `cf_${Date.now().toString(36)}`;

            container[newId] = { type: expectedType, settings: {} };

            if (jsonContent.sections) jsonContent.sections = container;
            else jsonContent.blocks = container;

            // Add to order array
            if (jsonContent.order && Array.isArray(jsonContent.order)) {
                if (position === "start") jsonContent.order.unshift(newId);
                else jsonContent.order.push(newId);
            }

            // Save
            const restUrl = `https://${session.shop}/admin/api/2025-01/themes/${structureResult.themeId}/assets.json`;
            const uploadResponse = await fetch(restUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': session.accessToken },
                body: JSON.stringify({ asset: { key: templateKey, value: JSON.stringify(jsonContent, null, 2) } }),
            });

            if (!uploadResponse.ok) throw new Error(`Failed to save: ${await uploadResponse.text()}`);

            return json({ success: true, message: `Added "${section.name}" to ${templateKey}!` });
        } catch (error) {
            console.error("Add Section Error:", error);
            return json({ success: false, error: error.message }, { status: 500 });
        }
    }

    return json({ success: false, error: "Invalid action" });
};
