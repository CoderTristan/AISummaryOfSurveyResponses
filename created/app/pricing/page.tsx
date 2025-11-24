import Pricing from "@/components/Pricing";
import { auth } from "@clerk/nextjs/server";
import { redis } from "@/lib/redis";
import { stripe } from "@/lib/stripe";

export default async function PricingPage() {
  const { userId } = await auth();
  if (!userId) throw new Error("Missing userId");

  const customerId = await redis.get<string>(`user:${userId}:customer`);

  // Get subscription from Redis or default free
  const subscriptionRaw = customerId ? await redis.get(`customer:${customerId}:subscription`) : null;
  const subscription = subscriptionRaw ? JSON.parse(subscriptionRaw as string) : { plan: "free", status: "active" };

  // Determine current plan
  let currentPlan = subscription.plan || "free";

  // Fetch Stripe prices for paid plans only
  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
  });

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
