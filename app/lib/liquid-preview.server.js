// app/lib/liquid-preview.server.js

/**
 * Super lightweight and robust Liquid emulator for Live Previews in the App.
 * Supports basic {{ var }}, {% if/else %}, {% assign/for split %}, default placeholder logic.
 */
export function simulateLiquidRendering(rawHtml, settings, blockId = 'preview-section') {
    if (!rawHtml) return '';
    let html = rawHtml;

    // 1. Remove schema block
    html = html.replace(/\{%-?\s*schema\s*-?%\}[\s\S]*?\{%-?\s*endschema\s*-?%\}/g, '');

    // 2. Convert {% style %} tags
    html = html.replace(/\{%-?\s*style\s*-?%\}/g, '<style>');
    html = html.replace(/\{%-?\s*endstyle\s*-?%\}/g, '</style>');

    // 3. Helper for placeholders
    const getPlaceholder = (key) => {
        if (key.includes('color') || key.includes('bg')) return '#dddddd';
        if (key.includes('height') || key.includes('width') || key.includes('size')) return '100';
        if (key.includes('opacity')) return '50';
        if (key.includes('text') || key.includes('title') || key.includes('heading')) return 'Sample Text';
        if (key.includes('image') || key.includes('img') || key.includes('logo')) return 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png';
        return '';
    };

    // 4. Resolve variables FIRST (with minimal filter support)
    // Supports: {{ section.settings.key | filter: arg }}
    html = html.replace(/\{\{\s*section\.settings\.([a-zA-Z0-9_]+)(.*?)\}\}/g, (_, key, filtersStr) => {
        let val = settings[key];
        let hasFilterDefault = false;

        // Very basic filter parsing for preview purposes
        if (filtersStr) {
            if (filtersStr.includes('default:')) {
                const defMatch = filtersStr.match(/default:\s*'([^']+)'/);
                if (defMatch && (!val || val === '')) {
                    val = defMatch[1];
                    hasFilterDefault = true;
                }
            }
            if (filtersStr.includes('divided_by:')) {
                const divMatch = filtersStr.match(/divided_by:\s*([\d.]+)/);
                if (divMatch && val) {
                    val = Number(val) / Number(divMatch[1]);
                }
            }
        }

        if (val === undefined || val === '') {
            val = hasFilterDefault ? val : getPlaceholder(key);
        }
        return String(val);
    });

    // 5. Evaluate `{% if %}` logic 
    // We only support simple: {% if section.settings.key != blank %} or {% if section.settings.key %}
    // with optional {% else %}
    html = html.replace(/\{%-?\s*if\s+section\.settings\.([a-zA-Z0-9_]+)(?:\s*!=\s*blank)?\s*-?%\}([\s\S]*?)(?:\{%-?\s*else\s*-?%\}([\s\S]*?))?\{%-?\s*endif\s*-?%\}/g, (_, key, ifTrue, ifFalse) => {
        const val = settings[key];
        // Falsy if undefined, false, or empty string (since it checks != blank)
        const isTruthy = val !== undefined && val !== false && val !== '';
        return isTruthy ? ifTrue : (ifFalse || '');
    });

    // 6. Evaluate `{% unless %}`
    html = html.replace(/\{%-?\s*unless\s+section\.settings\.([a-zA-Z0-9_]+)\s*-?%\}([\s\S]*?)(?:\{%-?\s*else\s*-?%\}([\s\S]*?))?\{%-?\s*endunless\s*-?%\}/g, (_, key, ifTrue, ifFalse) => {
        const val = settings[key];
        const isTruthy = val !== false && val !== undefined && val !== '';
        return !isTruthy ? ifTrue : (ifFalse || '');
    });

    // 7. Evaluate split iteration (e.g. {%- assign list = section.settings.key | split: '|' -%} {%- for item in list -%}...{%- endfor -%})
    html = html.replace(/\{%-?\s*assign\s+([a-zA-Z0-9_]+)\s*=\s*section\.settings\.([a-zA-Z0-9_]+)\s*\|\s*split:\s*'([^']+)'\s*-?%\}\s*\{%-?\s*for\s+([a-zA-Z0-9_]+)\s+in\s+\1\s*-?%\}([\s\S]*?)\{%-?\s*endfor\s*-?%\}/g, (_, varName, key, sep, loopVar, inner) => {
        let val = settings[key];
        if (val === undefined) val = getPlaceholder(key);
        const items = val.split(sep);
        return items.map(item => {
            let itemHtml = inner.replace(new RegExp(`\\{\\{\\s*${loopVar}\\s*\\|\\s*strip\\s*\\}\\}`, 'g'), item.trim());
            itemHtml = itemHtml.replace(new RegExp(`\\{\\{\\s*${loopVar}\\s*\\}\\}`, 'g'), item);
            return itemHtml;
        }).join('');
    });

    // 8. Global/System variables
    html = html.replace(/\{\{\s*shop\.name\s*\}\}/g, 'Preview Store');
    html = html.replace(/\{\{\s*routes\.[a-zA-Z0-9_]+\s*\}\}/g, '#');
    html = html.replace(/\{\{\s*cart\.item_count\s*\}\}/g, '0');
    html = html.replace(/\{\{\s*section\.id\s*\}\}/g, blockId);

    // 9. Strip remaining unsupported liquid tags to avoid broken HTML
    html = html.replace(/\{%-?.*?-?%\}/gs, '');
    html = html.replace(/\{\{.*?\}\}/gs, '');

    return html;
}
