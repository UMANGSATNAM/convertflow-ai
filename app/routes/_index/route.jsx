import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    // Shopify provides shop param — redirect to auth flow
    throw redirect(`/auth?${url.searchParams.toString()}`);
  }

  // For custom distribution, always redirect to the app
  // Shopify admin will always provide the shop parameter
  throw redirect("/app");
};

export default function Index() {
  return (
    <div style={{ padding: "40px", textAlign: "center", fontFamily: "Inter, sans-serif" }}>
      <p>Redirecting to ConvertFlow AI...</p>
    </div>
  );
}
