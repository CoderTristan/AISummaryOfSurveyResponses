import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // required for raw body
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature", { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle your events
  switch (event.type) {
    case "invoice.paid":
      console.log("Invoice paid: subscription renewed");
      break;

    case "invoice.payment_failed":
      console.log("Payment failed for subscription");
      break;

    case "customer.subscription.deleted":
      console.log("Subscription canceled");
      break;

    default:
      console.log("Unhandled event:", event.type);
  }

  return NextResponse.json({ received: true });
}
