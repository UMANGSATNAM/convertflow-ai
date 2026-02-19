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
import { productGridSections } from "../sections/product-grid-sections";

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

            // 1. Clear existing sections (use raw pool query for DDL)
            const conn = await db.getClient();
            try {
                await conn.query("DELETE FROM customizations");
                await conn.query("DELETE FROM sections");

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
                    { category: "Product Grid", data: productGridSections },
                ];

                let totalInserted = 0;
                let errors = [];

                // 3. Insert with parameterized queries (safe for HTML/CSS with special chars)
                for (const { category, data } of categoryMap) {
                    console.log(`  📦 Inserting ${data.length} sections for "${category}"...`);

                    for (const section of data) {
                        try {
                            const schemaJson = JSON.stringify({
                                name: section.name,
                                category: category,
                                conversion_score: section.conversion_score || 85,
                            });

                            await conn.query(
                                `INSERT INTO sections 
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
                            console.error(`  ❌ Failed to insert "${section.name}":`, err.message);
                            errors.push({ name: section.name, category, error: err.message });
                        }
                    }
                }

                conn.release();

                return json({
                    message: `🎉 SEED COMPLETE! ${totalInserted} Premium Sections Added across ${categoryMap.length} categories.`,
                    count: totalInserted,
                    errors: errors.length > 0 ? errors : undefined,
                    categories: categoryMap.map(c => ({ name: c.category, count: c.data.length })),
                });
            } catch (err) {
                conn.release();
                console.error("❌ Seed failed:", err);
                return json({ error: "Seed failed: " + err.message }, { status: 500 });
            }
        }

        // --- UNLOCK LOGIC (Dev) ---
        if (action === "unlock") {
            const result = await db.query("UPDATE shops SET subscription_status = 'active'");
            return json({ message: "Unlocked Premium Features!", shopsUpdated: result.rowCount || 1 });
        }

        // --- SETUP LOGIC (Default) ---
        console.log("🛠️ Running Emergency Database Setup...");

        // 1. Create tables if they don't exist
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

        // 2. Perform Schema Migrations (add columns if missing)
        try {
            // Add html_code if missing
            await db.query(`
                SELECT html_code FROM sections LIMIT 1;
            `).catch(async () => {
                console.log("⚠️ Column html_code missing. Adding it...");
                await db.query("ALTER TABLE sections ADD COLUMN html_code LONGTEXT;");
            });

            // Add conversion_score if missing
            await db.query(`
                SELECT conversion_score FROM sections LIMIT 1;
            `).catch(async () => {
                console.log("⚠️ Column conversion_score missing. Adding it...");
                await db.query("ALTER TABLE sections ADD COLUMN conversion_score INT DEFAULT 85;");
                await db.query("CREATE INDEX idx_sections_score ON sections(conversion_score);");
            });

            console.log("✅ Schema migration checks complete.");
        } catch (e) {
            console.error("⚠️ Migration warning (safe to ignore if columns exist):", e.message);
        }

        const res = await db.query("SHOW TABLES");
        return json({ message: "Setup Success! Tables created. Use &action=seed to populate 200 premium sections.", tables: res.rows });

    } catch (error) {
        console.error("❌ Setup/Seed Error:", error);
        return json({ error: error.message, stack: error.stack }, { status: 500 });
    }
};
