import { redirect } from "@remix-run/node";
import { useRouteError } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  // Redirect to the Theme Editor — the new primary experience
  await authenticate.admin(request);
  return redirect("/app/theme-editor");
};

export default function Index() {
  // Server-side redirect handles navigation — this is a safe fallback
  return (
    <div style={{ padding: "40px", textAlign: "center", fontFamily: "Inter, sans-serif" }}>
      <p>Redirecting to Theme Editor...</p>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <div style={{ padding: "32px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", margin: "16px", fontFamily: "Inter, sans-serif" }}>
      <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#b91c1c", marginBottom: "12px" }}>Something went wrong</h1>
      <p style={{ color: "#dc2626", marginBottom: "8px" }}>{error?.message || "Unknown error"}</p>
      <p style={{ fontSize: "14px", color: "#6b7280" }}>Please try refreshing the page.</p>
    </div>
  );
}
