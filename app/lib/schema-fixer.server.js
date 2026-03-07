/**
 * Parses and fixes Shopify Section Schema.
 * 
 * 1. Strips all "t:" translations and converts them back to English keys.
 *    e.g. "t:settings.color_scheme" -> "Color scheme"
 * 2. This completely removes the dependency on the theme's locales
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

        // Catch "t:..." OR "en...." strings
        let fixedSchema = schemaString.replace(/"(?:t:|en\.)([^"]+)"/g, (match, p1) => {
            // e.g. "settings.video.video_url" -> "Video url"
            // e.g. "placeholders.collection_title" -> "Collection title"
            const parts = p1.split('.');
            let lastPart = parts[parts.length - 1];

            // If it ends with "label" or "info" and has a previous part, use the previous part
            if ((lastPart === 'label' || lastPart === 'info' || lastPart === 'title') && parts.length > 1) {
                lastPart = parts[parts.length - 2];
            }

            // Basic English sentence case converter
            const EnglishName = lastPart
                .replace(/_/g, ' ')
                .replace(/^./, str => str.toUpperCase());

            return `"${EnglishName}"`;
        });

        return liquidContent.substring(0, startIndex + startToken.length) +
            '\n' + fixedSchema + '\n' +
            liquidContent.substring(endIndex);
    } catch (e) {
        console.error("Failed to fix schema", e);
        return liquidContent; // Return original on absolute failure
    }
}
