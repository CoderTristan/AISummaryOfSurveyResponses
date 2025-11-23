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

// Redis (user ↔ customer ↔ subscription)
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

  // ------------------------------------------
  // 1️⃣ Get existing customer (if any)
  // ------------------------------------------
  let customerId = await redis.get<string>(`user:${userId}:customer`);

  // ------------------------------------------
  // 2️⃣ If no customer exists → create one
  // ------------------------------------------
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { userId },
    });

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

  // ------------------------------------------
  // 3️⃣ Check if customer already HAS a subscription
  //    Stored in redis as: customer:{customerId}:subscription
  // ------------------------------------------
  const existingSubscriptionRaw = await redis.get(
    `customer:${customerId}:subscription`
  );

  const existingSubscription = existingSubscriptionRaw
    ? typeof existingSubscriptionRaw === "string"
      ? JSON.parse(existingSubscriptionRaw)
      : existingSubscriptionRaw
    : null;

  const isSubscribed =
    existingSubscription &&
    existingSubscription.status &&
    existingSubscription.status !== "canceled" &&
    existingSubscription.status !== "incomplete_expired";

  // ------------------------------------------
  // 4️⃣ If user ALREADY subscribed → Billing Portal (NO CARD REQUIRED)
  // ------------------------------------------
  if (isSubscribed) {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/pricing`,
    });

    return NextResponse.json({
      url: portalSession.url,
      mode: "billing-portal",
    });
  }

  // ------------------------------------------
  // 5️⃣ If user is NOT subscribed → Create a Checkout Session
  // ------------------------------------------
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/dashboard/projects?success=1`,
    cancel_url: `${APP_URL}/pricing?canceled=1`,
    metadata: { userId },
  });

  return NextResponse.json({
    url: session.url,
    mode: "checkout",
    sessionId: session.id,
  });
}
