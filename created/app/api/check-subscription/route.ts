import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customerId = await redis.get<string>(`user:${userId}:customer`);
  if (!customerId) return NextResponse.json({ status: "none" });

  const subscriptionRaw = await redis.get(`customer:${customerId}:subscription`);
  const subscription = subscriptionRaw
    ? typeof subscriptionRaw === "string"
      ? JSON.parse(subscriptionRaw)
      : subscriptionRaw
    : { status: "none" };

  return NextResponse.json({ customerId, subscription });
}
