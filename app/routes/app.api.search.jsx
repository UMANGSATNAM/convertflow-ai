import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
    await authenticate.admin(request);

    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";

    if (query.length < 2) {
        return json({ results: [] });
    }

    const results = await db.sections.search(query);
    return json({ results });
};
