import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Try Redis first — free users won't have a Stripe customer
  const subscriptionRaw = await redis.get(`user:${userId}:subscription`);
  const subscription = subscriptionRaw
    ? typeof subscriptionRaw === "string"
      ? JSON.parse(subscriptionRaw)
      : subscriptionRaw
    : { plan: "free", status: "active", items: { data: [] }, current_period_end: null };

  return NextResponse.json({ subscription, plan: subscription.plan, active: subscription.status === "active" });
}
