import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export type STRIPE_SUB_CACHE =
  | {
      subscriptionId: string | null;
      status: Stripe.Subscription.Status;
      priceId: string | null;
      productId: string | null;
      cancelAtPeriodEnd: boolean;
      paymentMethod: {
        brand: string | null;
        last4: string | null;
      } | null;
    }
  | { status: "none" };

export async function syncStripeDataToKV(customerId: string) {
  try {
    // ✅ Only expand up to 4 levels: items.data.price, default_payment_method
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: "all",
      expand: ["data.default_payment_method", "data.items.data.price"], // removed `.product`
    });

    if (subscriptions.data.length === 0) {
      const subData: STRIPE_SUB_CACHE = { status: "none" };
      return subData;
    }

    const subscription = subscriptions.data[0];
    const item = subscription.items.data[0];
    let productId: string | null = null;

    // If you need product info, fetch separately
    if (item.price.product && typeof item.price.product === "string") {
      const product = await stripe.products.retrieve(item.price.product);
      productId = product.id;
    }

    const subData: STRIPE_SUB_CACHE = {
      subscriptionId: subscription.id,
      status: subscription.status,
      priceId: item.price.id,
      productId,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      paymentMethod:
        subscription.default_payment_method &&
        typeof subscription.default_payment_method !== "string"
          ? {
              brand: subscription.default_payment_method.card?.brand ?? null,
              last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : null,
    };

    return subData;
  } catch (err) {
    console.error("[syncStripeDataToKV] Error:", err);
    throw err;
  }
}
