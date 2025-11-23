import { NextResponse } from "next/server";
import { syncStripeDataToKV } from "@/lib/stripeSync";
import { redis } from "@/lib/redis";

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.redirect("/pricing");

  const customerId = await redis.get<string>(`user:${userId}:customer`);
  if (customerId) await syncStripeDataToKV(customerId);

  return NextResponse.redirect("/dashboard/projects");
}
