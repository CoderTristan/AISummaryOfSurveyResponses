import Pricing from "@/components/Pricing";
import { auth } from "@clerk/nextjs/server";
import { redis } from "@/lib/redis";
import { stripe } from "@/lib/stripe";

export default async function PricingPage() {
  const { userId } = await auth();
  if (!userId) throw new Error("Missing userId");

  // Get user's subscription from Redis
  const subscriptionRaw = await redis.get(`user:${userId}:subscription`);
  const subscription = subscriptionRaw
    ? typeof subscriptionRaw === "string"
      ? JSON.parse(subscriptionRaw)
      : subscriptionRaw
    : { plan: "free", status: "active", items: { data: [] }, current_period_end: null };

  // Determine current plan
  let currentPlan = subscription.plan || "free";

  // Fetch all active Stripe prices (for paid plans)
  const prices = await stripe.prices.list({ active: true, expand: ["data.product"] });
  const plans = prices.data
    .map((p) => ({
      priceId: p.id,
      name: typeof p.product !== "string" && !p.product.deleted ? p.product.name : "Plan",
      price: p.unit_amount ? `$${p.unit_amount / 100}/mo` : "",
      description: typeof p.product !== "string" && !p.product.deleted ? p.product.description || "" : "",
      amount: p.unit_amount || 0,
    }))
    .sort((a, b) => a.amount - b.amount);

  return <Pricing userId={userId} plans={plans} currentPlan={currentPlan} />;
}
