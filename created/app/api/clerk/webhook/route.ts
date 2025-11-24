import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
  const payload = await req.text();
  const headerList = await headers();

  const svix_id = headerList.get("svix-id");
  const svix_timestamp = headerList.get("svix-timestamp");
  const svix_signature = headerList.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature)
    return new Response("Missing svix headers", { status: 400 });

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

  if (event.type === "user.created") {
    const clerkUserId = event.data.id;

    const freePlan = {
      plan: "free",
      status: "active",
      current_period_end: null,
      items: { data: [] },
    };

    await redis.set(
      `user:${clerkUserId}:subscription`,
      JSON.stringify(freePlan)
    );

    console.log(`✅ Free tier stored for: ${clerkUserId}`);
  }

  return NextResponse.json({ ok: true });
}
