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

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let event;
  try {
    event = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err: any) {
    console.error("❌ Clerk verification failed:", err.message);
    return new Response("Invalid signature", { status: 400 });
  }

  // 🔥 We ONLY initialize the user record in Redis.
  // ❗ Do NOT store subscription info here — Stripe handles that.
  if (event.type === "user.created") {
    const clerkUserId = event.data.id;

    // Create a minimal user record
    await redis.set(
      `user:${clerkUserId}:customer`,
      "none" // means user has no Stripe customer yet
    );

    console.log(`✅ Clerk user created and stored in Redis: ${clerkUserId}`);
  }

  return NextResponse.json({ ok: true });
}
