import { json } from "@remix-run/node";
import db from "../db.server";

export const action = async ({ request }) => {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }

    if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const body = await request.json();
        const { email, source, shop } = body;

        if (!email || !shop) {
            return json({ error: "Missing required fields" }, {
                status: 400,
                headers: { "Access-Control-Allow-Origin": "*" }
            });
        }

        // Ensure table exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS leads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shop_domain VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                source VARCHAR(50) DEFAULT 'spin_wheel',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_lead (shop_domain, email)
            )
        `);

        // Insert lead
        await db.query(`
            INSERT IGNORE INTO leads (shop_domain, email, source)
            VALUES (?, ?, ?)
        `, [shop, email, source || 'spin_wheel']);

        return json({ success: true }, {
            headers: { "Access-Control-Allow-Origin": "*" }
        });
    } catch (error) {
        console.error("Error saving lead:", error);
        return json({ error: "Internal server error" }, {
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" }
        });
    }
};

export const loader = async ({ request }) => {
    return new Response(null, {
        headers: { "Access-Control-Allow-Origin": "*" }
    });
};
