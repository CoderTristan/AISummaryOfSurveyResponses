import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { syncStripeDataToKV } from "@/lib/stripeSync";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customerId = await redis.get<string>(`user:${userId}:customer`);
  if (customerId) {
    const subscriptionRaw = await redis.get(`customer:${customerId}:subscription`);
    const subscription = subscriptionRaw ? JSON.parse(subscriptionRaw as string) : { plan: "free", status: "active" };
    if (subscription.plan !== "free") {
      try { await syncStripeDataToKV(customerId); } catch (err) { console.error(err); }
    }
    return NextResponse.json({ customerId, subscription });
  }

  return NextResponse.json({ customerId: null, subscription: { plan: "free", status: "active" } });
}
