import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

/**
 * Design System API — Reads and writes theme-level settings (colors, fonts, etc.)
 * via Shopify's Asset API on config/settings_data.json
 */

async function getActiveThemeId(admin, session) {
    const res = await admin.graphql(`{ themes(first:1, roles:[MAIN]) { nodes { id name } } }`);
    const data = await res.json();
    const theme = data.data?.themes?.nodes?.[0];
    if (!theme) return null;
    return { id: theme.id.split('/').pop(), name: theme.name };
}

async function getThemeSettings(admin, session) {
    const theme = await getActiveThemeId(admin, session);
    if (!theme) return { success: false, error: "No active theme" };

    const url = `https://${session.shop}/admin/api/2025-01/themes/${theme.id}/assets.json?asset[key]=config/settings_data.json`;
    const res = await fetch(url, {
        headers: { 'X-Shopify-Access-Token': session.accessToken, 'Content-Type': 'application/json' }
    });

    if (!res.ok) return { success: false, error: `Failed to load settings: ${res.statusText}` };

    const assetData = await res.json();
    const settingsJson = JSON.parse(assetData.asset.value);

    // settings_data.json has "current" key with all active settings
    const currentPreset = settingsJson.current || {};
    // If "current" is a string (preset name), resolve it
    const resolvedSettings = typeof currentPreset === 'string'
        ? (settingsJson.presets?.[currentPreset] || {})
        : currentPreset;

    return {
        success: true,
        themeId: theme.id,
        themeName: theme.name,
        settings: resolvedSettings,
        rawJson: settingsJson
    };
}

async function updateThemeSettings(admin, session, updatedSettings) {
    const theme = await getActiveThemeId(admin, session);
    if (!theme) throw new Error("No active theme");

    // Read current full settings
    const url = `https://${session.shop}/admin/api/2025-01/themes/${theme.id}/assets.json?asset[key]=config/settings_data.json`;
    const res = await fetch(url, {
        headers: { 'X-Shopify-Access-Token': session.accessToken, 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error("Failed to read settings");

    const assetData = await res.json();
    const settingsJson = JSON.parse(assetData.asset.value);

    // Merge updates into current
    if (typeof settingsJson.current === 'string') {
        // current is a preset name, need to convert to object first
        const presetName = settingsJson.current;
        settingsJson.current = { ...(settingsJson.presets?.[presetName] || {}), ...updatedSettings };
    } else {
        settingsJson.current = { ...(settingsJson.current || {}), ...updatedSettings };
    }

    // Write back
    const putUrl = `https://${session.shop}/admin/api/2025-01/themes/${theme.id}/assets.json`;
    const putRes = await fetch(putUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': session.accessToken },
        body: JSON.stringify({
            asset: { key: 'config/settings_data.json', value: JSON.stringify(settingsJson, null, 2) }
        })
    });

    if (!putRes.ok) throw new Error(`Failed to save: ${await putRes.text()}`);
    return { success: true };
}

// ═══ LOADER ═══
export const loader = async ({ request }) => {
    try {
        const { admin, session } = await authenticate.admin(request);
        const result = await getThemeSettings(admin, session);
        return json(result);
    } catch (error) {
        console.error("Design System Loader Error:", error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
};

// ═══ ACTION ═══
export const action = async ({ request }) => {
    try {
        const { admin, session } = await authenticate.admin(request);
        const formData = await request.formData();
        const intent = formData.get("intent");

        if (intent === "update_settings") {
            const settingsStr = formData.get("settings");
            const settings = JSON.parse(settingsStr);
            const result = await updateThemeSettings(admin, session, settings);
            return json({ success: true, message: "Theme settings updated! Changes are live." });
        }

        return json({ success: false, error: "Unknown intent" });
    } catch (error) {
        console.error("Design System Action Error:", error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
};
