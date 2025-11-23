// /app/api/checkout/route.ts
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

const APP_URL = process.env.APP_URL!;

export async function POST(req: Request) {
  const { priceId, userId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/dashboard/projects?success=1`,
    cancel_url: `${APP_URL}/pricing?canceled=1`,
    metadata: { userId },
  });

  return NextResponse.json({ url: session.url });
}
