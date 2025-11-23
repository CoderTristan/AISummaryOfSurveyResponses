import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const APP_URL = process.env.APP_URL!;

// Supabase with service key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Upstash Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  const { userId } = await req.json();
  if (!userId) {
    return new NextResponse("Missing userId", { status: 400 });
  }

  // 1️⃣ Check Upstash KV for existing customer
  let customerId = await redis.get<string>(`UPSTASH:user:${userId}:customer`);

  if (!customerId) {
    // 2️⃣ Create new Stripe customer
    const customer = await stripe.customers.create({
      metadata: { userId },
    });

    customerId = customer.id;

    // 3️⃣ Save KV mappings in Upstash
    await redis.set(`UPSTASH:user:${userId}:customer`, customerId);
    await redis.set(`UPSTASH:customer:${customerId}:user`, userId);

    // 4️⃣ Save minimal record in Supabase (free plan)
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

  // 5️⃣ Create billing portal session
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/dashboard/projects`,
  });

  return NextResponse.json({ url: portal.url });
}
