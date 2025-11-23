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

export const runtime = "nodejs"; // raw body support

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
    console.error("⚠️ Webhook signature verification failed:", err?.message);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const type = event.type;
  const data = event.data.object as any;
  const customerId = data?.customer;

  if (!customerId) {
    console.log(`[stripe:webhook] Event ${type} has no customer; ignoring.`);
    return NextResponse.json({ received: true });
  }

  // Helper: always save EXPANDED subscription data
  async function saveExpandedSubscription(subscriptionId: string) {
    const expanded = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price.product"],
    });

    await redis.set(
      `customer:${customerId}:subscription`,
      JSON.stringify(expanded)
    );

    console.log(
      `[stripe:webhook] Saved subscription for ${customerId}, sub: ${expanded.id}`
    );
  }

  try {
    switch (type) {
      //
      // 🔥 Subscription lifecycle events
      //
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await saveExpandedSubscription(data.id);
        break;

      //
      // 🔥 Payments that can update subscription state
      //
      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
      case "checkout.session.completed":
        if (data.subscription) {
          await saveExpandedSubscription(data.subscription);
        }
        break;

      default:
        console.log(`[stripe:webhook] Unhandled event type: ${type}`);
        break;
    }
  } catch (err) {
    console.error(`[stripe:webhook] Error processing event ${type}:`, err);
    return new NextResponse("Webhook processing error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
