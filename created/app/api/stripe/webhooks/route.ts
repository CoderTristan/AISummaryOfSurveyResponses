// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { Redis } from "@upstash/redis";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

// Upstash Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const runtime = "nodejs"; // ensures raw body handling

export async function POST(req: NextRequest) {
  // 1️⃣ Get raw payload and signature
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig) {
    console.error("Missing stripe-signature header");
    return new NextResponse("Missing signature", { status: 400 });
  }

  // 2️⃣ Verify webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed:", err?.message ?? err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const type = event.type;
  const data = event.data.object as any;

  // 3️⃣ Extract customerId
  const customerId = data?.customer ?? (data?.billing_reason ? data?.customer : null);

  if (!customerId) {
    console.log(`[stripe:webhook] no customer id for event ${type}; ignoring`);
    return NextResponse.json({ received: true });
  }

  // 4️⃣ Helper to fetch full subscription and store in KV
  async function writeSubscriptionToKV(subscriptionId: string) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await redis.set(`UPSTASH:customer:${customerId}:subscription`, JSON.stringify(subscription));
      console.log(
        `[stripe:webhook] KV updated for ${customerId} (sub: ${subscription.id}, eventId: ${event.id})`
      );
    } catch (err) {
      console.error(`[stripe:webhook] failed retrieving/writing subscription:`, err);
      throw err;
    }
  }

  try {
    switch (type) {
      // Subscription lifecycle events
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await redis.set(`UPSTASH:customer:${customerId}:subscription`, JSON.stringify(data));
        console.log(
          `[stripe:webhook] stored subscription snapshot for ${customerId} (event: ${type}, sub: ${data.id})`
        );
        break;

      // Invoice events — refresh subscription from Stripe
      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
        if (data.subscription) {
          await writeSubscriptionToKV(data.subscription);
        } else {
          console.log(`[stripe:webhook] invoice event had no subscription: ${type}`);
        }
        break;

      // Checkout session completed — often includes subscription id
      case "checkout.session.completed":
        if (data.subscription) {
          await writeSubscriptionToKV(data.subscription);
        }
        break;

      default:
        console.log(`[stripe:webhook] unhandled event type: ${type}`);
        break;
    }
  } catch (err) {
    console.error(`[stripe:webhook] error processing event ${type}:`, err);
    return new NextResponse("Webhook processing error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
