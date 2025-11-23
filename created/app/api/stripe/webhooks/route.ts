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
  url: process.env.UPSTASH_KV_REST_API_URL!,
  token: process.env.UPSTASH_KV_REST_API_TOKEN!,
});

export const runtime = "nodejs"; // ensures raw body handling

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig) {
    console.error("Missing stripe-signature header");
    return new NextResponse("Missing signature", { status: 400 });
  }

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
  const customerId = data?.customer ?? (data?.billing_reason ? data?.customer : null);

  if (!customerId) {
    console.log(`[stripe:webhook] no customer id for event ${type}; ignoring`);
    return NextResponse.json({ received: true });
  }

  async function writeSubscriptionToRedis(subscriptionId: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await redis.set(`customer:${customerId}:subscription`, JSON.stringify(subscription));
    console.log(`[stripe:webhook] Redis updated for ${customerId} (sub: ${subscription.id}, eventId: ${event.id})`);
  }

  try {
    switch (type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await redis.set(`customer:${customerId}:subscription`, JSON.stringify(data));
        console.log(`[stripe:webhook] stored subscription snapshot for ${customerId} (event: ${type}, sub: ${data.id})`);
        break;

      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
      case "checkout.session.completed":
        if (data.subscription) {
          await writeSubscriptionToRedis(data.subscription);
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
