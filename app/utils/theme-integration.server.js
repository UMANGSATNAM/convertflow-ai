/**
 * Theme Installation Engine — ConvertFlow AI
 * Uses direct REST API fetch for maximum reliability.
 */

/**
 * Install a section to the merchant's active theme.
 * Uses GraphQL to find theme, then REST to upload the section file.
 */
export async function installSectionToTheme(admin, session, section, customSettings = {}, placement = 'homepage') {
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

    // 2. Extract numeric theme ID
    const numericId = activeTheme.id.split('/').pop();

    // 3. Generate section content
    const sectionSlug = generateSlug(section.name);
    const sectionKey = `sections/cf-${sectionSlug}.liquid`;
    const liquidCode = buildLiquidSection(section, customSettings);

    // 4. Upload via REST API (direct fetch — most reliable)
    const shop = session.shop;
    const accessToken = session.accessToken;

    if (!accessToken) {
      return { success: false, error: "Missing access token. Please re-authenticate the app." };
    }

    const restUrl = `https://${shop}/admin/api/2025-01/themes/${numericId}/assets.json`;

    const uploadResponse = await fetch(restUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        asset: {
          key: sectionKey,
          value: liquidCode,
        },
      }),
    });

    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.text();
      console.error("REST API error:", uploadResponse.status, errorBody);

      if (uploadResponse.status === 401 || uploadResponse.status === 403) {
        return { success: false, error: "Permission denied. The app needs write_themes scope. Please reinstall." };
      }
      if (uploadResponse.status === 422) {
        return { success: false, error: "Invalid section code. Please check for syntax errors." };
      }
      return { success: false, error: `API Error ${uploadResponse.status}: ${errorBody}` };
    }

    const resultData = await uploadResponse.json();

    // 5. Build placement instructions
    const placementGuide = getPlacementGuide(placement);

    return {
      success: true,
      sectionFile: sectionKey,
      themeName: activeTheme.name,
      themeId: numericId,
      placement: placementGuide,
      message: `"${section.name}" installed to "${activeTheme.name}"! ${placementGuide.instruction}`,
    };
  } catch (error) {
    console.error("Theme installation error:", error);
    return {
      success: false,
      error: error.message || "Installation failed. Please try again.",
    };
  }
}

/**
 * Get placement instructions for the user
 */
function getPlacementGuide(placement) {
  const guides = {
    homepage: {
      template: 'index',
      instruction: 'Go to Online Store → Customize → Home page → Add section → search "CF:" to find it.',
    },
    product: {
      template: 'product',
      instruction: 'Go to Online Store → Customize → Product page → Add section → search "CF:" to find it.',
    },
    collection: {
      template: 'collection',
      instruction: 'Go to Online Store → Customize → Collection page → Add section → search "CF:" to find it.',
    },
    blog: {
      template: 'blog',
      instruction: 'Go to Online Store → Customize → Blog → Add section → search "CF:" to find it.',
    },
    all: {
      template: 'all',
      instruction: 'Section available on ALL pages. Go to Online Store → Customize → any page → Add section → search "CF:".',
    },
  };
  return guides[placement] || guides.homepage;
}

/**
 * Build a Liquid section from the HTML/CSS
 */
function buildLiquidSection(section, customSettings = {}) {
  const name = section.name || "ConvertFlow Section";
  const category = section.category || "Custom";
  const score = section.conversion_score || 0;
  const htmlCode = section.html_code || '<!-- Empty section -->';

  const schema = {
    name: `CF: ${name}`,
    class: "cf-section",
    tag: "section",
    settings: [
      { type: "header", content: name },
      { type: "paragraph", content: `ConvertFlow AI | ${category} | Conversion Score: ${score}%` },
      { type: "checkbox", id: "section_visible", label: "Show this section", default: true },
      { type: "color", id: "cf_bg_color", label: "Background color", default: "transparent" },
      { type: "range", id: "padding_top", min: 0, max: 200, step: 4, unit: "px", label: "Top padding", default: customSettings.paddingTop || 0 },
      { type: "range", id: "padding_bottom", min: 0, max: 200, step: 4, unit: "px", label: "Bottom padding", default: customSettings.paddingBottom || 0 },
    ],
    presets: [{ name: `CF: ${name}`, category: "ConvertFlow AI" }],
  };

  return `{% comment %}
  ConvertFlow AI Premium Section
  Name: ${name}
  Category: ${category}
  Conversion Score: ${score}%
{% endcomment %}

{% if section.settings.section_visible %}
<div class="cf-section-wrapper" style="
  padding-top: {{ section.settings.padding_top }}px;
  padding-bottom: {{ section.settings.padding_bottom }}px;
  {% if section.settings.cf_bg_color != 'transparent' and section.settings.cf_bg_color != blank %}
    background-color: {{ section.settings.cf_bg_color }};
  {% endif %}
">
${htmlCode}
</div>
{% endif %}

{% schema %}
${JSON.stringify(schema, null, 2)}
{% endschema %}
`;
}

/**
 * Remove a section from theme
 */
export async function removeSectionFromTheme(admin, session, sectionName) {
  try {
    const themesResponse = await admin.graphql(
      `#graphql
            query { themes(first: 1, roles: [MAIN]) { nodes { id name } } }`
    );
    const themesData = await themesResponse.json();
    const activeTheme = themesData.data?.themes?.nodes?.[0];
    if (!activeTheme) return { success: false, error: "No active theme found." };

    const numericId = activeTheme.id.split('/').pop();
    const slug = generateSlug(sectionName);
    const sectionKey = `sections/cf-${slug}.liquid`;

    const response = await fetch(
      `https://${session.shop}/admin/api/2025-01/themes/${numericId}/assets.json?asset[key]=${encodeURIComponent(sectionKey)}`,
      {
        method: 'DELETE',
        headers: { 'X-Shopify-Access-Token': session.accessToken },
      }
    );

    if (!response.ok) {
      return { success: false, error: `Failed to remove: ${response.status}` };
    }

    return { success: true, message: `Section removed from "${activeTheme.name}"` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate URL-safe slug from name
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}
