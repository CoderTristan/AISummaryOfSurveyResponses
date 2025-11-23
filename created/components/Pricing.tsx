'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Pricing({
  userId,
  plans,
  currentPlan,
}: {
  userId: string;
  plans: { name: string; priceId: string; price: string; description: string }[];
  currentPlan: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const subscribe = async (priceId: string) => {
    setLoading(priceId);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, userId }),
    });

    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
      {plans.map((p) => {
        const isCurrent = p.name.toLowerCase() === currentPlan.toLowerCase();
        return (
          <div key={p.priceId} className="border rounded-xl p-6 shadow-sm">
            {isCurrent && (
              <p className="text-sm font-semibold text-blue-500 mb-1">Currently</p>
            )}
            <h3 className="font-bold text-xl mb-2">{p.name}</h3>
            <p className="text-gray-500 mb-2">{p.description}</p>
            <p className="text-gray-700 mb-4">{p.price}</p>

            <Button
              className="w-full"
              onClick={() => subscribe(p.priceId)}
              disabled={loading === p.priceId || isCurrent}
            >
              {isCurrent ? "Current Plan" : loading === p.priceId ? "Loading..." : "Select"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
