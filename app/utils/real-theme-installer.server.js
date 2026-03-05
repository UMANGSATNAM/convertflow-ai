/**
 * Real Shopify Theme Installer — ConvertFlow AI
 * Installs actual working Liquid sections with real product fetching
 */
import { cfAnnouncement } from '../sections/liquid/cf-announcement.js';
import { cfHero } from '../sections/liquid/cf-hero.js';
import { cfFeaturedCollection } from '../sections/liquid/cf-featured-collection.js';
import { cfTrustBadges } from '../sections/liquid/cf-trust-badges.js';
import { cfTestimonials } from '../sections/liquid/cf-testimonials.js';
import { cfRichText, cfNewsletter } from '../sections/liquid/cf-rich-text.js';
import { cfImageWithText, cfFaq, cfFooterCta } from '../sections/liquid/cf-image-with-text.js';

// Map section keys to their liquid templates
const LIQUID_TEMPLATES = {
    'cf-announcement': cfAnnouncement,
    'cf-hero': cfHero,
    'cf-featured-collection': cfFeaturedCollection,
    'cf-trust-badges': cfTrustBadges,
    'cf-testimonials': cfTestimonials,
    'cf-rich-text': cfRichText,
    'cf-newsletter': cfNewsletter,
    'cf-image-with-text': cfImageWithText,
    'cf-faq': cfFaq,
    'cf-footer-cta': cfFooterCta,
};

/**
 * Get the active Shopify theme ID and shop info
 */
async function getActiveTheme(admin, session) {
    const res = await admin.graphql(
        `#graphql
    query { themes(first: 1, roles: [MAIN]) { nodes { id name } } }`
    );
    const data = await res.json();
    const theme = data.data?.themes?.nodes?.[0];
    if (!theme) return null;
    return {
        id: theme.id.split('/').pop(),
        name: theme.name,
        shop: session.shop,
        token: session.accessToken,
    };
}

/**
 * Upload a single liquid section file to the Shopify theme
 */
