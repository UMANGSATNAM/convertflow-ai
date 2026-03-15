import { authenticate } from "../shopify.server";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Initialize Anthropic client using environment variable
// (Ensure ANTHROPIC_API_KEY is defined in .env)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "", // Defaults to process.env.ANTHROPIC_API_KEY
});

/**
 * Fetches the active (or specified) theme ID for the current shop.
 */
export async function getThemes(request) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.rest.resources.Theme.all({ session: admin.session });
  return response.data;
}

/**
 * Fetches all assets (section files) for a specific theme.
 */
export async function getThemeAssets(request, themeId) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.rest.resources.Asset.all({
    session: admin.session,
    theme_id: themeId,
  });
  return response.data;
}

/**
 * Reads a single asset (file) from a specific theme.
 */
export async function getThemeAsset(request, themeId, assetKey) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.rest.resources.Asset.all({
    session: admin.session,
    theme_id: themeId,
    asset: { key: assetKey },
  });
  // Note: The Shopify Admin API returns the asset object as the first item when specifying a key in the `all` method
  // Actually, standard REST `GET /admin/api/2024-01/themes/{theme_id}/assets.json?asset[key]={assetKey}`
  return response.data[0]; 
}

/**
 * Pushes updated code to a theme asset.
 */
export async function updateThemeAsset(request, themeId, assetKey, value) {
  const { admin } = await authenticate.admin(request);
  const asset = new admin.rest.resources.Asset({ session: admin.session });
  asset.theme_id = themeId;
  asset.key = assetKey;
  asset.value = value;
  await asset.save({ update: true });
  return asset;
}

/**
 * Interacts with Claude to process the raw file into Liquid, CSS, Schema, and Combined outputs.
 */
export async function extractWithClaude(rawCode, sectionName) {
  const systemPrompt = `You are a Shopify Liquid expert. Clean raw Liquid + CSS into production-ready Shopify section code. Rules: (1) hardcoded text -> schema type text/richtext, (2) images -> image_picker with image_url filter format: webp + width, (3) colors -> schema type color, (4) CSS namespaced under .cf-{name}__ BEM, (5) CSS includes breakpoints at 768px and 480px, (6) schema has name, class, full settings array with id/type/label/default, (7) use render not include, (8) passes theme-check zero errors.
  
Output labeled sections EXACTLY like this (use these exact delimiters):
[LIQUID]
<liquid code>
[/LIQUID]
[CSS]
<css code>
[/CSS]
[SCHEMA]
<schema code>
[/SCHEMA]
[COMBINED]
<combined liquid file containing all of the above>
[/COMBINED]

No explanation. Code only.`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620", // using sonnet 3.5 instead of the prompt's missing model string
    max_tokens: 4000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Convert this code into a production ready section called ${sectionName}:\n\n${rawCode}`,
      },
    ],
  });

  const fullText = response.content[0].text;
  
  // Basic parsing
  const liquidCode = fullText.match(/\[LIQUID\]([\s\S]*?)\[\/LIQUID\]/i)?.[1]?.trim() || "";
  const cssCode = fullText.match(/\[CSS\]([\s\S]*?)\[\/CSS\]/i)?.[1]?.trim() || "";
  const schemaCode = fullText.match(/\[SCHEMA\]([\s\S]*?)\[\/SCHEMA\]/i)?.[1]?.trim() || "";
  const combinedCode = fullText.match(/\[COMBINED\]([\s\S]*?)\[\/COMBINED\]/i)?.[1]?.trim() || "";

  return { liquidCode, cssCode, schemaCode, combinedCode, fullText };
}

/**
 * Runs theme-check on the provided liquid file content.
 */
export async function runThemeCheck(code) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "theme-check-"));
  const tmpFile = path.join(tmpDir, "section.liquid");
  
  try {
    await fs.writeFile(tmpFile, code, "utf-8");
    
    // We run the local binary from node_modules if possible, or npx.
    // Ensure we cd to tmpDir so theme-check runs there.
    // NOTE: If using the Node API for theme-check, it is better, but CLI is specified.
    const { stdout, stderr } = await execAsync(`npx theme-check "${tmpFile}" --output json`, { cwd: tmpDir });
    
    let result = { pass: true, errors: [], warnings: [] };
    
    // theme-check CLI outputs JSON if told
    if (stdout.trim().startsWith("[")) {
      const issues = JSON.parse(stdout);
      
      issues.forEach((issue) => {
        if (issue.severity === 1) result.errors.push(issue); // Error
        if (issue.severity === 2) result.warnings.push(issue); // Warning
      });
      
      if (result.errors.length > 0) {
        result.pass = false;
      }
    }
    
    return result;
  } catch (error) {
    // If it literally crashes or exits non-zero (theme-check returns non-zero if there are errors)
    // We still want to parse stdout if possible.
    let result = { pass: false, errors: [], warnings: [] };
    if (error.stdout && error.stdout.trim().startsWith("[")) {
      try {
        const issues = JSON.parse(error.stdout);
        issues.forEach((issue) => {
          if (issue.severity === 1) result.errors.push(issue);
          if (issue.severity === 2) result.warnings.push(issue);
        });
      } catch (e) {
        result.errors.push({ message: error.message });
      }
    } else {
      result.errors.push({ message: error.message || "theme-check failed to run" });
    }
    return result;
  } finally {
    // Clean up temp dir
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch(e) {}
  }
}
