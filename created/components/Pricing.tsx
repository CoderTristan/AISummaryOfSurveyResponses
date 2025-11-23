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

    try {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId, userId }),
  });

  if (!res.ok) throw new Error("Checkout session failed");

  const { url } = await res.json();
  window.location.href = url;
} catch (err) {
  console.error(err);
  alert("Failed to start checkout. Please try again.");
  setLoading(null);
}}


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
      {plans.map((p) => {
        const isCurrent = p.name.toLowerCase() === currentPlan.toLowerCase();
        return (
          <div key={p.priceId} className="border rounded-xl p-6 shadow-sm">
  <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
    <span>{p.name}</span>
    {isCurrent && (
      <span className="text-sm font-semibold text-blue-500">
        &#40;Currently&#41;
      </span>
    )}
  </h3>

  <p className="text-gray-500 mb-4">{p.price}</p>

  <Button
    className="w-full"
    onClick={() => subscribe(p.priceId)}
    disabled={isCurrent || loading === p.priceId}
  >
    {loading === p.priceId ? "Loading..." : isCurrent ? "Current Plan" : "Select"}
  </Button>

  {p.description && (
    <p className="text-gray-400 text-sm mt-2">{p.description}</p>
  )}
</div>

        );
      })}
    </div>
  );
}
