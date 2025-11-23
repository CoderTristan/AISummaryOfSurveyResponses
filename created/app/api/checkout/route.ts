// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";

const APP_URL = process.env.APP_URL!;

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_KV_REST_API_URL!,
  token: process.env.UPSTASH_KV_REST_API_TOKEN!,
});

export async function POST(req: Request) {
  const { priceId, userId } = await req.json();

  if (!userId || !priceId) {
    return NextResponse.json(
      { error: "Missing userId or priceId" },
      { status: 400 }
    );
  }

  // 1️⃣ Get or create Stripe customer
  let customerId = await redis.get<string>(`user:${userId}:customer`);
  if (!customerId) {
    const customer = await stripe.customers.create({ metadata: { userId } });
    customerId = customer.id;

    await redis.set(`user:${userId}:customer`, customerId);
    await redis.set(`customer:${customerId}:user`, userId);

    // Create minimal Supabase record
    await supabase
      .from("subscriptions")
      .upsert({ user_id: userId, stripe_customer_id: customerId, plan: "free" });
  }

  // 2️⃣ Get current active subscription
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  const activeSub = subs.data[0];

  // 3️⃣ If there's an active subscription, cancel immediately with proration
  if (activeSub) {
    await stripe.subscriptions.update(activeSub.id, {
      cancel_at_period_end: false,
      proration_behavior: "create_prorations",
    });
  }

  // 4️⃣ Create new subscription with the selected price
  const newSub = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId, quantity: 1 }],
    payment_behavior: "default_incomplete", // ensures no card prompt if one exists
    expand: ["latest_invoice.payment_intent"],
    metadata: { userId },
  });

  // 5️⃣ Save subscription snapshot in Redis
  await redis.set(`customer:${customerId}:subscription`, JSON.stringify(newSub));

  return NextResponse.json({ url: `${APP_URL}/dashboard/projects?success=1`, subscriptionId: newSub.id });
}
