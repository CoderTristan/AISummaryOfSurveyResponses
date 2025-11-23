// /app/api/portal/route.ts
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const APP_URL = process.env.APP_URL!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { userId } = await req.json();
  if (!userId) return new Response("Missing userId", { status: 400 });

  const customerId = await findOrCreateCustomer(userId);

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/dashboard/projects`,
  });

  return NextResponse.json({ url: portal.url });
}

// Find existing Stripe customer or create one if missing
async function findOrCreateCustomer(userId: string) {
  // Look up the customer in Supabase
  const { data: userRow, error } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Supabase error:", error.message);
    throw new Error("Failed to look up user");
  }

  if (userRow?.stripe_customer_id) {
    return userRow.stripe_customer_id;
  }

  // Create a new Stripe customer if not found
  const customer = await stripe.customers.create({
    metadata: { clerkUserId: userId },
  });

  // Save the new customer ID to Supabase
  const { error: insertError } = await supabase
    .from("subscriptions")
    .update({ stripe_customer_id: customer.id })
    .eq("user_id", userId);

  if (insertError) console.error("Failed to save new Stripe customer:", insertError.message);

  return customer.id;
}
