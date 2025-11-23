import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TRIAL_DAYS = 14;

export async function POST(req: Request) {
  const payload = await req.text();
  const headerList = headers();

  const svix_id = (await headerList).get("svix-id");
  const svix_timestamp = (await headerList).get("svix-timestamp");
  const svix_signature = (await headerList).get("svix-signature");

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

    try {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: { clerkUserId },
      });

      // Calculate trial period
      const trialStart = new Date();
      const trialEnd = new Date(trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

      // Insert into Supabase users table
      const { error } = await supabase.from("subscriptions").insert({
        user_id: clerkUserId,
        stripe_customer_id: customer.id,
        plan: "starter",
        status: "trial",
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
      });

      if (error) {
        console.error("❌ Supabase Insert Error:", error.message);
        return new Response("Supabase error", { status: 500 });
      }

      console.log(
        `✅ User added to Supabase with trial until ${trialEnd.toISOString()}:`,
        clerkUserId
      );
    } catch (err) {
      console.error("❌ Error creating Stripe customer or Supabase insert:", err);
      return new Response("Internal error", { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
