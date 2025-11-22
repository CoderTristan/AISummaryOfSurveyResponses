// /app/api/webhooks/route.ts
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export const config = {
  api: { bodyParser: false },
};

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook err:", err.message);
    return new NextResponse(`Webhook error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case "invoice.paid":
      console.log("Subscription payment succeeded");
      break;
    case "customer.subscription.deleted":
      console.log("Subscription canceled");
      break;
  }

  return NextResponse.json({ received: true });
}
