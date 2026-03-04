import { json, redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { handleSubscriptionUpdate } from "../utils/billing.server";

/**
 * Billing callback — Shopify redirects here after subscription approval/decline.
 * URL: /api/billing/callback?charge_id=...
 */
export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const url = new URL(request.url);
    const chargeId = url.searchParams.get("charge_id");

    if (!chargeId) {
        console.error("[Billing] No charge_id in callback");
        return redirect("/app/dashboard");
    }

    try {
        console.log("[Billing] Processing callback for charge:", chargeId);

        // Shopify confirms the subscription is active after merchant approves
        await handleSubscriptionUpdate(chargeId, "active", session.shop);

        console.log("[Billing] Subscription activated for", session.shop);
    } catch (error) {
        console.error("[Billing] Error processing callback:", error.message);
        // Don't block — still redirect to dashboard
    }

    return redirect("/app/dashboard");
};
