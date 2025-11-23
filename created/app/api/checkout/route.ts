import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { syncStripeDataToKV } from "@/lib/stripeSync";
import { redis } from "@/lib/redis";

const APP_URL = process.env.APP_URL!;

export async function POST(req: Request) {
  const { priceId, userId } = await req.json();
  if (!userId || !priceId)
    return NextResponse.json({ error: "Missing userId or priceId" }, { status: 400 });

  // Ensure Stripe customer exists
  let customerId = await redis.get<string>(`user:${userId}:customer`);
  if (!customerId) {
    const customer = await stripe.customers.create({ metadata: { userId } });
    customerId = customer.id;
    await redis.set(`user:${userId}:customer`, customerId);
    await redis.set(
      `customer:${customerId}:subscription`,
      JSON.stringify({ status: "none" })
    );
  }

  // Eagerly sync subscription state
  try {
    await syncStripeDataToKV(customerId);
  } catch (err) {
    console.error("[checkout] Failed to sync Stripe data:", err);
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/success?userId=${userId}`,
    cancel_url: `${APP_URL}/pricing?canceled=1`,
    metadata: { userId },
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
