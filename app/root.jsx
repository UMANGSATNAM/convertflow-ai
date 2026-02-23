import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react";
import globalStyles from "./styles/global.css?url";

export const links = () => [
  { rel: "stylesheet", href: globalStyles },
];

export default function App() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@400;500;600;700&family=Raleway:wght@300;400;500&display=swap" rel="stylesheet" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  return (
    <html>
      <head>
        <title>Oh no!</title>
        <Meta />
        <Links />
      </head>
      <body>
        <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
          <h1 style={{ color: "red" }}>Application Error</h1>
          <p>
            An internal server error occurred. Check server logs for details.
          </p>
          <pre style={{ background: "#f1f1f1", padding: "1rem", borderRadius: "5px" }}>
            {error?.message || "Unknown error"}
          </pre>
          <pre style={{ background: "#f1f1f1", padding: "1rem", borderRadius: "5px" }}>
            {error?.stack}
          </pre>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
