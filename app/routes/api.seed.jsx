import { json } from "@remix-run/node";
import db from "../db.server";

export const loader = async ({ request }) => {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (key !== "convertflow123") {
        return json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("🌱 Database Seeding via API...");

        // Check if sections & themes exist
        const resultSections = await db.query("SELECT COUNT(*) as count FROM sections");
        const sectionCount = resultSections.rows[0]?.count || 0;

        // Ensure Themes table exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS themes (
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
            )
        `);

        const resultThemes = await db.query("SELECT COUNT(*) as count FROM themes");
        const themeCount = resultThemes.rows[0]?.count || 0;

        if (sectionCount > 0 && themeCount >= 50) {
            return json({ message: "Database already fully seeded!", sections: sectionCount, themes: themeCount });
        }

        console.log("🌱 Inserting initial sections...");

        // Hero Sections
        const heros = `
INSERT INTO sections (name, category, variation_number, liquid_code, schema_json, preview_image, is_premium) VALUES
('Split Hero with Video', 'Hero Sections', 1, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "Premium Hero Section", "description": "Boost your conversions", "buttonText": "Shop Now", "primaryColor": "#667eea", "textColor": "#1a202c", "backgroundColor": "#ffffff", "headingFont": {"family": "Poppins", "weight": 700}, "bodyFont": {"family": "Inter", "weight": 400}, "paddingTop": 80, "paddingBottom": 80, "alignment": "center", "borderRadius": 8}}', null, true),
('Parallax Hero', 'Hero Sections', 2, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "Experience the Difference", "description": "Premium quality, unbeatable prices", "buttonText": "Explore", "primaryColor": "#764ba2", "textColor": "#ffffff", "backgroundColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", "headingFont": {"family": "Montserrat", "weight": 800}, "bodyFont": {"family": "Open Sans", "weight": 400}, "paddingTop": 120, "paddingBottom": 120, "alignment": "center", "borderRadius": 0}}', null, true),
('Minimal Split Hero', 'Hero Sections', 3, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "Bold. Beautiful. Simple.", "description": "Minimalist design meets maximum impact", "buttonText": "Discover", "primaryColor": "#000000", "textColor": "#000000", "backgroundColor": "#f7fafc", "headingFont": {"family": "Playfair Display", "weight": 700}, "bodyFont": {"family": "Lato", "weight": 400}, "paddingTop": 100, "paddingBottom": 100, "alignment": "left", "borderRadius": 4}}', null, true);
        `;

        // Announcement Bars
        const announcements = `
INSERT INTO sections (name, category, variation_number, liquid_code, schema_json, preview_image, is_premium) VALUES
('Scrolling Announcement', 'Announcement Bars', 1, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "🎉 Limited Time Offer: 50% OFF Everything!", "backgroundColor": "linear-gradient(90deg, #ff6b6b 0%, #ee5a6f 100%)", "textColor": "#ffffff", "headingFont": {"family": "Inter", "weight": 600}, "paddingTop": 12, "paddingBottom": 12, "alignment": "center"}}', null, true),
('Countdown Timer Bar', 'Announcement Bars', 2, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "Flash Sale Ends In:", "backgroundColor": "#000000", "textColor": "#ffffff", "primaryColor": "#ffd700", "headingFont": {"family": "Roboto", "weight": 700}, "paddingTop": 16, "paddingBottom": 16, "alignment": "center"}}', null, true),
('Multi-Tab Announcement', 'Announcement Bars', 3, '{% comment %}Liquid code{% endcomment %}', '{"settings": {"heading": "Free Shipping on Orders $50+ | New Arrivals Weekly", "backgroundColor": "#4facfe", "textColor": "#ffffff", "headingFont": {"family": "Poppins", "weight": 500}, "paddingTop": 10, "paddingBottom": 10, "alignment": "center"}}', null, true);
        `;

        // Others
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

        if (sectionCount === 0) {
            await db.query(heros.trim());
            await db.query(announcements.trim());
            await db.query(others.trim());
            console.log("🌱 Inserted initial sections.");
        }

        if (themeCount === 0) {
            console.log("🌱 Inserting 50 Niche Themes...");

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

            // Insert 50 rows in chunks to be safe with MySQL payload sizes
            const themeQuery = `
                INSERT INTO themes (name, niche_category, description, color_primary, color_secondary, color_background, color_text, font_heading, font_body, recommended_sections)
                VALUES ${themeInserts.join(',\n')}
            `;
            await db.query(themeQuery);
            console.log("🌱 Inserted 50 Themes.");
        }

        return json({ message: "Database fully seeded!" });
    } catch (error) {
        console.error("❌ Seed Error:", error);
        return json({ error: error.message, stack: error.stack }, { status: 500 });
    }
};
