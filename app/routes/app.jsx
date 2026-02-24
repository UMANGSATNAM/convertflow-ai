import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  console.log("[App] Loader Hit:", request.url);
  try {
    await authenticate.admin(request);
    console.log("[App] Authenticate Admin Success");
  } catch (error) {
    console.error("[App] Authenticate Admin Error:", error);
    throw error;
  }

  const apiKey = process.env.SHOPIFY_API_KEY || "";
  console.log("[App] API Key in Loader:", apiKey ? apiKey.substring(0, 10) + "..." : "MISSING");

  if (!apiKey) {
    return { apiKey: "", error: "SHOPIFY_API_KEY is missing in server environment" };
  }

  return { apiKey };
};

export default function App() {
  const { apiKey, error } = useLoaderData();

  if (error || !apiKey) {
    return (
      <div style={{ padding: "20px", fontFamily: "system-ui" }}>
        <h1>Configuration Error</h1>
        <p style={{ color: "red", fontWeight: "bold" }}>{error || "SHOPIFY_API_KEY is missing"}</p>
        <p>Please check your .env file on Hostinger and ensure SHOPIFY_API_KEY is set.</p>
        <pre>{JSON.stringify({ apiKey }, null, 2)}</pre>
      </div>
    );
  }

  return (
    <AppProvider isEmbeddedApp={false} apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/theme-editor">Theme Editor</Link>
        <Link to="/app/dashboard">Sections Library</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
