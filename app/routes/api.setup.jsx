import { json } from "@remix-run/node";
import db from "../db.server";

// Import all 200 premium section modules
import { heroSections } from "../sections/hero-sections";
import { announcementSections } from "../sections/announcement-sections";
import { testimonialSections } from "../sections/testimonial-sections";
import { ctaSections } from "../sections/cta-sections";
import { featureSections } from "../sections/feature-sections";
import { trustSections } from "../sections/trust-sections";
import { headerSections } from "../sections/header-sections";
import { productSections } from "../sections/product-sections";
import { statsSections } from "../sections/stats-sections";
import { footerSections } from "../sections/footer-sections";

export const loader = async ({ request }) => {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    const action = url.searchParams.get("action"); // 'setup', 'seed', 'unlock'

    if (key !== "convertflow123") {
        return json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // --- SEEDING LOGIC ---
        if (action === "seed") {
            console.log("🌱 Running MASSIVE Database Seeding — 200 Premium Sections...");

            // 1. Clear existing sections
            await db.query("DELETE FROM sections");

            // 2. Map category names to section arrays
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
            ];

            let totalInserted = 0;

            // 3. Insert in batches per category
            for (const { category, data } of categoryMap) {
                console.log(`  📦 Inserting ${data.length} sections for "${category}"...`);

                for (const section of data) {
                    const safeName = section.name.replace(/'/g, "''");
                    const safeHtml = section.html_code.replace(/'/g, "''");
                    const score = section.conversion_score || 85;
                    const variation = section.variation;

                    // Build a simple schema_json for compatibility
                    const schemaJson = JSON.stringify({
                        name: section.name,
                        category: category,
                        conversion_score: score
                    }).replace(/'/g, "''");

                    await db.query(`
                        INSERT INTO sections 
                        (name, category, variation_number, liquid_code, schema_json, preview_image, is_premium, conversion_score, html_code)
                        VALUES 
                        ('${safeName}', '${category}', ${variation}, '', '${schemaJson}', null, true, ${score}, '${safeHtml}')
                    `);
                    totalInserted++;
                }
            }

            return json({
                message: `🎉 SEED COMPLETE! ${totalInserted} Premium Sections Added across ${categoryMap.length} categories.`,
                count: totalInserted,
                categories: categoryMap.map(c => ({ name: c.category, count: c.data.length }))
            });
        }

        // --- UNLOCK LOGIC (Dev) ---
        if (action === "unlock") {
            const result = await db.query("UPDATE shops SET subscription_status = 'active'");
            return json({ message: "Unlocked Premium Features!", shopsUpdated: result.rowCount || 1 });
        }

        // --- SETUP LOGIC (Default) ---
        console.log("🛠️ Running Emergency Database Setup...");
        const tables = [
            `CREATE TABLE IF NOT EXISTS shops (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shop_domain VARCHAR(255) UNIQUE NOT NULL,
                access_token TEXT,
                subscription_status VARCHAR(50) DEFAULT 'inactive',
                subscription_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_shops_domain (shop_domain)
            ) ENGINE=InnoDB;`,
            `CREATE TABLE IF NOT EXISTS sections (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                variation_number INT NOT NULL,
                liquid_code TEXT,
                html_code LONGTEXT,
                conversion_score INT DEFAULT 85,
                schema_json JSON,
                preview_image VARCHAR(500),
                is_premium BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_variation (category, variation_number),
                INDEX idx_sections_category (category),
                INDEX idx_sections_score (conversion_score)
            ) ENGINE=InnoDB;`,
            `CREATE TABLE IF NOT EXISTS customizations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shop_id INT,
                section_id INT,
                custom_settings JSON,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
                FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
                INDEX idx_customizations_shop (shop_id)
            ) ENGINE=InnoDB;`,
            `CREATE TABLE IF NOT EXISTS subscription_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shop_id INT,
                event_type VARCHAR(50) NOT NULL,
                subscription_id VARCHAR(255),
                amount DECIMAL(10, 2),
                currency VARCHAR(10),
                event_data JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
                INDEX idx_subscription_history_shop (shop_id)
            ) ENGINE=InnoDB;`
        ];

        for (const q of tables) await db.query(q);
        const res = await db.query("SHOW TABLES");
        return json({ message: "Setup Success! Tables created. Use &action=seed to populate 200 premium sections.", tables: res.rows });

    } catch (error) {
        console.error("❌ Setup/Seed Error:", error);
        return json({ error: error.message, stack: error.stack }, { status: 500 });
    }
};
