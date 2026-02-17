import { authenticate } from "../shopify.server";
import db from "../db.server";

export const SUBSCRIPTION_PLAN = {
    name: "ConvertFlow AI Premium",
    price: 20.00,
    currencyCode: "USD",
    interval: "EVERY_30_DAYS",
};

/**
 * Create a recurring subscription for a shop
 */
export async function createSubscription(admin, shop) {
    const response = await admin.graphql(
        `#graphql
      mutation AppSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!) {
        appSubscriptionCreate(
          name: $name
          returnUrl: $returnUrl
          lineItems: $lineItems
        ) {
          appSubscription {
            id
            status
          }
          confirmationUrl
          userErrors {
            field
            message
          }
        }
      }`,
        {
            variables: {
                name: SUBSCRIPTION_PLAN.name,
                returnUrl: `${process.env.SHOPIFY_APP_URL}/api/billing/callback`,
                lineItems: [
                    {
                        plan: {
                            appRecurringPricingDetails: {
                                price: { amount: SUBSCRIPTION_PLAN.price, currencyCode: SUBSCRIPTION_PLAN.currencyCode },
                                interval: SUBSCRIPTION_PLAN.interval,
                            },
                        },
                    },
                ],
            },
        }
    );

    const result = await response.json();
    const { appSubscription, confirmationUrl, userErrors } = result.data.appSubscriptionCreate;

    if (userErrors.length > 0) {
        throw new Error(`Subscription creation failed: ${userErrors[0].message}`);
    }

    // Save subscription to database
    const shopRecord = await db.shops.findByDomain(shop);
    if (shopRecord) {
        await db.shops.updateSubscription(shopRecord.id, 'pending', appSubscription.id);

        // Log subscription event
        await db.query(
            'INSERT INTO subscription_history (shop_id, event_type, subscription_id, amount, currency, event_data) VALUES ($1, $2, $3, $4, $5, $6)',
            [shopRecord.id, 'subscription_created', appSubscription.id, SUBSCRIPTION_PLAN.price, SUBSCRIPTION_PLAN.currencyCode, JSON.stringify(appSubscription)]
        );
    }

    return { confirmationUrl, subscriptionId: appSubscription.id };
}

/**
 * Check if shop has an active subscription
 */
export async function hasActiveSubscription(shop) {
    const shopRecord = await db.shops.findByDomain(shop);
    return shopRecord && shopRecord.subscription_status === 'active';
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(admin, shop) {
    const shopRecord = await db.shops.findByDomain(shop);

    if (!shopRecord || !shopRecord.subscription_id) {
        throw new Error('No active subscription found');
    }

    const response = await admin.graphql(
        `#graphql
      mutation AppSubscriptionCancel($id: ID!) {
        appSubscriptionCancel(id: $id) {
          appSubscription {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }`,
        {
            variables: {
                id: shopRecord.subscription_id,
            },
        }
    );

    const result = await response.json();
    const { appSubscription, userErrors } = result.data.appSubscriptionCancel;

    if (userErrors.length > 0) {
        throw new Error(`Subscription cancellation failed: ${userErrors[0].message}`);
    }

    // Update database
    await db.shops.updateSubscription(shopRecord.id, 'cancelled', null);

    // Log cancellation
    await db.query(
        'INSERT INTO subscription_history (shop_id, event_type, subscription_id, event_data) VALUES ($1, $2, $3, $4)',
        [shopRecord.id, 'subscription_cancelled', shopRecord.subscription_id, JSON.stringify(appSubscription)]
    );

    return appSubscription;
}

/**
 * Handle billing webhook/callback
 */
export async function handleSubscriptionUpdate(subscriptionId, status, shop) {
    const shopRecord = await db.shops.findByDomain(shop);

    if (!shopRecord) {
        throw new Error('Shop not found');
    }

    await db.shops.updateSubscription(shopRecord.id, status.toLowerCase(), subscriptionId);

    // Log status change
    await db.query(
        'INSERT INTO subscription_history (shop_id, event_type, subscription_id, event_data) VALUES ($1, $2, $3, $4)',
        [shopRecord.id, 'subscription_updated', subscriptionId, JSON.stringify({ status })]
    );
}

export default {
    createSubscription,
    hasActiveSubscription,
    cancelSubscription,
    handleSubscriptionUpdate,
    SUBSCRIPTION_PLAN,
};
