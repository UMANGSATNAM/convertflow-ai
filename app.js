const express = require("express");
const path = require("path");

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
        const build = await import("./build/server/index.js");

        app.all("*", createRequestHandler({ build }));

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`ConvertFlow AI running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start Remix server:", err);

        // Fallback - still serve something
        app.all("*", (req, res) => {
            res.status(500).send("<h1>Server Error</h1><p>Check logs for details.</p><pre>" + err.message + "</pre>");
        });

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Fallback server on port ${PORT} - Remix failed to load`);
        });
    }
}

startServer();
