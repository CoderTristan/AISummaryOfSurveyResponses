import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { syncStripeDataToKV } from "@/lib/stripeSync";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-11-17.clover" });
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!); }
  catch (err: any) { console.error(err.message); return new NextResponse("Invalid signature", { status: 400 }); }

  const data = event.data.object as any;
  const customerId = data?.customer;
  if (!customerId) return NextResponse.json({ received: true });

  const allowedEvents: Stripe.Event.Type[] = [
    "checkout.session.completed", "customer.subscription.created", "customer.subscription.updated",
    "customer.subscription.deleted", "customer.subscription.paused", "customer.subscription.resumed",
    "invoice.paid", "invoice.payment_failed", "payment_intent.succeeded", "payment_intent.payment_failed"
  ];

  if (allowedEvents.includes(event.type)) {
    try { await syncStripeDataToKV(customerId); }
    catch (err) { console.error(`[webhook] ${event.type} error:`, err); return new NextResponse("Webhook error", { status: 500 }); }
  }

  return NextResponse.json({ received: true });
}
