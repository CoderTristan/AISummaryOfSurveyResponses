import Pricing from "@/components/Pricing";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function PricingPage() {
  const { userId } = await auth();

  // ---- READ PLAN FROM SUPABASE ----
  const { data: userRow } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .single();

  const currentPlan = userRow?.plan || null;

  // ---- FETCH PRICES FROM STRIPE ----
  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
  });

  // ---- MAP PRICES INTO PLANS ----
  const plans = prices.data
    .map((p) => {
      let name = "Untitled Plan";

      if (p.product && typeof p.product !== "string" && !p.product.deleted) {
        name = p.product.name;
      }

      return {
        priceId: p.id,
        name,
        price: p.unit_amount ? `$${p.unit_amount / 100}/mo` : "",
        isCurrent:
          currentPlan &&
          name.toLowerCase() === currentPlan.toLowerCase(),
        amount: p.unit_amount || 0,
      };
    })
    // ---- SORT DYNAMICALLY BY PRICE ----
    .sort((a, b) => a.amount - b.amount);

  return <Pricing userId={userId!} plans={plans} />;
}
