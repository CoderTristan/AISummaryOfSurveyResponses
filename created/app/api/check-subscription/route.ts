import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function POST(req: Request) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // 1️⃣ Get Stripe customer ID from Redis
  const customerId = await redis.get<string>(`user:${userId}:customer`);

  if (!customerId) {
    return NextResponse.json({
      plan: "free",
      active: false,
      customerId: null,
      subscription: null,
    });
  }

  // 2️⃣ Get subscription snapshot from Redis
  const subscriptionJson = await redis.get<string>(`customer:${customerId}:subscription`);
  const subscription = subscriptionJson ? JSON.parse(subscriptionJson) : null;

  if (!subscription) {
    return NextResponse.json({
      plan: "free",
      active: false,
      customerId,
      subscription: null,
    });
  }

  // 3️⃣ Build response for frontend
  return NextResponse.json({
    customerId,
    subscription,
    plan: subscription.priceId || "paid",
    active: subscription.status === "active",
    status: subscription.status,
    periodEnd: subscription.current_period_end,
  });
}
