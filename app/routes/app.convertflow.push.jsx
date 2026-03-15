import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { updateThemeAsset, getThemeAsset } from "../services/convertflow.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const themeId = formData.get("themeId");
  const assetKey = formData.get("assetKey");
  const code = formData.get("code");

  if (!themeId || !assetKey || !code) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const shop = await db.shop.findUnique({ where: { shop_domain: session.shop }});
    
    if (shop) {
      // Create backup from current live file if it exists, fulfilling spec requirement
      try {
        const existingAsset = await getThemeAsset(request, themeId, assetKey);
        if (existingAsset?.value) {
          const backupLibraryItem = await db.libraryItem.create({
            data: {
              shopId: shop.id,
              name: `BACKUP-${assetKey.replace("sections/","").replace(".liquid","")}-${new Date().toISOString()}`,
              liquidCode: existingAsset.value,
              cssCode: "",
              schemaCode: "",
            }
          });
          
          await db.pushHistory.create({
            data: {
              shopId: shop.id,
              libraryItemId: backupLibraryItem.id,
              targetThemeId: themeId,
              targetThemeName: "Pending lookup",
              status: "BACKUP_CREATED",
              backupLiquid: existingAsset.value
            }
          });
        }
      } catch (e) {
        console.log("Could not create backup prior to push:", e.message);
      }
    }

    // Push new code to Shopify
    await updateThemeAsset(request, themeId, assetKey, code);

    return json({ success: true });
  } catch (error) {
    console.error("Push error:", error);
    return json({ error: error.message }, { status: 500 });
  }
};
