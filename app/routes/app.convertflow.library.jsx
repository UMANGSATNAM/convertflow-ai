import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Page, Layout, Card, Text, BlockStack, DataTable, Button, InlineStack, Badge } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = await db.shop.findUnique({ where: { shop_domain: session.shop }});
  
  if (!shop) return json({ items: [] });
  
  const items = await db.libraryItem.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" }
  });
  
  return json({ items });
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const name = formData.get("name");
  const liquidCode = formData.get("liquidCode");
  const cssCode = formData.get("cssCode");
  const schemaCode = formData.get("schemaCode");
  
  try {
    const shop = await db.shop.findUnique({ where: { shop_domain: session.shop }});
    
    if (shop) {
      await db.libraryItem.create({
        data: {
          shopId: shop.id,
          name: name || "Saved Component",
          liquidCode: liquidCode || "",
          cssCode: cssCode || "",
          schemaCode: schemaCode || "",
        }
      });
      return json({ success: true });
    }
  } catch(e) {
    return json({ error: e.message }, { status: 500 });
  }
  return json({ error: "Shop not found" }, { status: 404 });
};

export default function Library() {
  const { items } = useLoaderData();
  const fetcher = useFetcher();
  
  const rows = items.map(item => [
    <Text fontWeight="bold">{item.name}</Text>,
    <Badge>{item.usageCount.toString()} uses</Badge>,
    new Date(item.createdAt).toLocaleDateString(),
    <InlineStack gap="200" key={item.id}>
      <Button size="micro" url={`/app/convertflow/library/${item.id}`}>View</Button>
      {item.shareToken ? (
        <Button size="micro" url={`/convertflow/share/${item.shareToken}`} target="_blank">Share Link</Button>
      ) : (
        <Button size="micro" disabled>Share</Button>
      )}
    </InlineStack>
  ]);

  return (
    <Page title="ConvertFlow - My Library">
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {items.length > 0 ? (
              <DataTable
                columnContentTypes={["text", "text", "text", "text"]}
                headings={["Name", "Usage", "Created At", "Actions"]}
                rows={rows}
              />
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Text>No items in your library yet. Save extractions to see them here.</Text>
              </div>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
