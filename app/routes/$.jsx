import { json } from "@remix-run/node";

/**
 * Catch-all "splat" route.
 * Handles rogue requests like "/&" that come from Shopify's embedded
 * auth redirects or malformed query strings.  Instead of crashing with
 * "No route matches URL", we return a silent 404.
 */
export const loader = async ({ request }) => {
    const url = new URL(request.url);
    console.warn(`[Splat Route] Caught unmatched URL: ${url.pathname}`);
    // Return a 404 silently so the app doesn't crash
    throw new Response("Not Found", { status: 404 });
};

export default function CatchAll() {
    return null;
}