async function uploadSection(theme, sectionKey, liquidCode) {
    const url = `https://${theme.shop}/admin/api/2025-01/themes/${theme.id}/assets.json`;
    const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': theme.token },
        body: JSON.stringify({ asset: { key: `sections/cf-${sectionKey}.liquid`, value: liquidCode } }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to upload ${sectionKey}: ${err}`);
    }
    return `sections/cf-${sectionKey}.liquid`;
}

/**
 * Build the index.json structure with theme section settings
 */
function buildIndexJson(sectionOrder, sectionDefaults = {}) {
    const sections = {};
    const order = [];

    for (const key of sectionOrder) {
        const blockId = `cf_${key.replace(/-/g, '_')}`;
        const settings = sectionDefaults[key] || {};
        sections[blockId] = {
            type: `cf-${key}`,
            settings: settings,
            ...(key === 'cf-trust-badges' ? {
                blocks: {
                    'shipping': { type: 'trust_item', settings: { title: 'Free Shipping', description: 'On all orders over $50' } },
                    'secure': { type: 'trust_item', settings: { title: 'Secure Checkout', description: '256-bit SSL encryption' } },
                    'returns': { type: 'trust_item', settings: { title: 'Easy Returns', description: '30-day hassle-free returns' } },
                    'support': { type: 'trust_item', settings: { title: '24/7 Support', description: 'We are here to help you' } },
                },
                block_order: ['shipping', 'secure', 'returns', 'support']
            } : {}),
            ...(key === 'cf-testimonials' ? {
                blocks: {
                    'r1': { type: 'review', settings: { review_text: 'Absolutely love this product! Best purchase this year.', author_name: 'Sarah M.', author_meta: 'Verified Buyer', verified: true } },
                    'r2': { type: 'review', settings: { review_text: 'Incredible quality. Ordered 3 times already!', author_name: 'Marcus T.', author_meta: 'Verified Buyer', verified: true } },
                    'r3': { type: 'review', settings: { review_text: 'Fast shipping, beautiful packaging. Love it!', author_name: 'Priya S.', author_meta: 'Verified Buyer', verified: true } },
                },
                block_order: ['r1', 'r2', 'r3']
            } : {}),
            ...(key === 'cf-faq' ? {
                blocks: {
                    'q1': { type: 'faq_item', settings: { question: 'What is your return policy?', answer: '<p>We offer a full 30-day return policy. No questions asked.</p>' } },
                    'q2': { type: 'faq_item', settings: { question: 'How long does shipping take?', answer: '<p>Standard 3-5 business days. Express available at checkout.</p>' } },
                    'q3': { type: 'faq_item', settings: { question: 'Do you ship internationally?', answer: '<p>Yes! We ship to 50+ countries. Costs calculated at checkout.</p>' } },
                },
                block_order: ['q1', 'q2', 'q3']
            } : {}),
        };
        order.push(blockId);
    }

    return { sections, order };
}

/**
 * Install a full real theme from a theme config object
 */
export async function installRealTheme(admin, session, themeConfig) {
    try {
        const theme = await getActiveTheme(admin, session);
        if (!theme) return { success: false, error: 'No active theme found. Please publish a theme in Shopify first.' };

        const { section_order = Object.keys(LIQUID_TEMPLATES), section_defaults = {} } = themeConfig;

        // Step 1: Upload all liquid section files concurrently
        const uploadPromises = section_order.map(async (key) => {
            const liquid = LIQUID_TEMPLATES[key];
            if (!liquid) return;
            await uploadSection(theme, key, liquid);
        });
        await Promise.all(uploadPromises);

        // Step 2: Build and upload templates/index.json
        const indexJson = buildIndexJson(section_order, section_defaults);
        const indexUrl = `https://${theme.shop}/admin/api/2025-01/themes/${theme.id}/assets.json`;
        const indexRes = await fetch(indexUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': theme.token },
            body: JSON.stringify({ asset: { key: 'templates/index.json', value: JSON.stringify(indexJson, null, 2) } }),
        });
        if (!indexRes.ok) {
            throw new Error('Failed to update templates/index.json: ' + await indexRes.text());
        }

        return {
            success: true,
            themeName: theme.name,
            sectionsInstalled: section_order.length,
            message: `✅ "${themeConfig.name}" theme installed on "${theme.name}"! ${section_order.length} real Liquid sections uploaded.`
        };
    } catch (error) {
        console.error('Real theme install error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Reorder sections in the active theme (for drag & drop editor)
 */
export async function reorderThemeSections(admin, session, newOrder) {
    try {
        const theme = await getActiveTheme(admin, session);
        if (!theme) return { success: false, error: 'No active theme.' };

        // Fetch current index.json
        const getRes = await fetch(
            `https://${theme.shop}/admin/api/2025-01/themes/${theme.id}/assets.json?asset[key]=templates/index.json`,
            { headers: { 'X-Shopify-Access-Token': theme.token } }
        );
        const getData = await getRes.json();
        let indexJson = { sections: {}, order: [] };
        if (getData.asset?.value) {
            try { indexJson = JSON.parse(getData.asset.value); } catch (e) { }
        }

        // Apply the new order (only for CF sections)
        const cfOrder = newOrder.map(key => `cf_${key.replace(/-/g, '_')}`);
        const nonCfSections = indexJson.order.filter(id => !id.startsWith('cf_'));

        indexJson.order = [...cfOrder, ...nonCfSections];

        // Push back
        const putRes = await fetch(`https://${theme.shop}/admin/api/2025-01/themes/${theme.id}/assets.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': theme.token },
            body: JSON.stringify({ asset: { key: 'templates/index.json', value: JSON.stringify(indexJson, null, 2) } }),
        });
        if (!putRes.ok) throw new Error('Failed to save new order');

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Update a single section's settings in the active theme
 */
export async function updateSectionSettings(admin, session, sectionKey, settings) {
    try {
        const theme = await getActiveTheme(admin, session);
        if (!theme) return { success: false, error: 'No active theme.' };

        const getRes = await fetch(
            `https://${theme.shop}/admin/api/2025-01/themes/${theme.id}/assets.json?asset[key]=templates/index.json`,
            { headers: { 'X-Shopify-Access-Token': theme.token } }
        );
        const getData = await getRes.json();
        let indexJson = { sections: {}, order: [] };
        if (getData.asset?.value) {
            try { indexJson = JSON.parse(getData.asset.value); } catch (e) { }
        }

        const blockId = `cf_${sectionKey.replace(/-/g, '_')}`;
        if (indexJson.sections[blockId]) {
            indexJson.sections[blockId].settings = {
                ...indexJson.sections[blockId].settings,
                ...settings
            };
        }

        const putRes = await fetch(`https://${theme.shop}/admin/api/2025-01/themes/${theme.id}/assets.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': theme.token },
            body: JSON.stringify({ asset: { key: 'templates/index.json', value: JSON.stringify(indexJson, null, 2) } }),
        });
        if (!putRes.ok) throw new Error('Failed to update settings');

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Get what CF sections are currently installed on the active theme
 */
export async function getInstalledSections(admin, session) {
    try {
        const theme = await getActiveTheme(admin, session);
        if (!theme) return { success: false, error: 'No active theme.' };

        const getRes = await fetch(
            `https://${theme.shop}/admin/api/2025-01/themes/${theme.id}/assets.json?asset[key]=templates/index.json`,
            { headers: { 'X-Shopify-Access-Token': theme.token } }
        );
        const getData = await getRes.json();
        let indexJson = { sections: {}, order: [] };
        if (getData.asset?.value) {
            try { indexJson = JSON.parse(getData.asset.value); } catch (e) { }
        }

        const cfSections = indexJson.order
            .filter(id => id.startsWith('cf_'))
            .map(id => {
                const key = id.replace(/^cf_/, '').replace(/_/g, '-');
                return {
                    id,
                    key,
                    label: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    settings: indexJson.sections[id]?.settings || {},
                };
            });

        return {
            success: true,
            themeName: theme.name,
            themeId: theme.id,
            shop: theme.shop,
            sections: cfSections,
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
