'use client';

import { useState, useEffect } from "react";

export function useSubscription() {
  const [sub, setSub] = useState<{ plan: string; status: string } | null>(null);

  useEffect(() => {
    async function fetchSub() {
      const res = await fetch("/api/subscription");
      const data = await res.json();
      setSub(data);
    }
    fetchSub();
  }, []);

  return sub;
}
