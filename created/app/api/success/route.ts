import { redirect } from "next/navigation";
import { redis } from "@/lib/redis";
import { stripe } from "@/lib/stripe";
import { syncStripeDataToKV } from "@/lib/stripeSync";

const APP_URL = process.env.APP_URL!;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  const userId = url.searchParams.get("user_id");

  if (!sessionId && !userId) return redirect("/");

  try {
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      if (customerId) await syncStripeDataToKV(customerId);
    } else if (userId) {
      const subscriptionRaw = await redis.get(`user:${userId}:subscription`);
      if (!subscriptionRaw) {
        await redis.set(`user:${userId}:subscription`, JSON.stringify({
          plan: "free",
          status: "active",
          items: { data: [] },
          current_period_end: null,
        }));
      }
    }
  } catch (err) { console.error(err); }

  return redirect(`${APP_URL}/dashboard/projects`);
}
