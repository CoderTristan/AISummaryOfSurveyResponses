import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { syncStripeDataToKV } from "@/lib/stripeSync";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Webhook signature bad:", err.message);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const customerId = (event.data.object as any)?.customer;

  if (customerId) {
    try {
      await syncStripeDataToKV(customerId);
    } catch (err) {
      console.error("❌ Sync failed:", err);
    }
  }

  return NextResponse.json({ received: true });
}
