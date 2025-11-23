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

  // 1️⃣ Check if user already has a Stripe customer
  let customerId = await redis.get<string>(`user:${userId}:customer`);

  if (!customerId) {
    // 2️⃣ Create new Stripe customer
    const customer = await stripe.customers.create({
      metadata: { userId },
    });
    customerId = customer.id;

    // Save Redis mappings
    await redis.set(`user:${userId}:customer`, customerId);
    await redis.set(`customer:${customerId}:user`, userId);

    // Save minimal record in Supabase
    try {
      await supabase
        .from("subscriptions")
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          plan: "free",
        });
    } catch (err) {
      console.error("Supabase upsert failed:", err);
    }
  }

  // 3️⃣ Create the Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/dashboard/projects?success=1`,
    cancel_url: `${APP_URL}/pricing?canceled=1`,
    metadata: { userId },
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
