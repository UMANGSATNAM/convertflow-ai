/**
 * Catch-all "splat" route.
 * Silently absorbs rogue requests like "/&" that come from
 * Shopify's embedded auth redirects. Returns an empty 200
 * so nothing is logged to the console.
 */
export const loader = async () => {
    return new Response("", { status: 200 });
};

export default function CatchAll() {
    return null;
}
