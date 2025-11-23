import Pricing from "@/components/Pricing";
import { auth } from "@clerk/nextjs/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_KV_REST_API_URL!,
  token: process.env.UPSTASH_KV_REST_API_TOKEN!,
});

export default async function PricingPage() {
  const { userId } = await auth();
  if (!userId) throw new Error("Missing userId");

  // --- 1. Get customerId from Redis ---
  const customerId = await redis.get<string>(`user:${userId}:customer`);

  // --- 2. Get subscription JSON ---
  let subscription: any = null;
  if (customerId) {
    const raw = await redis.get(`customer:${customerId}:subscription`);
    if (raw) {
      subscription = typeof raw === "string" ? JSON.parse(raw) : raw;
    }
  }

  // --- 3. Determine plan ---
  const currentPriceId =
    subscription?.items?.data?.[0]?.price?.id ||
    subscription?.priceId ||
    "free";

  // --- 4. Load Stripe ---
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover",
  });

  // --- 5. Get all active prices ---
  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
  });

  const plans = prices.data
    .map((p) => ({
      priceId: p.id,
      name:
        typeof p.product !== "string" && !p.product.deleted
          ? p.product.name
          : "Plan",
      price: p.unit_amount ? `$${p.unit_amount / 100}/mo` : "",
      description:
        typeof p.product !== "string" && !p.product.deleted
          ? p.product.description || ""
          : "",
      amount: p.unit_amount || 0,
      isCurrent: p.id === currentPriceId,
    }))
    .sort((a, b) => a.amount - b.amount);

  return (
    <Pricing
      userId={userId}
      plans={plans}
      currentPlan={currentPriceId}
    />
  );
}
