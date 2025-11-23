import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
 import { Redis } from "@upstash/redis"; 
 import { createClient } from "@supabase/supabase-js"; 

 const redis = new Redis({ url: process.env.UPSTASH_KV_REST_API_URL!, token: process.env.UPSTASH_KV_REST_API_TOKEN!, }); 
 
 const supabase = createClient( process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY! );

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Redis Fetch ---
  let customerId = await redis.get<string>(`user:${userId}:customer`);
  let subscription: any = null;

  if (customerId) {
    const subscriptionRaw = await redis.get(`customer:${customerId}:subscription`);
    if (subscriptionRaw) {
      subscription =
        typeof subscriptionRaw === "string" ? JSON.parse(subscriptionRaw) : subscriptionRaw;
    }
  }

  // --- Supabase fallback ---
  if (!subscription) {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      subscription = data;
      customerId = data.stripe_customer_id || customerId;
    }
  }

  // --- Free user ---
  if (!subscription) {
    return NextResponse.json({
      plan: "free",
      active: false,
      subscription: null,
      customerId: null,
    });
  }

  // --- Extract PriceID ---
  const priceId =
    subscription?.items?.data?.[0]?.price?.id ||
    subscription?.priceId ||
    subscription?.plan_id ||
    "unknown";

  const status = subscription.status;
  const active = status === "active" || status === "trialing";

  return NextResponse.json({
    customerId,
    subscription,
    plan: priceId,
    active,
    status,
    periodEnd:
      subscription?.current_period_end ||
      subscription?.items?.data?.[0]?.current_period_end ||
      null,
  });
}
