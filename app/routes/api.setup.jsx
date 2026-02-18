import { json } from "@remix-run/node";
import db from "../db.server";

export const loader = async ({ request }) => {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    const action = url.searchParams.get("action"); // 'setup' (default) or 'seed'

    if (key !== "convertflow123") {
        return json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // --- SEEDING LOGIC ---
        if (action === "seed") {
            console.log("🌱 Running Emergency Database Seeding...");

            // Check if sections exist
            const result = await db.query("SELECT COUNT(*) as count FROM sections");
            // Handle different mysql2 return formats
            let sectionCount = 0;
            if (result.rows && result.rows[0]) {
                sectionCount = result.rows[0].count || 0;
            }

            if (sectionCount > 0) {
                return json({ message: "Database already seeded!", count: sectionCount });
            }

            // Insert Data
            const heros = `
INSERT INTO sections (name, category, variation_number, liquid_code, schema_json, preview_image, is_premium) VALUES
('Split Hero with Video', 'Hero Sections', 1, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "Premium Hero Section", "description": "Boost your conversions", "buttonText": "Shop Now", "primaryColor": "#667eea", "textColor": "#1a202c", "backgroundColor": "#ffffff", "headingFont": {"family": "Poppins", "weight": 700}, "bodyFont": {"family": "Inter", "weight": 400}, "paddingTop": 80, "paddingBottom": 80, "alignment": "center", "borderRadius": 8}}', null, true),
('Parallax Hero', 'Hero Sections', 2, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "Experience the Difference", "description": "Premium quality, unbeatable prices", "buttonText": "Explore", "primaryColor": "#764ba2", "textColor": "#ffffff", "backgroundColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", "headingFont": {"family": "Montserrat", "weight": 800}, "bodyFont": {"family": "Open Sans", "weight": 400}, "paddingTop": 120, "paddingBottom": 120, "alignment": "center", "borderRadius": 0}}', null, true),
('Minimal Split Hero', 'Hero Sections', 3, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "Bold. Beautiful. Simple.", "description": "Minimalist design meets maximum impact", "buttonText": "Discover", "primaryColor": "#000000", "textColor": "#000000", "backgroundColor": "#f7fafc", "headingFont": {"family": "Playfair Display", "weight": 700}, "bodyFont": {"family": "Lato", "weight": 400}, "paddingTop": 100, "paddingBottom": 100, "alignment": "left", "borderRadius": 4}}', null, true);
            `;

            const announcements = `
INSERT INTO sections (name, category, variation_number, liquid_code, schema_json, preview_image, is_premium) VALUES
('Scrolling Announcement', 'Announcement Bars', 1, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "🎉 Limited Time Offer: 50% OFF Everything!", "backgroundColor": "linear-gradient(90deg, #ff6b6b 0%, #ee5a6f 100%)", "textColor": "#ffffff", "headingFont": {"family": "Inter", "weight": 600}, "paddingTop": 12, "paddingBottom": 12, "alignment": "center"}}', null, true),
('Countdown Timer Bar', 'Announcement Bars', 2, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "Flash Sale Ends In:", "backgroundColor": "#000000", "textColor": "#ffffff", "primaryColor": "#ffd700", "headingFont": {"family": "Roboto", "weight": 700}, "paddingTop": 16, "paddingBottom": 16, "alignment": "center"}}', null, true),
('Multi-Tab Announcement', 'Announcement Bars', 3, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "Free Shipping on Orders $50+ | New Arrivals Weekly", "backgroundColor": "#4facfe", "textColor": "#ffffff", "headingFont": {"family": "Poppins", "weight": 500}, "paddingTop": 10, "paddingBottom": 10, "alignment": "center"}}', null, true);
            `;

            const others = `
INSERT INTO sections (name, category, variation_number, liquid_code, schema_json, preview_image, is_premium) VALUES
('Transparent Header', 'Header & Sticky Navigation', 1, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"backgroundColor": "transparent", "textColor": "#ffffff", "primaryColor": "#667eea", "headingFont": {"family": "Inter", "weight": 600}, "paddingTop": 20, "paddingBottom": 20}}', null, true),
('Mega Menu Header', 'Header & Sticky Navigation', 2, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"backgroundColor": "#ffffff", "textColor": "#1a202c", "primaryColor": "#000000", "headingFont": {"family": "Montserrat", "weight": 600}, "paddingTop": 24, "paddingBottom": 24}}', null, true),
('Trust Badge Grid', 'Product & Info Pages', 1, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "Why Customers Love Us", "backgroundColor": "#f7fafc", "textColor": "#1a202c", "primaryColor": "#48bb78", "headingFont": {"family": "Poppins", "weight": 700}, "bodyFont": {"family": "Inter", "weight": 400}, "paddingTop": 60, "paddingBottom": 60, "alignment": "center"}}', null, true),
('Stock Counter Banner', 'Product & Info Pages', 2, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "Only 5 left in stock!", "description": "Order now before it''s gone", "backgroundColor": "#fff5f5", "textColor": "#c53030", "primaryColor": "#e53e3e", "headingFont": {"family": "Roboto", "weight": 700}, "bodyFont": {"family": "Open Sans", "weight": 400}, "paddingTop": 20, "paddingBottom": 20, "alignment": "center", "borderRadius": 8}}', null, true),
('Cart Timer Popup', 'Urgency Tools', 1, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "⏰ Complete your order in 15:00", "description": "Reserved for you", "backgroundColor": "#fffaf0", "textColor": "#744210", "primaryColor": "#dd6b20", "headingFont": {"family": "Inter", "weight": 700}, "bodyFont": {"family": "Inter", "weight": 400}, "paddingTop": 24, "paddingBottom": 24, "alignment": "center", "borderRadius": 12}}', null, true),
('Bestseller Badge', 'Urgency Tools', 2, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "🔥 BESTSELLER", "backgroundColor": "#fed7d7", "textColor": "#c53030", "primaryColor": "#e53e3e", "headingFont": {"family": "Bebas Neue", "weight": 400}, "paddingTop": 8, "paddingBottom": 8, "alignment": "center", "borderRadius": 4}}', null, true),
('Exit Intent Popup', 'Retention Tools', 1, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "Wait! Don''t Leave Empty Handed", "description": "Get 15% off your first order", "buttonText": "Claim My Discount", "backgroundColor": "#ffffff", "textColor": "#1a202c", "primaryColor": "#667eea", "headingFont": {"family": "Poppins", "weight": 700}, "bodyFont": {"family": "Inter", "weight": 400}, "paddingTop": 40, "paddingBottom": 40, "alignment": "center", "borderRadius": 16}}', null, true),
('Newsletter Signup', 'Retention Tools', 2, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "Join Our VIP List", "description": "Get exclusive deals and early access to new products", "buttonText": "Subscribe", "backgroundColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", "textColor": "#ffffff", "primary Color": "#ffffff", "headingFont": {"family": "Montserrat", "weight": 700}, "bodyFont": {"family": "Raleway", "weight": 400}, "paddingTop": 60, "paddingBottom": 60, "alignment": "center", "borderRadius": 0}}', null, true);
            `;

            await db.query(heros.trim());
            await db.query(announcements.trim());
            await db.query(others.trim());

            return json({ message: "Database seeded successfully!" });
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
                liquid_code TEXT NOT NULL,
                schema_json JSON NOT NULL,
                preview_image VARCHAR(500),
                is_premium BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_variation (category, variation_number),
                INDEX idx_sections_category (category)
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

        for (const query of tables) {
            await db.query(query);
        }

        // Also verify connectivity by selecting
        const result = await db.query("SHOW TABLES");

        return json({
            message: "Setup Success! Tables created. To seed data, add &action=seed to URL.",
            tables: result.rows,
            env: {
                host: process.env.DB_HOST ? "msg" : "from-url",
                user: process.env.DB_USER ? "msg" : "from-url"
            }
        });

    } catch (error) {
        console.error("❌ Setup/Seed Error:", error);
        return json({
            error: error.message,
            stack: error.stack,
            detail: "Database action failed"
        }, { status: 500 });
    }
};
