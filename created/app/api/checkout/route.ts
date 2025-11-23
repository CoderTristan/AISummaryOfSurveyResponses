// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { Redis } from "@upstash/redis";
import { createClient } from "@supabase/supabase-js";

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

  if (!priceId || !userId) {
    return NextResponse.json({ error: "Missing priceId or userId" }, { status: 400 });
  }

  // 1️⃣ Get or create Stripe customer
  let customerId = await redis.get<string>(`user:${userId}:customer`);

  if (!customerId) {
    const customer = await stripe.customers.create({ metadata: { userId } });
    customerId = customer.id;

    // Save mappings
    await redis.set(`user:${userId}:customer`, customerId);
    await redis.set(`customer:${customerId}:user`, userId);

    // Minimal Supabase record
    await supabase.from("subscriptions").upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      plan: "free",
    });
  }

  // 2️⃣ Check for existing subscription
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    expand: ["data.default_payment_method", "data.items.data.price.product"],
  });

  const activeSub = subscriptions.data.find((s) => s.status === "active");

  // 3️⃣ Cancel old subscription immediately if exists
  if (activeSub) {
    await stripe.subscriptions.update(activeSub.id, {
      cancel_at_period_end: false, // cancel immediately
    });
  }

  // 4️⃣ Create new subscription with proration
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
    proration_behavior: "create_prorations", // ensures immediate proration
  });

  // 5️⃣ Update Redis and Supabase
  await redis.set(`customer:${customerId}:subscription`, JSON.stringify(subscription));
  await supabase.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    plan: priceId,
  });

  // 6️⃣ Return Stripe Checkout info
  const invoice = subscription.latest_invoice as any;
  const paymentIntent = invoice.payment_intent as any;

  return NextResponse.json({
    subscriptionId: subscription.id,
    clientSecret: paymentIntent?.client_secret,
    status: subscription.status,
  });
}
