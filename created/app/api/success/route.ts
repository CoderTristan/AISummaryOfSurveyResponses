import { redis } from "@/lib/redis";
import { stripe } from "@/lib/stripe";
import { syncStripeDataToKV } from "@/lib/stripeSync";
import { redirect } from "next/navigation";

const APP_URL = process.env.APP_URL!;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) return redirect("/pricing");

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;

    if (customerId) await syncStripeDataToKV(customerId);
  } catch (err) {
    console.error("❌ Success route sync failed:", err);
  }

  return redirect(`${APP_URL}/dashboard/projects`);
}
