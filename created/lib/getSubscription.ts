'use server';

import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";


export async function getUserSubscription() {
  const { userId } = await auth();

  if (!userId) {
    return { plan: "free", status: "none" }; // treat not signed in as free
  }

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("plan, status")
    .eq("clerk_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching subscription:", error);
    return { plan: "free", status: "none" };
  }

  if (!data) {
    return { plan: "free", status: "none" };
  }

  return {
    plan: data.plan ?? "free",
    status: data.status ?? "inactive",
  };
}
