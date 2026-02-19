/**
 * Theme Installation Engine — ConvertFlow AI
 * 
 * Installs premium HTML/CSS sections directly into Shopify OS 2.0 themes
 * using the GraphQL Admin API's asset management.
 */

/**
 * Install a section's HTML/CSS to the merchant's active theme.
 * Wraps the raw HTML in a Liquid section file with a proper schema.
 */
export async function installSectionToTheme(admin, section, customSettings = {}) {
  try {
    // 1. Get the active (main) theme
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
    const activeTheme = themesData.data.themes.nodes[0];

    if (!activeTheme) {
      throw new Error("No active theme found. Please publish a theme first.");
    }

    // 2. Generate the Liquid section wrapper for the HTML code
    const sectionFileName = generateSectionFileName(section.name);
    const liquidCode = wrapHtmlInLiquidSection(section, customSettings);

    // 3. Upload as a theme asset
    const assetResponse = await admin.graphql(
      `#graphql
            mutation CreateAsset($input: OnlineStoreThemeFileBodyInputAssetUpsert!) {
                onlineStoreThemeFilesUpsert(
                    themeId: "${activeTheme.id}",
                    files: [$input]
                ) {
                    upsertedThemeFiles {
                        filename
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }`,
      {
        variables: {
          input: {
            filename: `sections/${sectionFileName}.liquid`,
            body: {
              type: "TEXT",
              value: liquidCode,
            },
          },
        },
      }
    );

    const assetData = await assetResponse.json();

    // Check for errors
    if (assetData.errors) {
      // Fallback: try with REST API approach via asset key
      return await installViaRestFallback(admin, activeTheme.id, sectionFileName, liquidCode);
    }

    const userErrors = assetData.data?.onlineStoreThemeFilesUpsert?.userErrors || [];
    if (userErrors.length > 0) {
      throw new Error(userErrors.map(e => e.message).join(', '));
    }

    return {
      success: true,
      sectionFile: `sections/${sectionFileName}.liquid`,
      themeName: activeTheme.name,
      themeId: activeTheme.id,
      message: `Section "${section.name}" installed to theme "${activeTheme.name}". Go to Customize Theme → Add Section to use it.`,
    };
  } catch (error) {
    console.error("❌ Theme installation error:", error);
    return {
      success: false,
      error: error.message || "Installation failed. Please check your theme settings.",
    };
  }
}

/**
 * Fallback installation method — uses the REST-style asset PUT approach
 */
async function installViaRestFallback(admin, themeId, sectionFileName, liquidCode) {
  try {
    // Extract numeric theme ID from GID
    const numericId = themeId.replace(/.*\//, '');

    const response = await admin.rest.put({
      path: `themes/${numericId}/assets`,
      data: {
        asset: {
          key: `sections/${sectionFileName}.liquid`,
          value: liquidCode,
        },
      },
    });

    return {
      success: true,
      sectionFile: `sections/${sectionFileName}.liquid`,
      message: `Section installed via REST API. Go to Customize Theme → Add Section to use it.`,
    };
  } catch (restError) {
    console.error("❌ REST fallback also failed:", restError);
    throw new Error("Both GraphQL and REST installation methods failed. Ensure write_themes scope is granted.");
  }
}

/**
 * Wraps the raw HTML/CSS from the database into a proper Liquid section
 * with a schema block so it appears in the theme customizer.
 */
function wrapHtmlInLiquidSection(section, customSettings = {}) {
  const sectionName = section.name || "ConvertFlow AI Section";
  const category = section.category || "Custom";

  const schema = {
    name: `CF: ${sectionName}`,
    class: "convertflow-section",
    tag: "section",
    settings: [
      {
        type: "header",
        content: `${sectionName}`
      },
      {
        type: "paragraph",
        content: `Premium section by ConvertFlow AI • ${category} • Score: ${section.conversion_score || 0}%`
      },
      {
        type: "checkbox",
        id: "section_visible",
        label: "Show this section",
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
        category: `ConvertFlow AI - ${category}`,
      },
    ],
  };

  return `{% comment %}
  ConvertFlow AI — Premium Section
  Name: ${sectionName}
  Category: ${category}
  Conversion Score: ${section.conversion_score || 0}%
  Auto-installed by ConvertFlow AI Conversion Engine
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
 * Generate a safe filename from the section name.
 */
function generateSectionFileName(name) {
  return 'cf-' + name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Remove a ConvertFlow AI section from the theme
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
    const activeTheme = themesData.data.themes.nodes[0];
    if (!activeTheme) throw new Error("No active theme found.");

    const response = await admin.graphql(
      `#graphql
            mutation DeleteAsset($themeId: ID!, $files: [String!]!) {
                onlineStoreThemeFilesDelete(themeId: $themeId, files: $files) {
                    deletedThemeFiles
                    userErrors { field message }
                }
            }`,
      {
        variables: {
          themeId: activeTheme.id,
          files: [`sections/${sectionFileName}.liquid`],
        },
      }
    );

    const data = await response.json();
    const userErrors = data.data?.onlineStoreThemeFilesDelete?.userErrors || [];
    if (userErrors.length > 0) {
      throw new Error(userErrors.map(e => e.message).join(', '));
    }

    return { success: true, message: `Section removed from "${activeTheme.name}"` };
  } catch (error) {
    console.error("❌ Section removal failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * List all ConvertFlow AI sections currently installed in the theme
 */
export async function listInstalledSections(admin) {
  try {
    const themesResponse = await admin.graphql(
      `#graphql
            query {
                themes(first: 1, roles: [MAIN]) {
                    nodes {
                        id
                        name
                        files(filenames: ["sections/*"]) {
                            nodes {
                                filename
                                size
                            }
                        }
                    }
                }
            }`
    );

    const data = await themesResponse.json();
    const theme = data.data?.themes?.nodes?.[0];
    if (!theme) return { sections: [], themeName: "Unknown" };

    const cfSections = (theme.files?.nodes || [])
      .filter(f => f.filename.startsWith("sections/cf-"));

    return {
      sections: cfSections,
      themeName: theme.name,
    };
  } catch (error) {
    console.error("❌ Failed to list installed sections:", error);
    return { sections: [], error: error.message };
  }
}
