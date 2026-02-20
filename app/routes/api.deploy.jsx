import { json } from "@remix-run/node";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const loader = async ({ request }) => {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (key !== "convertflow123") {
        return json({ error: "Unauthorized" }, { status: 401 });
    }

    const action = url.searchParams.get("action") || "status";

    try {
        if (action === "pull") {
            // Git pull latest code
            const { stdout, stderr } = await execAsync("git pull origin main", {
                cwd: process.cwd(),
                timeout: 30000,
            });
            return json({
                message: "Git pull complete",
                stdout: stdout.trim(),
                stderr: stderr.trim(),
            });
        }

        if (action === "build") {
            // Run npm build (this will take a while)
            const { stdout, stderr } = await execAsync("npm run build", {
                cwd: process.cwd(),
                timeout: 120000, // 2 minute timeout
                env: { ...process.env, NODE_ENV: "production" },
            });
            return json({
                message: "Build complete! Restart PM2 to apply changes.",
                stdout: stdout.trim().substring(0, 500),
            });
        }

        if (action === "restart") {
            // Restart PM2 process
            const { stdout } = await execAsync("pm2 restart convertflow-ai", {
                cwd: process.cwd(),
                timeout: 15000,
            });
            return json({
                message: "PM2 restarted!",
                stdout: stdout.trim(),
            });
        }

        if (action === "deploy") {
            // Full deploy: pull + build + restart
            const results = [];

            const pull = await execAsync("git pull origin main", {
                cwd: process.cwd(),
                timeout: 30000,
            });
            results.push({ step: "pull", output: pull.stdout.trim() });

            const build = await execAsync("npm run build", {
                cwd: process.cwd(),
                timeout: 120000,
                env: { ...process.env, NODE_ENV: "production" },
            });
            results.push({ step: "build", output: build.stdout.trim().substring(0, 300) });

            // Restart PM2 (this will kill the current process, response may not complete)
            try {
                await execAsync("pm2 restart convertflow-ai", {
                    cwd: process.cwd(),
                    timeout: 10000,
                });
                results.push({ step: "restart", output: "PM2 restarted" });
            } catch (e) {
                results.push({ step: "restart", output: "Restart triggered (process may have been killed)" });
            }

            return json({
                message: "Full deploy complete!",
                results,
            });
        }

        // Default: status
        const { stdout: gitLog } = await execAsync("git log --oneline -3", {
            cwd: process.cwd(),
            timeout: 5000,
        });

        return json({
            message: "Deploy API ready",
            cwd: process.cwd(),
            latestCommits: gitLog.trim(),
            actions: ["pull", "build", "restart", "deploy"],
        });

    } catch (error) {
        return json({
            error: error.message,
            stderr: error.stderr?.substring(0, 500),
        }, { status: 500 });
    }
};
