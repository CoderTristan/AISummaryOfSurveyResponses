import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { createClient } from "@supabase/supabase-js";

const redis = new Redis({
  url: process.env.UPSTASH_KV_REST_API_URL!,
  token: process.env.UPSTASH_KV_REST_API_TOKEN!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // 1️⃣ Try Redis first
  let customerId = await redis.get<string>(`user:${userId}:customer`);
  let subscription: any = null;

  if (customerId) {
    const subscriptionJson = await redis.get<string>(`customer:${customerId}:subscription`);
    subscription = subscriptionJson ? JSON.parse(subscriptionJson) : null;
  }

  // 2️⃣ Fallback to Supabase if Redis is empty
  if (!subscription) {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      subscription = data;
      customerId = data.stripe_customer_id || null;
    }
  }

  if (!subscription) {
    return NextResponse.json({
      plan: "free",
      active: false,
      customerId: null,
      subscription: null,
    });
  }

  // 4️⃣ Return subscription info
  return NextResponse.json({
    customerId,
    subscription,
    plan: subscription.priceId || subscription.plan || "paid",
    active: subscription.status === "active",
    status: subscription.status,
    periodEnd: subscription.current_period_end,
  });
}
