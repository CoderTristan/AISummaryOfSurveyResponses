"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Plan = {
  name: string;
  priceId: string | null;
  price: string;
  description: string;
  amount?: number;
};

export default function Pricing({
  userId,
  plans,
  currentPlan,
}: {
  userId: string | null;
  plans: Plan[];
  currentPlan: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (priceId: string | null) => {
    if (!userId) {
      window.location.href = "/sign-in";
      return;
    }

    if (!priceId) return; // Free plan does nothing

    setLoading(priceId);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, userId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error("Checkout failed");

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert("Failed. Try again.");
      setLoading(null);
    }
  };

  return (
    <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
      {plans.map((plan) => {
        const isCurrent =
          userId &&
          plan.name.toLowerCase() === currentPlan.toLowerCase();

        return (
          <div
            key={plan.name}
            className="
              border rounded-2xl p-6 shadow-sm bg-white 
              hover:shadow-md transition-all flex flex-col
            "
          >
            <div>
              <h3 className="font-bold text-2xl mb-3 flex items-center gap-2">
                <span>{plan.name}</span>
                {isCurrent && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                    Current
                  </span>
                )}
              </h3>

              <p className="text-gray-800 text-3xl font-semibold mb-3">
                {plan.price}
              </p>

              <p className="text-gray-500 text-sm mb-6">
                {plan.description}
              </p>
            </div>

            <Button
              className="w-full mt-auto"
              onClick={() => handleSelect(plan.priceId)}
              disabled={loading === plan.priceId || isCurrent}
            >
              {!userId
                ? "Sign in to continue"
                : isCurrent
                ? "Current Plan"
                : loading === plan.priceId
                ? "Loading..."
                : "Choose Plan"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
