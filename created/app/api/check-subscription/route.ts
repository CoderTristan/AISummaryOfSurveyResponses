import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Initialize Upstash Redis using the environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // 1️⃣ Get Stripe customer ID from Redis
  const customerId = await redis.get<string>(`UPSTASH:user:${userId}:customer`);

  if (!customerId) {
    // User exists but hasn’t subscribed yet
    return NextResponse.json({
      plan: "free",
      active: false,
      customerId: null,
      subscription: null,
    });
  }

  // 2️⃣ Get subscription snapshot from Redis
  const subscription = await redis.get<any>(`UPSTASH:customer:${customerId}:subscription`);

  if (!subscription) {
    // Customer exists but hasn’t subscribed yet
    return NextResponse.json({
      plan: "free",
      active: false,
      customerId,
      subscription: null,
    });
  }

  // 3️⃣ Build clean response for frontend
  return NextResponse.json({
    customerId,
    subscription,
    plan: subscription.priceId || "paid", // Stripe price ID or fallback
    active: subscription.status === "active",
    status: subscription.status,
    periodEnd: subscription.current_period_end,
  });
}
