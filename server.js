import { createRequestHandler } from "@remix-run/express";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from build/client
app.use(express.static(path.join(__dirname, "build/client"), {
    maxAge: "1h",
}));

// Handle all requests with Remix
try {
    const build = await import("./build/server/index.js");
    app.all("*", createRequestHandler({ build }));
} catch (err) {
    console.error("Failed to load Remix build:", err);
    app.all("*", (req, res) => {
        res.status(500).send("Server starting up... please try again in a moment.");
    });
}

app.listen(PORT, "0.0.0.0", () => {
    console.log(`ConvertFlow AI server running on port ${PORT}`);
});
