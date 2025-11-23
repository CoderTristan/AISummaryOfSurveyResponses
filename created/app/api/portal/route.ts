// /app/api/portal/route.ts
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

const APP_URL = process.env.APP_URL!;

export async function POST(req: Request) {
  const { userId } = await req.json();

  const customerId = await findCustomerIdForUser(userId); // you fill this in

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/dashboard/projects`,
  });

  return NextResponse.json({ url: portal.url });
}

async function findCustomerIdForUser(userId: string) {
  return "cus_xyz123";
}
