import { authenticate } from "../shopify.server";

/**
 * Install a section to the merchant's theme using GraphQL Admin API
 * This creates an App Block in the merchant's OS 2.0 theme
 */
export async function installSectionToTheme(admin, sectionCode, sectionSettings) {
    try {
        // Get the active theme
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
            throw new Error('No active theme found');
        }

        // Create App Block (Online Store 2.0 compatible)
        const appBlockCode = generateAppBlock(sectionCode, sectionSettings);

        // Use Asset API to add the section file
        const assetResponse = await admin.graphql(
            `#graphql
        mutation CreateAsset($input: OnlineStoreAssetUpsertInput!) {
          onlineStoreAssetUpsert(input: $input) {
            asset {
              key
              value
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
                        themeId: activeTheme.id,
                        key: `sections/convertflow-ai-section-${Date.now()}.liquid`,
                        value: appBlockCode,
                    },
                },
            }
        );

        const assetData = await assetResponse.json();

        if (assetData.data.onlineStoreAssetUpsert.userErrors.length > 0) {
            throw new Error(assetData.data.onlineStoreAssetUpsert.userErrors[0].message);
        }

        return {
            success: true,
            assetKey: assetData.data.onlineStoreAssetUpsert.asset.key,
            themeName: activeTheme.name,
        };
    } catch (error) {
        console.error('Section installation failed:', error);
        throw error;
    }
}

/**
 * Generate Liquid App Block code with schema
 */
function generateAppBlock(sectionCode, settings) {
    const schema = {
        name: "ConvertFlow AI Section",
        target: "section",
        settings: [
            {
                type: "text",
                id: "heading",
                label: "Heading",
                default: settings.heading || "Your Heading Here",
            },
            {
                type: "textarea",
                id: "description",
                label: "Description",
                default: settings.description || "",
            },
            {
                type: "text",
                id: "button_text",
                label: "Button Text",
                default: settings.buttonText || "Shop Now",
            },
            {
                type: "color",
                id: "primary_color",
                label: "Primary Color",
                default: settings.primaryColor || "#667eea",
            },
            {
                type: "color",
                id: "text_color",
                label: "Text Color",
                default: settings.textColor || "#1a202c",
            },
            {
                type: "color_background",
                id: "background_color",
                label: "Background",
                default: settings.backgroundColor || "#ffffff",
            },
            {
                type: "image_picker",
                id: "image",
                label: "Image",
            },
            {
                type: "range",
                id: "padding_top",
                min: 0,
                max: 200,
                step: 10,
                unit: "px",
                label: "Top Padding",
                default: settings.paddingTop || 80,
            },
            {
                type: "range",
                id: "padding_bottom",
                min: 0,
                max: 200,
                step: 10,
                unit: "px",
                label: "Bottom Padding",
                default: settings.paddingBottom || 80,
            },
            {
                type: "select",
                id: "alignment",
                label: "Text Alignment",
                options: [
                    { value: "left", label: "Left" },
                    { value: "center", label: "Center" },
                    { value: "right", label: "Right" },
                ],
                default: settings.alignment || "center",
            },
        ],
        presets: [
            {
                name: "ConvertFlow AI Section",
            },
        ],
    };

    return `
{% comment %}
  ConvertFlow AI - Premium Section
  Auto-generated from ConvertFlow AI App
{% endcomment %}

<div class="convertflow-section" 
     style="
       background: {{ section.settings.background_color }};
       padding-top: {{ section.settings.padding_top }}px;
       padding-bottom: {{ section.settings.padding_bottom }}px;
       text-align: {{ section.settings.alignment }};
     ">
  <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
    
    {% if section.settings.image != blank %}
      <div class="image-wrapper" style="margin-bottom: 2rem;">
        <img 
          src="{{ section.settings.image | img_url: '1200x' }}" 
          alt="{{ section.settings.heading }}"
          loading="lazy"
          style="width: 100%; height: auto; border-radius: 8px;"
        >
      </div>
    {% endif %}

    {% if section.settings.heading != blank %}
      <h2 
        style="
          color: {{ section.settings.text_color }};
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 700;
          margin-bottom: 1rem;
          font-family: {{ settings.headingFont.family | default: 'inherit' }};
        "
      >
        {{ section.settings.heading }}
      </h2>
    {% endif %}

    {% if section.settings.description != blank %}
      <p 
        style="
          color: {{ section.settings.text_color }};
          font-size: clamp(1rem, 2vw, 1.25rem);
          margin-bottom: 2rem;
          opacity: 0.9;
          font-family: {{ settings.bodyFont.family | default: 'inherit' }};
        "
      >
        {{ section.settings.description }}
      </p>
    {% endif %}

    {% if section.settings.button_text != blank %}
      <a 
        href="{{ section.settings.button_link | default: '#' }}"
        class="convertflow-button"
        style="
          display: inline-block;
          background: {{ section.settings.primary_color }};
          color: white;
          padding: 1rem 2.5rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.125rem;
          transition: all 0.3s ease;
        "
      >
        {{ section.settings.button_text }}
      </a>
    {% endif %}

  </div>
</div>

<style>
  .convertflow-button:hover {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  }

  @media (max-width: 768px) {
    .convertflow-section {
      padding-top: calc({{ section.settings.padding_top }}px * 0.6) !important;
      padding-bottom: calc({{ section.settings.padding_bottom }}px * 0.6) !important;
    }
  }
</style>

{% schema %}
${JSON.stringify(schema, null, 2)}
{% endschema %}
  `.trim();
}

/**
 * Remove a section from theme
 */
export async function removeSectionFromTheme(admin, assetKey) {
    try {
        const response = await admin.graphql(
            `#graphql
        mutation DeleteAsset($input: OnlineStoreAssetDeleteInput!) {
          onlineStoreAssetDelete(input: $input) {
            deletedAssetId
            userErrors {
              field
              message
            }
          }
        }`,
            {
                variables: {
                    input: {
                        assetKeys: [assetKey],
                    },
                },
            }
        );

        const data = await response.json();

        if (data.data.onlineStoreAssetDelete.userErrors.length > 0) {
            throw new Error(data.data.onlineStoreAssetDelete.userErrors[0].message);
        }

        return { success: true };
    } catch (error) {
        console.error('Section removal failed:', error);
        throw error;
    }
}

export default {
    installSectionToTheme,
    removeSectionFromTheme,
    generateAppBlock,
};
