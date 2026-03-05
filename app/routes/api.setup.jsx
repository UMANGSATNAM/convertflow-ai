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
import { productPageSections } from "../sections/product-page-sections";
import { collectionSections } from "../sections/collection-sections";

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
            console.log("[Seed] Running MASSIVE Database Seeding - 200 Premium Sections...");

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
                    { category: "Product Page", data: productPageSections },
                    { category: "Collection Pages", data: collectionSections },
                ];

                let totalInserted = 0;
                let errors = [];

                // 3. Insert with parameterized queries (safe for HTML/CSS with special chars)
                for (const { category, data } of categoryMap) {
                    console.log(`  [Seed] Inserting ${data.length} sections for "${category}"...`);

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
                            console.error(`  [Error] Failed to insert "${section.name}":`, err.message);
                            errors.push({ name: section.name, category, error: err.message });
                        }
                    }
                }

                // 4. Seed 50 Niche Themes
                console.log("[Seed] Checking/Inserting 50 Niche Themes...");
                const resultThemes = await conn.query("SELECT COUNT(*) as count FROM themes");
                const themeCount = resultThemes.rows[0]?.count || 0;
                let themesInserted = 0;

                if (themeCount === 0) {
                    const niches = [
                        { cat: 'Fitness', names: ['Fitness Apparel', 'Yoga & Meditation', 'Gym Equipment'] },
                        { cat: 'Beauty', names: ['Beauty & Skincare', 'Cosmetics & Makeup', 'Organic Skincare', 'Haircare Experts'] },
                        { cat: 'Pets', names: ['Pets & Dogs', 'Cat Accessories', 'Premium Pet Food'] },
                        { cat: 'Tech', names: ['Tech Gadgets', 'Smart Home Devices', 'Audiophile & Headphones', 'Mobile Accessories'] },
                        { cat: 'Fashion', names: ['Mens Streetwear', 'Womens Fashion', 'High-End Swimwear', 'Winter Coats', 'Luxury Bags'] },
                        { cat: 'Accessories', names: ['Jewelry Showcase', 'Watches & Timepieces', 'Designer Sunglasses'] },
                        { cat: 'Home', names: ['Home Decor', 'Furniture & Interior', 'Kitchenware & Utensils', 'Bedding & Linens'] },
                        { cat: 'Health', names: ['Fitness Supplements', 'Vitamins & Nutrition', 'Vegan & Plant-Based', 'Pharmacy & First Aid'] },
                        { cat: 'Food', names: ['Coffee Rituals', 'Tea Blends', 'Gourmet Snacks', 'Craft Chocolate'] },
                        { cat: 'Kids', names: ['Baby Clothes', 'Educational Toys', 'Maternity Care'] },
                        { cat: 'Outdoors', names: ['Outdoor Survival Gear', 'Camping & Hiking', 'Cycling Accessories'] },
                        { cat: 'Automotive', names: ['Auto Parts', 'Car Detail & Care'] },
                        { cat: 'Hobbies', names: ['Books & Stationary', 'Art & Canvas Prints', 'Handmade Crafts', 'Musical Instruments'] },
                        { cat: 'Sports', names: ['Skater & Surf Shop', 'Golf Pro Shop'] },
                        { cat: 'Gaming', names: ['E-Sports & Gaming', 'Board Games & Puzzles'] },
                        { cat: 'Misc', names: ['Eco-Friendly Products', 'Subscription Boxes', 'Trending Dropshipping'] }
                    ];

                    let themeInserts = [];
                    for (const nicheGroup of niches) {
                        for (const name of nicheGroup.names) {
                            const primary = ['#ec4899', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)];
                            const bg = ['#ffffff', '#0a0a0a', '#f8fafc', '#fffbeb'][Math.floor(Math.random() * 4)];
                            const text = bg === '#0a0a0a' ? '#ffffff' : '#0f172a';
                            const fontH = ['Inter', 'Playfair Display', 'Montserrat', 'Poppins'][Math.floor(Math.random() * 4)];
                            const fontB = ['Inter', 'Lato', 'Open Sans', 'Roboto'][Math.floor(Math.random() * 4)];

                            themeInserts.push(`('${name}', '${nicheGroup.cat}', 'Premium highly-converting theme specifically optimized for ${name}.', '${primary}', '#3b82f6', '${bg}', '${text}', '${fontH}', '${fontB}', '[]')`);
                        }
                    }

                    const themeQuery = `
                        INSERT INTO themes (name, niche_category, description, color_primary, color_secondary, color_background, color_text, font_heading, font_body, recommended_sections)
                        VALUES ${themeInserts.join(',\n')}
                    `;
                    await conn.query(themeQuery);
                    themesInserted = 50;
                    console.log("  [Seed] Inserted 50 Themes.");
                }

                conn.release();

                return json({
                    message: `SEED COMPLETE! ${totalInserted} Premium Sections Added across ${categoryMap.length} categories.`,
                    count: totalInserted,
                    themes: themesInserted,
                    errors: errors.length > 0 ? errors : undefined,
                    categories: categoryMap.map(c => ({ name: c.category, count: c.data.length })),
                });
            } catch (err) {
                conn.release();
                console.error("[Error] Seed failed:", err);
                return json({ error: "Seed failed: " + err.message }, { status: 500 });
            }
        }

        // --- UNLOCK LOGIC (Dev) ---
        if (action === "unlock") {
            const result = await db.query("UPDATE shops SET subscription_status = 'active'");
            return json({ message: "Unlocked Premium Features!", shopsUpdated: result.rowCount || 1 });
        }

        // --- SETUP LOGIC (Default) ---
        console.log("[Setup] Running Emergency Database Setup...");

        // 1. Create tables if they don't exist
        const tables = [
            `CREATE TABLE IF NOT EXISTS Session (
                id VARCHAR(255) PRIMARY KEY,
                shop VARCHAR(255) NOT NULL,
                state VARCHAR(255) NOT NULL,
                isOnline BOOLEAN DEFAULT false,
                scope VARCHAR(1024),
                expires DATETIME,
                accessToken VARCHAR(1024) NOT NULL,
                userId BIGINT,
                firstName VARCHAR(255),
                lastName VARCHAR(255),
                email VARCHAR(255),
                accountOwner BOOLEAN DEFAULT false,
                locale VARCHAR(50),
                collaborator BOOLEAN DEFAULT false,
                emailVerified BOOLEAN DEFAULT false,
                refreshToken VARCHAR(1024),
                refreshTokenExpires DATETIME,
                INDEX idx_session_shop (shop)
            ) ENGINE=InnoDB;`,
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
            ) ENGINE=InnoDB;`,
            `CREATE TABLE IF NOT EXISTS themes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                niche_category VARCHAR(100),
                description TEXT,
                color_primary VARCHAR(20),
                color_secondary VARCHAR(20),
                color_background VARCHAR(20),
                color_text VARCHAR(20),
                font_heading VARCHAR(100),
                font_body VARCHAR(100),
                recommended_sections JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;`,
            `CREATE TABLE IF NOT EXISTS leads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shop_domain VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                source VARCHAR(50) DEFAULT 'spin_wheel',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_lead (shop_domain, email)
            ) ENGINE=InnoDB;`
        ];

        for (const q of tables) await db.query(q);

        // 2. Perform Schema Migrations (add columns if missing)
        try {
            // Add html_code if missing
            await db.query(`
                SELECT html_code FROM sections LIMIT 1;
            `).catch(async () => {
                console.log("[Warn] Column html_code missing. Adding it...");
                await db.query("ALTER TABLE sections ADD COLUMN html_code LONGTEXT;");
            });

            // Add conversion_score if missing
            await db.query(`
                SELECT conversion_score FROM sections LIMIT 1;
            `).catch(async () => {
                console.log("[Warn] Column conversion_score missing. Adding it...");
                await db.query("ALTER TABLE sections ADD COLUMN conversion_score INT DEFAULT 85;");
                await db.query("CREATE INDEX idx_sections_score ON sections(conversion_score);");
            });

            console.log("[OK] Schema migration checks complete.");
        } catch (e) {
            console.error("[Warn] Migration warning (safe to ignore if columns exist):", e.message);
        }

        const res = await db.query("SHOW TABLES");
        return json({ message: "Setup Success! Tables created. Use &action=seed to populate 200 premium sections.", tables: res.rows });

    } catch (error) {
        console.error("[Error] Setup/Seed Error:", error);
        return json({ error: error.message, stack: error.stack }, { status: 500 });
    }
};
