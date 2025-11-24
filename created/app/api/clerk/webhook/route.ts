import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
  const payload = await req.text();
  const headerList = headers();

  const svix_id = (await headerList).get("svix-id");
  const svix_timestamp = (await headerList).get("svix-timestamp");
  const svix_signature = (await headerList).get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature)
    return new Response("Missing svix headers", { status: 400 });

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

  if (event.type === "user.created") {
    const user = event.data;
    const clerkUserId = user.id;

    try {
      const freeSubscription = {
        plan: "free",
        status: "active",
        items: { data: [] },
        current_period_end: null,
      };
      await redis.set(`user:${clerkUserId}:subscription`, JSON.stringify(freeSubscription));

      console.log(`✅ Free plan assigned for new user: ${clerkUserId}`);
    } catch (err) {
      console.error("❌ Error assigning free plan:", err);
      return new Response("Internal error", { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
