"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Plan = {
  name: string;
  priceId: string;
  price: string;
  description: string;
  amount?: number;
};

export default function Pricing({
  userId,
  plans,
  currentPlan,
}: {
  userId: string;
  plans: Plan[];
  currentPlan: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (priceId: string) => {
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
      {plans.map((plan) => {
        const isCurrent =
          plan.name.toLowerCase() === currentPlan.toLowerCase();

        return (
          <div
            key={plan.priceId}
            className="border rounded-xl p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                <span>{plan.name}</span>
                {isCurrent && (
                  <span className="text-sm font-semibold text-blue-500">
                    (Current)
                  </span>
                )}
              </h3>

              <p className="text-gray-500 mb-4">{plan.price}</p>

              {plan.description && (
                <p className="text-gray-400 text-sm mb-4">
                  {plan.description}
                </p>
              )}
            </div>

            <Button
              className="w-full mt-4"
              onClick={() => handleSelect(plan.priceId)}
              disabled={isCurrent || loading === plan.priceId}
            >
              {loading === plan.priceId
                ? "Loading..."
                : isCurrent
                ? "Current Plan"
                : "Select"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
