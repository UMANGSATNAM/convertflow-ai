import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  console.log("👉 App Loader Hit:", request.url);
  try {
    await authenticate.admin(request);
    console.log("✅ Authenticate Admin Success");
  } catch (error) {
    console.error("❌ Authenticate Admin Error:", error);
    throw error;
  }

  const apiKey = process.env.SHOPIFY_API_KEY || "";
  console.log("🔑 API Key in Loader:", apiKey ? apiKey.substring(0, 10) + "..." : "MISSING");

  return { apiKey };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
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
