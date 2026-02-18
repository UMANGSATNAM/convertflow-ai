import { json } from "@remix-run/node";
import db from "../db.server";

export const loader = async ({ request }) => {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (key !== "convertflow123") {
        return json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
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
            message: "Setup Success! Tables created.",
            tables: result.rows,
            env: {
                host: process.env.DB_HOST ? "msg" : "from-url",
                user: process.env.DB_USER ? "msg" : "from-url"
            }
        });

    } catch (error) {
        console.error("❌ Setup Error:", error);
        return json({
            error: error.message,
            stack: error.stack,
            detail: "Database connection failed"
        }, { status: 500 });
    }
};
