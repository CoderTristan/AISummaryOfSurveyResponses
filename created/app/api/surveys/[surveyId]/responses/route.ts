'use server';
import { NextResponse } from "next/server";
import { createSupaClient } from "@/lib/supabaseClient";
import { PLAN_LIMITS } from "@/lib/plans"; // <-- make sure this exists (your plan limits)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  const supabase = createSupaClient();
  const { surveyId } = await params;
  const body = await request.json();
  const { answer } = body;

  if (!answer) return NextResponse.json({ error: "Missing answer" }, { status: 400 });

  // -------------------------------
  // 1️⃣ Get IP
  // -------------------------------
  const ipHeader = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
  const ip = ipHeader.split(",")[0].trim() || "unknown";

  // -------------------------------
  // 2️⃣ Prevent duplicate IP responses
  // -------------------------------
  const { data: existing } = await supabase
    .from("responses")
    .select("id")
    .eq("survey_id", surveyId)
    .eq("ip", ip)
    .single();

  if (existing) {
    return NextResponse.json({ error: "You have already submitted" }, { status: 429 });
  }

  // -------------------------------
  // 3️⃣ Fetch the survey to get the owner user_id
  // -------------------------------
  const { data: survey } = await supabase
    .from("surveys")
    .select("user_id")
    .eq("id", surveyId)
    .single();

  if (!survey) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  // -------------------------------
  // 4️⃣ Get the user's billing plan
  // -------------------------------
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", survey.user_id)
    .single();

  const plan = profile?.plan || "free";
  const maxResponses = PLAN_LIMITS[plan].responses;

  // -------------------------------
  // 5️⃣ Count total responses this month for the OWNER
  // -------------------------------
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: userThisMonth } = await supabase
    .from("responses")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfMonth.toISOString()) // Only this month
    .eq("user_id", survey.user_id);               // Count all user’s responses

  if (userThisMonth >= maxResponses) {
    return NextResponse.json(
      { error: `Monthly response limit reached for the ${plan} plan.` },
      { status: 429 }
    );
  }

  // -------------------------------
  // 6️⃣ Insert response
  // -------------------------------
  const { error: insertError } = await supabase
    .from("responses")
    .insert({
      survey_id: surveyId,
      answer,
      ip,
      user_id: survey.user_id // <-- must store owner to count monthly usage
    });

  if (insertError) {
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }

  // -------------------------------
  // 7️⃣ Update survey's response_count
  // -------------------------------
  const { count } = await supabase
    .from("responses")
    .select("id", { count: "exact", head: true })
    .eq("survey_id", surveyId);

  await supabase.from("surveys").update({ response_count: count }).eq("id", surveyId);

  return NextResponse.json({ success: true, responseCount: count });
}
