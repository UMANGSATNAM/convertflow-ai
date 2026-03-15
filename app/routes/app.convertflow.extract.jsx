import { json } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import {
  getThemeAsset,
  extractWithClaude,
  runThemeCheck,
} from "../../services/convertflow.server";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const themeId = formData.get("themeId");
  const assetKey = formData.get("assetKey");
  const sectionName = formData.get("sectionName") || (assetKey && typeof assetKey === 'string' ? assetKey.replace("sections/", "").replace(".liquid", "") : "extracted-section");

  if (!themeId || !assetKey) {
    return json({ error: "Missing themeId or assetKey" }, { status: 400 });
  }

  try {
    // 1. Fetch file from Shopify
    const asset = await getThemeAsset(request, themeId, assetKey);
    const rawCode = asset?.value || asset?.public_url;

    if (!rawCode && !asset?.value) {
      return json({ error: "Could not read file contents" }, { status: 404 });
    }

    // 2. Claude API -> Process Code
    const extracted = await extractWithClaude(asset.value || rawCode, sectionName);

    // 3. Theme Checker Validation
    let checkResult = { pass: true, errors: [], warnings: [] };
    if (extracted.combinedCode) {
      checkResult = await runThemeCheck(extracted.combinedCode);
    } else {
      checkResult.pass = false;
      checkResult.errors.push({ message: "Claude did not return valid [COMBINED] liquid code." });
    }

    return json({
      success: true,
      extracted,
      checkResult
    });

  } catch (error) {
    console.error("Extraction error:", error);
    return json({ error: error.message }, { status: 500 });
  }
};
