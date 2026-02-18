import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
    console.log("👉 Seed Loader Hit:", request.url);
    await authenticate.admin(request);

    try {
        // Clear existing sections (optional, but safer for re-seeding)
        // await db.query("DELETE FROM sections");

        // Check if sections exist
        const result = await db.query("SELECT COUNT(*) as count FROM sections");
        const count = result.rows[0].count; // mysql2 returns object like { count: 0 } or row array

        let shouldSeed = true;

        // Handle different return types from raw query
        if (typeof count === 'number' && count > 0) {
            shouldSeed = false;
        } else if (result.rows && result.rows[0] && result.rows[0].count > 0) {
            shouldSeed = false;
        }

        if (!shouldSeed) {
            return json({ message: "Database already seeded!", count });
        }

        console.log("🌱 Seeding database...");

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

        await db.query(heros.trim());
        await db.query(announcements.trim());
        await db.query(others.trim());

        return json({ message: "Database seeded successfully!" });
    } catch (error) {
        console.error("❌ Seed Error:", error);
        return json({ error: error.message }, { status: 500 });
    }
};

export default function Seed() {
    const data = useLoaderData();
    const navigate = useNavigate();

    return (
        <div style={{ padding: "40px", textAlign: "center", fontFamily: "system-ui" }}>
            <h1>Database Seeding</h1>
            {data.error ? (
                <div style={{ color: "red", padding: "20px", background: "#fee", borderRadius: "8px" }}>
                    <h2>Error Seeding Database</h2>
                    <code>{data.error}</code>
                </div>
            ) : (
                <div style={{ color: "green", padding: "20px", background: "#efe", borderRadius: "8px" }}>
                    <h2>{data.message}</h2>
                    <p>Sections have been added to the library.</p>
                </div>
            )}
            <br />
            <button
                onClick={() => navigate("/app")}
                style={{
                    padding: "10px 20px",
                    background: "#0070f3",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "16px"
                }}
            >
                Back to Dashboard
            </button>
        </div>
    );
}
