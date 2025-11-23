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

  // Get the current user's plan from Supabase
  const { data: userRow } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .single();

  const currentPlan = userRow?.plan || null;

  // Fetch all active Stripe prices
  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
  });

  // Map prices to plans including description
  const plans = prices.data
    .map((p) => {
      let name = "Untitled Plan";
      let description = "";

      if (p.product && typeof p.product !== "string" && !p.product.deleted) {
        name = p.product.name;
        description = p.product.description || "";
      }

      return {
        priceId: p.id,
        name,
        price: p.unit_amount ? `$${p.unit_amount / 100}/mo` : "",
        description,
        isCurrent: currentPlan && name.toLowerCase() === currentPlan.toLowerCase(),
        amount: p.unit_amount || 0,
      };
    })
    // Sort plans by amount ascending (cheapest first)
    .sort((a, b) => a.amount - b.amount);

  return <Pricing userId={userId!} plans={plans} currentPlan={currentPlan} />;
}
