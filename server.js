import { createRequestHandler } from "@remix-run/express";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function start() {
    const app = express();
    const PORT = process.env.PORT || 3000;

    // Serve static files from build/client
    app.use(express.static(path.join(__dirname, "build/client"), {
        maxAge: "1h",
    }));

    // Handle all requests with Remix
    const build = await import("./build/server/index.js");
    app.all("*", createRequestHandler({ build }));

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`ConvertFlow AI running on port ${PORT}`);
    });
}

start().catch((err) => {
    console.error("Server failed to start:", err);
    process.exit(1);
});
