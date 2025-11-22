import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const payload = await req.text();
  const headerList = headers();

  const svix_id = headerList.get("svix-id");
  const svix_timestamp = headerList.get("svix-timestamp");
  const svix_signature = headerList.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;
  const wh = new Webhook(webhookSecret);

  let event;

  try {
    event = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err: any) {
    console.error("❌ Clerk Webhook Verification Error:", err.message);
    return new Response("Invalid Clerk webhook signature", { status: 400 });
  }

  // -----------------------------
  // HANDLE CLERK USER CREATED
  // -----------------------------
  if (event.type === "user.created") {
    const user = event.data;
    const clerkUserId = user.id;
    const email = user.email_addresses?.[0]?.email_address ?? null;

    console.log("🆕 Clerk user created:", clerkUserId);

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: email || undefined,
      metadata: { clerkUserId },
    });

    // Insert into Supabase users table
    const { error } = await supabase.from("users").insert({
      user_id: clerkUserId,
      stripe_customer_id: customer.id,
      status: "free",
      plan: "free",
    });

    if (error) {
      console.error("❌ Supabase Insert Error:", error.message);
      return new Response("Supabase error", { status: 500 });
    }

    console.log("✅ User added to Supabase:", clerkUserId);
  }

  return NextResponse.json({ success: true });
}
