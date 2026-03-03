import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getThemeStructure, replaceSectionInTheme } from "../utils/theme-editor.server";
import { installSectionToTheme } from "../utils/theme-integration.server";
import db from "../db.server";

export const loader = async ({ request }) => {
    try {
        const { admin, session } = await authenticate.admin(request);

        // Fetch the active theme's index.json
        const structureResult = await getThemeStructure(admin, session, 'templates/index.json');

        if (!structureResult.success) {
            return json({ success: false, error: structureResult.error }, { status: 400 });
        }

        // Parse the sections into a flat predictable array for the frontend
        const parsedSections = [];
        const jsonContent = structureResult.structure || {};

        // Format 1: Shopify OS2.0 "sections" + "order" format (most common)
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
                        type: type,
                        name: friendlyName,
                        isCF: isCF,
                        order: index
                    });
                }
            });
        }
        // Format 2: "blocks" + "order" format (less common, some themes)
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
                        type: type,
                        name: friendlyName,
                        isCF: isCF,
                        order: index
                    });
                }
            });
        }
        // Format 3: Just "sections" without "order" (fallback)
        else if (jsonContent.sections) {
            Object.entries(jsonContent.sections).forEach(([sectionId, sectionData], index) => {
                const type = sectionData.type || 'unknown';
                let friendlyName = type.split(/[-_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                const isCF = type.startsWith('cf-');
                if (isCF) friendlyName = "ConvertFlow Section";

                parsedSections.push({
                    id: sectionId,
                    type: type,
                    name: friendlyName,
                    isCF: isCF,
                    order: index
                });
            });
        }

        console.log(`[ThemeEditor] Parsed ${parsedSections.length} sections from ${structureResult.themeName}`);

        return json({
            success: true,
            themeId: structureResult.themeId,
            themeName: structureResult.themeName,
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
        const oldBlockId = formData.get("oldBlockId"); // e.g. "123e4567-e89b-12d3"
        const newSectionId = formData.get("newSectionId"); // CF Premium Section ID (from DB)

        try {
            // 1. Fetch the requested ConvertFlow section from DB
            const section = await db.sections.getById(newSectionId);
            if (!section) return json({ success: false, error: "CF Section not found in DB." });

            // 2. Upload the .liquid file to the theme (so it exists before we reference it in JSON)
            // We pass 'all' placement so it doesn't give a specific instruction
            const installResult = await installSectionToTheme(admin, session, section, {}, 'all');
            if (!installResult.success) {
                return json({ success: false, error: "Failed to inject liquid file: " + installResult.error });
            }

            // The section type in JSON must match the filename without .liquid
            // theme-integration generateSlug creates: `sections/cf-${slug}.liquid`
            const expectedType = installResult.sectionFile.replace('sections/', '').replace('.liquid', '');

            // 3. Edit index.json to replace the old block with this new type
            const replaceResult = await replaceSectionInTheme(
                admin,
                session,
                oldBlockId,
                section.html_code,
                expectedType,
                'templates/index.json'
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

    return json({ success: false, error: "Invalid action" });
};
