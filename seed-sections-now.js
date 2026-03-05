import db from "./app/db.server.js";
import { heroSections } from "./app/sections/hero-sections.js";
import { announcementSections } from "./app/sections/announcement-sections.js";
import { testimonialSections } from "./app/sections/testimonial-sections.js";
import { ctaSections } from "./app/sections/cta-sections.js";
import { featureSections } from "./app/sections/feature-sections.js";
import { trustSections } from "./app/sections/trust-sections.js";
import { headerSections } from "./app/sections/header-sections.js";
import { productSections } from "./app/sections/product-sections.js";
import { statsSections } from "./app/sections/stats-sections.js";
import { footerSections } from "./app/sections/footer-sections.js";
import { productGridSections } from "./app/sections/product-grid-sections.js";
import { productPageSections } from "./app/sections/product-page-sections.js";
import { collectionSections } from "./app/sections/collection-sections.js";

async function runSeed() {
    console.log("[Seed] Running MASSIVE Database Seeding - 200 Premium Sections...");
    try {
        const categoryMap = [
            { category: "Hero Sections", data: heroSections },
            { category: "Announcement Bars", data: announcementSections },
            { category: "Testimonials", data: testimonialSections },
            { category: "CTA Sections", data: ctaSections },
            { category: "Feature Sections", data: featureSections },
            { category: "Trust Badges", data: trustSections },
            { category: "Headers & Navigation", data: headerSections },
            { category: "Product Highlights", data: productSections },
            { category: "Stats & Metrics", data: statsSections },
            { category: "Footer Sections", data: footerSections },
            { category: "Product Grid", data: productGridSections },
            { category: "Product Page", data: productPageSections },
            { category: "Collection Pages", data: collectionSections },
        ];

        let totalInserted = 0;

        for (const { category, data } of categoryMap) {
            console.log(`  [Seed] Inserting ${data.length} sections for "${category}"...`);

            for (const section of data) {
                try {
                    const schemaJson = JSON.stringify({
                        name: section.name,
                        category: category,
                        conversion_score: section.conversion_score || 85,
                    });

                    await db.query(`
                        INSERT IGNORE INTO sections 
                        (name, category, variation_number, liquid_code, schema_json, preview_image, is_premium, conversion_score, html_code)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            section.name,
                            category,
                            section.variation,
                            '',
                            schemaJson,
                            null,
                            true,
                            section.conversion_score || 85,
                            section.html_code || '',
                        ]
                    );
                    totalInserted++;
                } catch (err) {
                    console.error(`  [Error] Failed to insert "${section.name}":`, err.message);
                }
            }
        }
        console.log(`SEED COMPLETE! ${totalInserted} Premium Sections Added.`);
        process.exit(0);
    } catch (err) {
        console.error("Seed failed:", err);
        process.exit(1);
    }
}

runSeed();
