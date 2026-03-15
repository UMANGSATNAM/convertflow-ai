import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { updateThemeAsset } from "../services/convertflow.server";
import db from "../db.server";

export const action = async ({ request, params }) => {
  const { admin, session } = await authenticate.admin(request);
  const id = parseInt(params.id, 10);
  const formData = await request.formData();
  const themeId = formData.get("themeId");
  const assetKey = formData.get("assetKey");

  if (!themeId || !assetKey) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const shop = await db.shop.findUnique({ where: { shop_domain: session.shop } });
    if (!shop) return json({ error: "Shop not found" }, { status: 404 });

    const item = await db.libraryItem.findUnique({ where: { id, shopId: shop.id } });
    if (!item) return json({ error: "Library item not found" }, { status: 404 });
    
    const codeToPush = item.liquidCode; 

    // Push new code to Shopify
    await updateThemeAsset(request, themeId, assetKey, codeToPush);
    
    // Update usage count
    await db.libraryItem.update({
      where: { id },
      data: { usageCount: item.usageCount + 1 }
    });
    
    await db.pushHistory.create({
      data: {
        shopId: shop.id,
        libraryItemId: item.id,
        targetThemeId: themeId,
        targetThemeName: "Pushed by Library",
        status: "SUCCESS"
      }
    });

    return json({ success: true });
  } catch (error) {
    console.error("Library Push error:", error);
    return json({ error: error.message }, { status: 500 });
  }
};
