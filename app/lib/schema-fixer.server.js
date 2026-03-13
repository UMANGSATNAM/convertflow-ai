/**
 * Parses and fixes Shopify Section Schema.
 * 
 * 1. Strips all "t:" translations and converts them back to English keys.
 *    e.g. "t:settings.color_scheme" -> "Color scheme"
 * 2. Truncates schema "name" and preset names to 25 characters max (Shopify limit).
 * 3. This completely removes the dependency on the theme's locales
 *    so sections can be injected successfully into ANY theme.
 * 
 * @param {string} liquidContent The raw liquid file content
 * @returns {string} The liquid file content with fixed schema
 */
export function removeSchemaTranslations(liquidContent) {
    const startToken = '{% schema %}';
    const endToken = '{% endschema %}';

    const startIndex = liquidContent.indexOf(startToken);
    const endIndex = liquidContent.indexOf(endToken);

    if (startIndex === -1 || endIndex === -1) return liquidContent;

    try {
        const schemaString = liquidContent.substring(startIndex + startToken.length, endIndex).trim();

        // 1. Replace "t:..." and "en...." strings with plain English
        let fixedSchema = schemaString.replace(/"(?:t:|en\.)([^"]+)"/g, (match, p1) => {
            const parts = p1.split('.');
            let lastPart = parts[parts.length - 1];

            // If it ends in generic keys, use the previous part for context
            if ((lastPart === 'label' || lastPart === 'info' || lastPart === 'title' || lastPart === 'name' || lastPart === 'content') && parts.length > 1) {
                lastPart = parts[parts.length - 2];
            }

            // Convert something like "layout_type" to "Layout Type"
            const EnglishName = lastPart
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, str => str.toUpperCase());

            return `"${EnglishName}"`;
        });

        // 2. Parse and fix name lengths (max 25 characters for Shopify)
        try {
            const parsed = JSON.parse(fixedSchema);
            let modified = false;

            if (parsed.name && parsed.name.length > 25) {
                parsed.name = parsed.name.substring(0, 25);
                modified = true;
            }

            if (parsed.presets && Array.isArray(parsed.presets)) {
                parsed.presets.forEach(preset => {
                    if (preset.name && preset.name.length > 25) {
                        preset.name = preset.name.substring(0, 25);
                        modified = true;
                    }
                });
            }

            if (modified) {
                fixedSchema = JSON.stringify(parsed, null, 2);
            }
        } catch {
            // Schema may contain non-standard JSON, skip deep parse
        }

        return liquidContent.substring(0, startIndex + startToken.length) +
            '\n' + fixedSchema + '\n' +
            liquidContent.substring(endIndex);
    } catch (e) {
        console.error("Failed to fix schema", e);
        return liquidContent; // Return original on absolute failure
    }
}

