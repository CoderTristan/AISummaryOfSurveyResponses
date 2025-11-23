import Stripe from "stripe";

// Export a single Stripe client instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
  // Optional: enable telemetry/logging
  // telemetry: false,
});
