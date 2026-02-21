import { json } from "@remix-run/node";
import { db } from "../db.server";

export const loader = async ({ request }) => {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (key !== "convertflow123") {
        return json({ error: "Unauthorized" }, { status: 401 });
    }

    const diagnostics = {
        timestamp: new Date().toISOString(),
        env: {
            SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ? process.env.SHOPIFY_API_KEY.substring(0, 10) + "..." : "MISSING",
            SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? "SET (" + process.env.SHOPIFY_API_SECRET.length + " chars)" : "MISSING",
            SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || "MISSING",
            SCOPES: process.env.SCOPES || "MISSING",
            DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
            DB_HOST: process.env.DB_HOST || "MISSING",
            DB_NAME: process.env.DB_NAME || "MISSING",
            DB_USER: process.env.DB_USER || "MISSING",
            NODE_ENV: process.env.NODE_ENV || "MISSING",
            PORT: process.env.PORT || "MISSING",
        },
        database: null,
        prisma: null,
        sessionTable: null,
        error: null,
    };

    // Test raw MySQL connection
    try {
        const result = await db.query("SELECT 1 as test");
        diagnostics.database = "Connected OK";
    } catch (err) {
        diagnostics.database = "FAILED: " + err.message;
    }

    // Test Prisma connection
    try {
        const { PrismaClient } = await import("@prisma/client");
        const prisma = new PrismaClient();
        await prisma.$connect();
        diagnostics.prisma = "Connected OK";

        // Check Session table via Prisma
        try {
            const sessions = await prisma.session.findMany({ take: 5 });
            diagnostics.sessionTable = {
                status: "OK",
                count: sessions.length,
                sessions: sessions.map(s => ({
                    id: s.id,
                    shop: s.shop,
                    isOnline: s.isOnline,
                    hasAccessToken: !!s.accessToken,
                    expires: s.expires,
                })),
            };
        } catch (err) {
            diagnostics.sessionTable = "FAILED: " + err.message;
        }

        await prisma.$disconnect();
    } catch (err) {
        diagnostics.prisma = "FAILED: " + err.message;
    }

    return json(diagnostics, {
        headers: { "Content-Type": "application/json" },
    });
};
