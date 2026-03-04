import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { batchInstallStoreBuilder } from "../utils/theme-integration.server";
import db from "../db.server";

export const action = async ({ request }) => {
    try {
        const { session, admin } = await authenticate.admin(request);
        const formData = await request.formData();

        const actionType = formData.get("_action");
        if (actionType !== "batch_install") {
            return json({ success: false, message: "Invalid action" });
        }

        // The frontend sends an array of section IDs in the exact order they selected them
        const sectionIdsList = formData.get("sectionIds");
        if (!sectionIdsList) {
            return json({ success: false, message: "No sections provided." });
        }

        const idsArray = JSON.parse(sectionIdsList);
        if (!Array.isArray(idsArray) || idsArray.length === 0) {
            return json({ success: false, message: "Invalid sections format." });
        }

        // Fetch the full section objects from the database in the exact sequence requested
        const sectionsArray = [];
        for (const id of idsArray) {
            const sec = await db.sections.getById(id);
            if (sec) sectionsArray.push(sec);
        }

        if (sectionsArray.length === 0) {
            return json({ success: false, message: "Could not find selected sections in database." });
        }

        // Execute the massive batch install
        const result = await batchInstallStoreBuilder(admin, session, sectionsArray);

        if (result.success) {
            return json({ success: true, message: `Successfully installed ${sectionsArray.length} sections to your premium homepage!` });
        } else {
            return json({ success: false, message: result.error || "Batch installation failed." });
        }

    } catch (error) {
        console.error("API / store builder error:", error);
        return json({ success: false, message: error.message || "An unexpected error occurred." });
    }
};
