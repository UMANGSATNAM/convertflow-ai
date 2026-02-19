/**
 * Theme Installation Engine — ConvertFlow AI
 * Uses REST Admin API for reliable theme asset management
 */

/**
 * Install a section's HTML/CSS to the merchant's active theme via REST API.
 */
export async function installSectionToTheme(admin, section, customSettings = {}) {
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

    // 2. Extract numeric theme ID from GID (e.g., "gid://shopify/OnlineStoreTheme/123456" -> "123456")
    const themeGid = activeTheme.id;
    const numericId = themeGid.split('/').pop();

    // 3. Generate section file
    const sectionFileName = generateSectionFileName(section.name);
    const liquidCode = wrapHtmlInLiquidSection(section, customSettings);

    // 4. Install via REST API (most reliable method)
    const response = await admin.rest.put({
      path: `themes/${numericId}/assets`,
      data: {
        asset: {
          key: `sections/${sectionFileName}.liquid`,
          value: liquidCode,
        },
      },
    });

    const result = response.body;

    return {
      success: true,
      sectionFile: `sections/${sectionFileName}.liquid`,
      themeName: activeTheme.name,
      themeId: numericId,
      message: `✅ "${section.name}" installed to "${activeTheme.name}"! Go to Online Store → Customize → Add Section → search for "CF:" to find it.`,
    };
  } catch (error) {
    console.error("❌ Theme installation error:", error);

    // Provide helpful error message
    let userMessage = error.message || "Installation failed.";
    if (userMessage.includes("401") || userMessage.includes("403")) {
      userMessage = "Permission denied. Make sure your app has write_themes scope.";
    } else if (userMessage.includes("404")) {
      userMessage = "Theme not found. Make sure you have an active theme.";
    } else if (userMessage.includes("422")) {
      userMessage = "Invalid section code. The HTML may contain syntax errors.";
    }

    return {
      success: false,
      error: userMessage,
    };
  }
}

/**
 * Wraps raw HTML/CSS in a Liquid section file with schema
 */
function wrapHtmlInLiquidSection(section, customSettings = {}) {
  const sectionName = section.name || "ConvertFlow AI Section";
  const category = section.category || "Custom";

  const schema = {
    name: `CF: ${sectionName}`,
    class: "cf-section",
    tag: "section",
    settings: [
      {
        type: "header",
        content: sectionName
      },
      {
        type: "paragraph",
        content: `ConvertFlow AI • ${category} • Score: ${section.conversion_score || 0}%`
      },
      {
        type: "checkbox",
        id: "section_visible",
        label: "Show section",
        default: true
      },
      {
        type: "range",
        id: "padding_top",
        min: 0, max: 200, step: 4, unit: "px",
        label: "Top padding",
        default: 0
      },
      {
        type: "range",
        id: "padding_bottom",
        min: 0, max: 200, step: 4, unit: "px",
        label: "Bottom padding",
        default: 0
      },
    ],
    presets: [
      {
        name: `CF: ${sectionName}`,
        category: `ConvertFlow AI`,
      },
    ],
  };

  return `{% comment %}
  ConvertFlow AI — Premium Section
  Name: ${sectionName}
  Category: ${category}
  Score: ${section.conversion_score || 0}%
{% endcomment %}

{% if section.settings.section_visible %}
<div class="cf-section-wrapper" style="padding-top:{{ section.settings.padding_top }}px; padding-bottom:{{ section.settings.padding_bottom }}px;">
${section.html_code || '<!-- No content -->'}
</div>
{% endif %}

{% schema %}
${JSON.stringify(schema, null, 2)}
{% endschema %}
`;
}

/**
 * Generate safe filename
 */
function generateSectionFileName(name) {
  return 'cf-' + name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Remove a section from theme via REST API
 */
export async function removeSectionFromTheme(admin, sectionFileName) {
  try {
    const themesResponse = await admin.graphql(
      `#graphql
            query {
                themes(first: 1, roles: [MAIN]) {
                    nodes { id name }
                }
            }`
    );

    const themesData = await themesResponse.json();
    const activeTheme = themesData.data?.themes?.nodes?.[0];
    if (!activeTheme) return { success: false, error: "No active theme found." };

    const numericId = activeTheme.id.split('/').pop();

    await admin.rest.delete({
      path: `themes/${numericId}/assets`,
      query: { "asset[key]": `sections/${sectionFileName}.liquid` },
    });

    return { success: true, message: `Section removed from "${activeTheme.name}"` };
  } catch (error) {
    console.error("❌ Section removal failed:", error);
    return { success: false, error: error.message };
  }
}
