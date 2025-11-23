'use server'
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupaClient } from "@/lib/supabaseClient";

export async function GET(req: Request) {
   const supabase = createSupaClient();
  const { userId } = await auth(); 

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("plan, status, trial_start, trial_end")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Supabase fetch error:", error.message);
      return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
    }

    if (!data) {
      // No subscription record
      return NextResponse.json({ status: null });
    }

    // Determine if trial is active
    const now = new Date();
    if (data.trial_start && data.trial_end) {
      const trialEnd = new Date(data.trial_end);
      if (trialEnd > now) {
        return NextResponse.json({
          status: "trial",
          trial_start: data.trial_start,
          trial_end: data.trial_end,
          plan: data.plan,
        });
      } else {
        // Trial expired
        return NextResponse.json({
          status: "expired",
          trial_start: data.trial_start,
          trial_end: data.trial_end,
          plan: data.plan,
        });
      }
    }

    // Otherwise, use subscription status
    return NextResponse.json({
      status: data.status,
      plan: data.plan,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
