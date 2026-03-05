import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { batchInstallStoreBuilder } from "../utils/theme-integration.server";
import db from "../db.server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const action = async ({ request }) => {
    try {
        const { session, admin } = await authenticate.admin(request);
        const formData = await request.formData();

        const actionType = formData.get("_action");
        if (actionType !== "generate_store") {
            return json({ success: false, message: "Invalid action" });
        }

        const productName = formData.get("productName") || "Our Product";
        const niche = formData.get("niche") || "retail";
        const audience = formData.get("audience") || "everyone";
        const tone = formData.get("tone") || "professional";

        // 1. Fetch available sections
        const allSections = await db.sections.getAll();

        // 2. Select optimal layout architecture
        // We will pick 8 high-converting sections to build a massive premium homepage
        const categories = [
            "Headers",
            "Hero Sections",
            "Trust Indicators",
            "Features & Benefits",
            "Products",
            "Social Proof",
            "FAQ & Accordions",
            "Call to Action",
            "Footers"
        ];

        const selectedSections = [];

        for (const cat of categories) {
            const matches = allSections
                .filter(s => s.category.includes(cat) || cat.includes(s.category))
                .sort((a, b) => b.conversion_score - a.conversion_score);

            if (matches.length > 0) {
                // Pick the absolute best performing section for the target category
                // For Hero/Features, we try to match the niche if possible (our DB seed might have niche specific variations)
                let bestMatch = matches[0];
                const nicheMatches = matches.filter(s => s.name.toLowerCase().includes(niche.toLowerCase()));
                if (nicheMatches.length > 0) {
                    bestMatch = nicheMatches[0];
                }

                // Deep clone the object so we can modify its HTML
                selectedSections.push(JSON.parse(JSON.stringify(bestMatch)));
            }
        }

        if (selectedSections.length === 0) {
            return json({ success: false, message: "Library empty. Please seed the database first." });
        }

        // 3. Generate AI Copy
        let storeData = generateFallbackCopy(productName, niche, audience, tone);

        // Attempt real Gemini AI generation if API key exists
        if (process.env.GEMINI_API_KEY) {
            try {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

                const prompt = `
                    You are an expert Direct-to-Consumer (DTC) copywriter.
                    Write conversion-optimized website copy for a new Shopify store.
                    Product/Brand Name: ${productName}
                    Niche: ${niche}
                    Target Audience: ${audience}
                    Brand Tone: ${tone}

                    Return ONLY a perfectly formatted JSON object with the following keys exactly:
                    "hero_headline": (Catchy, bold 1-liner),
                    "hero_sub": (Persuasive 2-sentence subheadline),
                    "feature_1_title": (punchy benefit),
                    "feature_1_desc": (short description),
                    "feature_2_title": (punchy benefit),
                    "feature_2_desc": (short description),
                    "feature_3_title": (punchy benefit),
                    "feature_3_desc": (short description),
                    "social_proof_headline": (e.g. Loved by 10,000+ Millennials),
                    "cta_headline": (Urgency driven headline),
                    "cta_button": (Action verb button text)
                `;

                const result = await model.generateContent(prompt);
                const responseText = result.response.text();
                // Extract json from markdown block if present
                const jsonStr = responseText.replace(/```json\\n?|```/g, '').trim();
                const aiData = JSON.parse(jsonStr);

                storeData = { ...storeData, ...aiData };
                console.log("[AI-Builder] Successfully used Gemini to generate copy.");
            } catch (err) {
                console.error("[AI-Builder] Gemini generation failed, using fallback.", err);
            }
        }

        // 4. Inject Copy into HTML safely
        // We use regex to replace generic placeholder text with our AI generated specifics.
        // We target typical H1, H2, and P tags in the hero, features, etc.

        for (const sec of selectedSections) {
            if (sec.category.includes("Hero")) {
                sec.html_code = injectSafeHtml(sec.html_code, [
                    { selector: /<h1[^>]*>(.*?)<\/h1>/i, replacement: storeData.hero_headline },
                    { selector: /<p[^>]*class="[^"]*text-xl[^"]*"[^>]*>(.*?)<\/p>/i, replacement: storeData.hero_sub } // target prominent P tags
                ]);
            }
            if (sec.category.includes("Features")) {
                // Replace instances of generic titles
                sec.html_code = sec.html_code
                    .replace("Premium Quality", storeData.feature_1_title)
                    .replace("Fast Shipping", storeData.feature_2_title)
                    .replace("24/7 Support", storeData.feature_3_title);
            }
            if (sec.category.includes("Social")) {
                sec.html_code = injectSafeHtml(sec.html_code, [
                    { selector: /<h2[^>]*>(.*?)<\/h2>/i, replacement: storeData.social_proof_headline }
                ]);
            }
            if (sec.category.includes("Call to Action")) {
                sec.html_code = injectSafeHtml(sec.html_code, [
                    { selector: /<h2[^>]*>(.*?)<\/h2>/i, replacement: storeData.cta_headline },
                    { selector: /<button[^>]*>(.*?)<\/button>/i, replacement: storeData.cta_button }
                ]);
            }

            // Global text replace for brand name wrapping
            sec.html_code = sec.html_code.replace(/ConvertFlow|Your Brand/g, productName);
        }

        // 5. Install to Active Theme
        const installResult = await batchInstallStoreBuilder(admin, session, selectedSections);

        if (installResult.success) {
            return json({
                success: true,
                message: `Successfully architected 1-Click AI Store for ${productName} with ${selectedSections.length} automated premium layouts.`
            });
        } else {
            return json({ success: false, message: installResult.error || "Batch installation failed." });
        }

    } catch (error) {
        console.error("API / AI Builder error:", error);
        return json({ success: false, message: error.message || "An unexpected error occurred." });
    }
};

/**
 * Safely replaces inner html of targeted tags without breaking HTML string structure (basic regex implementation)
 */
function injectSafeHtml(html, replacementRules) {
    let newHtml = html;
    for (const rule of replacementRules) {
        newHtml = newHtml.replace(rule.selector, (match, innerText) => {
            return match.replace(innerText, rule.replacement);
        });
    }
    return newHtml;
}

/**
 * Smart Niche Fallback Copy
 */
function generateFallbackCopy(product, niche, audience, tone) {
    let focus = "game-changing results";
    if (tone.includes("Luxury")) focus = "uncompromising quality and elegance";
    if (tone.includes("Playful")) focus = "pure joy and excitement";

    return {
        hero_headline: `The Ultimate ${product} for ${audience}.`,
        hero_sub: `Experience ${focus}. Designed specifically to elevate your lifestyle and deliver exactly what you've been looking for in the ${niche} space.`,
        feature_1_title: `Engineered for ${audience}`,
        feature_1_desc: `Perfectly crafted keeping your exact needs in mind.`,
        feature_2_title: `Unmatched ${niche} Performance`,
        feature_2_desc: `Using cutting-edge technology to give you the best experience possible.`,
        feature_3_title: `100% Satisfaction Guarantee`,
        feature_3_desc: `If you don't love it, we'll make it right. No questions asked.`,
        social_proof_headline: `Join 10,000+ Happy ${audience}`,
        cta_headline: `Ready to upgrade your ${niche} experience?`,
        cta_button: `Get Your ${product} Today`
    };
}
