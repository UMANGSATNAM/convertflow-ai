import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
    console.log("👉 Setup Loader Hit:", request.url);
    await authenticate.admin(request);

    try {
        console.log("🛠️ Running Database Setup (MySQL)...");

        // 1. Create shops table
        const createShops = `
            CREATE TABLE IF NOT EXISTS shops (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shop_domain VARCHAR(255) UNIQUE NOT NULL,
                access_token TEXT,
                subscription_status VARCHAR(50) DEFAULT 'inactive',
                subscription_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_shops_domain (shop_domain)
            ) ENGINE=InnoDB;
        `;
        await db.query(createShops);

        // 2. Create sections table
        const createSections = `
            CREATE TABLE IF NOT EXISTS sections (
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
            ) ENGINE=InnoDB;
        `;
        await db.query(createSections);

        // 3. Create customizations table
        const createCustomizations = `
            CREATE TABLE IF NOT EXISTS customizations (
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
            ) ENGINE=InnoDB;
        `;
        await db.query(createCustomizations);

        // 4. Create subscription_history table
        const createSubscriptionHistory = `
            CREATE TABLE IF NOT EXISTS subscription_history (
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
            ) ENGINE=InnoDB;
        `;
        await db.query(createSubscriptionHistory);

        return json({ message: "Database tables created successfully!" });
    } catch (error) {
        console.error("❌ Setup Error:", error);
        return json({ error: error.message, stack: error.stack }, { status: 500 });
    }
};

export default function Setup() {
    const data = useLoaderData();
    const navigate = useNavigate();

    return (
        <div style={{ padding: "40px", textAlign: "center", fontFamily: "system-ui" }}>
            <h1>Database Setup</h1>
            {data.error ? (
                <div style={{ color: "red", padding: "20px", background: "#fee", borderRadius: "8px", textAlign: "left" }}>
                    <h2>Error Creating Tables</h2>
                    <p><strong>Message:</strong> {data.error}</p>
                    <pre style={{ overflow: "auto", maxHeight: "200px" }}>{data.stack}</pre>
                </div>
            ) : (
                <div style={{ color: "green", padding: "20px", background: "#efe", borderRadius: "8px" }}>
                    <h2>{data.message}</h2>
                    <p>All tables have been initialized.</p>
                </div>
            )}
            <br />
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button
                    onClick={() => navigate("/app/seed")}
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
                    Go to Seeding
                </button>
                <button
                    onClick={() => navigate("/app")}
                    style={{
                        padding: "10px 20px",
                        background: "#eee",
                        color: "#333",
                        border: "1px solid #ccc",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "16px"
                    }}
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
}
