import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from build/client
app.use(express.static(path.join(__dirname, "build/client"), {
    maxAge: "1h",
}));

// Handle all requests with Remix
async function startServer() {
    try {
        const { createRequestHandler } = await import("@remix-run/express");
        const buildModule = await import("./build/server/index.js");

        console.log("[Remix] Build module keys:", Object.keys(buildModule));
        console.log("[Remix] Has routes:", !!buildModule.routes);
        console.log("[Remix] Has entry:", !!buildModule.entry);
        console.log("[Remix] Has assets:", !!buildModule.assets);

        // Convert module namespace to plain object for Remix compatibility
        const build = Object.assign({}, buildModule);

        app.all("*", createRequestHandler({ build }));

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`ConvertFlow AI running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start Remix server:", err);

        app.all("*", (req, res) => {
            res.status(500).send("<h1>Server Error</h1><pre>" + err.message + "</pre>");
        });

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Fallback server on port ${PORT} - Remix failed to load`);
        });
    }
}

startServer();
