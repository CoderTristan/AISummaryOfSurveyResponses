import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { syncStripeDataToKV } from "@/lib/stripeSync";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customerId = await redis.get<string>(`user:${userId}:customer`);

  // PAID USERS (Stripe customer exists)
  if (customerId) {
    let subscriptionRaw = await redis.get(`customer:${customerId}:subscription`);
    let subscription = null;

    try {
      subscription =
        typeof subscriptionRaw === "string"
          ? JSON.parse(subscriptionRaw)
          : null;
    } catch {
      subscription = null;
    }

    if (!subscription) {
      // fallback safe state
      subscription = { plan: "free", status: "active" };
    }

    // Always keep fresh
    await syncStripeDataToKV(customerId);

    return NextResponse.json({ customerId, subscription });
  }

  // FREE USERS
  let subRaw = await redis.get(`user:${userId}:subscription`);
  let subscription = { plan: "free", status: "active" };

  try {
    if (typeof subRaw === "string") subscription = JSON.parse(subRaw);
  } catch {}

  return NextResponse.json({ customerId: null, subscription });
}
