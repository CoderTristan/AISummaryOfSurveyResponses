import Pricing from "@/components/Pricing";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function PricingPage() {
  const { userId } = await auth();

  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
  });

  const plans = prices.data.map((p) => {
    let name = "Untitled Plan";

    if (p.product && typeof p.product !== "string" && !p.product.deleted) {
      name = p.product.name;
    }

    return {
      priceId: p.id,
      price: p.unit_amount ? `$${p.unit_amount / 100}/mo` : "",
      name,
    };
  });

  return <Pricing userId={userId!} plans={plans} />;
}
