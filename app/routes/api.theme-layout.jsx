import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { reorderThemeSections, updateSectionSettings, getInstalledSections } from "../utils/real-theme-installer.server";

export const loader = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const result = await getInstalledSections(admin, session);
    return json(result);
};

export const action = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const body = await request.json();

    if (body.action === 'reorder') {
        const result = await reorderThemeSections(admin, session, body.order);
        return json(result);
    }

    if (body.action === 'update_settings') {
        const result = await updateSectionSettings(admin, session, body.sectionKey, body.settings);
        return json(result);
    }

    return json({ success: false, error: 'Unknown action' });
};
