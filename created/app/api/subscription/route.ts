import { NextResponse } from "next/server";
import { getUserSubscription } from "@/lib/getSubscription";

export async function GET() {
  const sub = await getUserSubscription();
  return NextResponse.json(sub);
}
