import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

/**
 * api.page-builder.jsx
 * - GET ?pageType=home → returns all sections grouped for that page type
 * - GET ?pageType=home&fullTemplates=1 → returns full page template objects (HTML composites)
 * - POST _action=replace_page → replaces the entire template JSON with selected sections
 * - POST _action=inject_custom → uploads custom Liquid code as new section and adds to template
 */

// Maps pageType → relevant section categories to pull from DB
const PAGE_TYPE_CATEGORIES = {
    home: ['Announcement Bars', 'Headers', 'Hero Sections', 'Trust Badges', 'Features & Benefits', 'Product Highlights', 'Testimonials', 'Stats & Metrics', 'Call to Action', 'Footers'],
    product: ['Product Highlights', 'Trust Badges', 'Testimonials', 'Features & Benefits', 'Call to Action', 'Urgency Tools', 'FAQ & Accordions'],
    collection: ['Headers', 'Hero Sections', 'Product Grid', 'Trust Badges', 'Call to Action', 'Footers'],
    blog: ['Hero Sections', 'Features & Benefits', 'Call to Action', 'Social Proof', 'Footers'],
    cart: ['Trust Badges', 'Urgency Tools', 'Call to Action', 'Features & Benefits'],
    about: ['Hero Sections', 'Features & Benefits', 'Testimonials', 'Stats & Metrics', 'Call to Action', 'Footers'],
    contact: ['Hero Sections', 'Trust Badges', 'Call to Action', 'FAQ & Accordions'],
};

// Maps page type → Shopify template file
const PAGE_TYPE_TEMPLATES = {
    home: 'templates/index.json',
    product: 'templates/product.json',
    collection: 'templates/collection.json',
    blog: 'templates/blog.json',
    cart: 'templates/cart.json',
    about: 'templates/page.json',
    contact: 'templates/page.contact.json',
};

async function getActiveTheme(admin, session) {
    const res = await admin.graphql(`{ themes(first:1, roles:[MAIN]) { nodes { id name } } }`);
    const data = await res.json();
    const theme = data.data?.themes?.nodes?.[0];
    if (!theme) throw new Error("No active theme found");
    return { id: theme.id.split('/').pop(), name: theme.name };
}

async function readTemplate(session, themeId, templateKey) {
    const url = `https://${session.shop}/admin/api/2025-01/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(templateKey)}`;
    const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': session.accessToken } });
    if (!res.ok) return null;
    const data = await res.json();
    try { return JSON.parse(data.asset.value); } catch { return null; }
}

async function writeTemplate(session, themeId, templateKey, content) {
    const url = `https://${session.shop}/admin/api/2025-01/themes/${themeId}/assets.json`;
    const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': session.accessToken },
        body: JSON.stringify({ asset: { key: templateKey, value: JSON.stringify(content, null, 2) } })
    });
    if (!res.ok) throw new Error(`Failed: ${await res.text()}`);
    return true;
}

async function writeLiquid(session, themeId, key, liquidCode) {
    const url = `https://${session.shop}/admin/api/2025-01/themes/${themeId}/assets.json`;
    const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': session.accessToken },
        body: JSON.stringify({ asset: { key, value: liquidCode } })
    });
    if (!res.ok) throw new Error(`Failed to write liquid: ${await res.text()}`);
    return true;
}

// ═══ LOADER ═══
export const loader = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const url = new URL(request.url);
    const pageType = url.searchParams.get('pageType') || 'home';

    const categories = PAGE_TYPE_CATEGORIES[pageType] || PAGE_TYPE_CATEGORIES.home;
    const allSections = await db.sections.getAll();

    // Group by category, filter to relevant ones
    const byCategory = {};
    for (const cat of categories) {
        byCategory[cat] = allSections.filter(s => s.category === cat);
    }

    // Also fetch top 20 sections for "full page templates" (composites of top sections per category)
    const topSections = allSections
        .filter(s => categories.includes(s.category))
        .sort((a, b) => (b.conversion_score || 0) - (a.conversion_score || 0));

    return json({ pageType, byCategory, categories, topSections, allSections });
};

// ═══ ACTION ═══
export const action = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const intent = formData.get('_action');

    try {
        const theme = await getActiveTheme(admin, session);

        // ─── Replace entire page ───
        if (intent === 'replace_page') {
            const pageType = formData.get('pageType') || 'home';
            const sectionIdsJson = formData.get('sectionIds'); // JSON array of CF section IDs
            const sectionIds = JSON.parse(sectionIdsJson);
            const templateKey = PAGE_TYPE_TEMPLATES[pageType] || 'templates/index.json';

            const sections = {};
            const order = [];

            for (const id of sectionIds) {
                const sec = await db.sections.getById(id);
                if (!sec) continue;

                // Write liquid file
                const sectionKey = `cf-${sec.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}-v${sec.id}`;
                const liquidCode = [
                    `{% comment %} ConvertFlow AI - ${sec.name} {% endcomment %}`,
                    sec.html_code,
                    `{% schema %}`,
                    JSON.stringify({ name: sec.name, settings: [], presets: [{ name: sec.name }] }, null, 2),
                    `{% endschema %}`
                ].join('\n');

                await writeLiquid(session, theme.id, `sections/${sectionKey}.liquid`, liquidCode);
                sections[sectionKey] = { type: sectionKey, settings: {} };
                order.push(sectionKey);
            }

            const templateContent = { sections, order };
            await writeTemplate(session, theme.id, templateKey, templateContent);
            return json({ success: true, message: `${pageType} page replaced with ${sectionIds.length} premium sections!` });
        }

        // ─── Inject custom Liquid ───
        if (intent === 'inject_custom') {
            const liquidCode = formData.get('liquidCode');
            const sectionName = formData.get('sectionName') || 'custom-section';
            const pageType = formData.get('pageType') || 'home';
            const position = formData.get('position') || 'end';
            const templateKey = PAGE_TYPE_TEMPLATES[pageType] || 'templates/index.json';

            if (!liquidCode?.trim()) {
                return json({ success: false, error: 'Liquid code cannot be empty' });
            }

            // Create a slug name
            const slug = sectionName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
            const uniqueKey = `cf-custom-${slug}-${Date.now().toString(36)}`;

            // Build full liquid file
            const fullLiquid = liquidCode.includes('{% schema %}')
                ? liquidCode
                : [
                    liquidCode,
                    `{% schema %}`,
                    JSON.stringify({ name: sectionName, settings: [], presets: [{ name: sectionName }] }, null, 2),
                    `{% endschema %}`
                ].join('\n');

            await writeLiquid(session, theme.id, `sections/${uniqueKey}.liquid`, fullLiquid);

            // Add to template JSON
            let templateContent = await readTemplate(session, theme.id, templateKey);
            if (!templateContent || !templateContent.sections) {
                templateContent = { sections: {}, order: [] };
            }

            templateContent.sections[uniqueKey] = { type: uniqueKey, settings: {} };
            if (!templateContent.order) templateContent.order = [];
            if (position === 'start') templateContent.order.unshift(uniqueKey);
            else templateContent.order.push(uniqueKey);

            await writeTemplate(session, theme.id, templateKey, templateContent);
            return json({ success: true, message: `Custom section "${sectionName}" injected successfully!` });
        }

        return json({ success: false, error: 'Unknown action' });
    } catch (error) {
        console.error('[PageBuilder Action]', error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
};
