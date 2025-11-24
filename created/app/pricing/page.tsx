import Pricing from "@/components/Pricing";
import { auth } from "@clerk/nextjs/server";
import { redis } from "@/lib/redis";
import { stripe } from "@/lib/stripe";

export default async function PricingPage() {
  const { userId } = await auth();

  // Fetch all Stripe prices (used by both logged-in AND logged-out users)
  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
  });

  const plans = prices.data
    .map((p) => {
      const product =
        typeof p.product !== "string" && !p.product.deleted
          ? p.product
          : null;

      return {
        priceId: p.id,
        name: product ? product.name : "Unavailable Plan",
        price: p.unit_amount ? `$${p.unit_amount / 100}/mo` : "",
        description: product?.description ?? "",
        amount: p.unit_amount ?? 0,
      };
    })
    .sort((a, b) => a.amount - b.amount);

  // =========================================================================
  // LOGGED OUT — User sees pricing, but no free plan is assigned yet
  // =========================================================================
  if (!userId) {
    return <Pricing userId={null} plans={plans} currentPlan="none" />;
  }

  // =========================================================================
  // LOGGED IN — Get user's subscription (from Redis)
  // =========================================================================
  const customerId = await redis.get<string>(`user:${userId}:customer`);
  const subscriptionRaw =
    customerId &&
    (await redis.get(`customer:${customerId}:subscription`));

  let subscription = { plan: "free", status: "active" };

  try {
    if (typeof subscriptionRaw === "string") {
      subscription = JSON.parse(subscriptionRaw);
    }
  } catch {
    console.error("[pricing] Failed to parse subscription from Redis");
  }

  return (
    <Pricing
      userId={userId}
      plans={plans}
      currentPlan={subscription.plan || "free"}
    />
  );
}
