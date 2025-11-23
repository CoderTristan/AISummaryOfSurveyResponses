import Pricing from "@/components/Pricing";
import { auth } from "@clerk/nextjs/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function PricingPage() {
  const { userId } = await auth();
  if (!userId) throw new Error("Missing userId");

  // 1️⃣ Get customerId from Upstash KV
  const customerId = await redis.get<string>(`UPSTASH:user:${userId}:customer`);

  // 2️⃣ Get subscription snapshot from Upstash KV
  let subscription: any = null;
  if (customerId) {
    const subJson = await redis.get<string>(`UPSTASH:customer:${customerId}:subscription`);
    if (subJson) subscription = JSON.parse(subJson);
  }

  // 3️⃣ Determine current plan
  const currentPlan = subscription?.planId || "free";

  // 4️⃣ Fetch all active Stripe prices
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover",
  });

  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
  });

  // 5️⃣ Map prices for UI
  const plans = prices.data
    .map((p) => {
      let name = "Untitled Plan";
      let description = "";

      if (p.product && typeof p.product !== "string" && !p.product.deleted) {
        name = p.product.name;
        description = p.product.description || "";
      }

      return {
        priceId: p.id,
        name,
        price: p.unit_amount ? `$${p.unit_amount / 100}/mo` : "",
        description,
        isCurrent: name.toLowerCase() === currentPlan.toLowerCase(),
        amount: p.unit_amount || 0,
      };
    })
    .sort((a, b) => a.amount - b.amount);

  return <Pricing userId={userId} plans={plans} currentPlan={currentPlan} />;
}
