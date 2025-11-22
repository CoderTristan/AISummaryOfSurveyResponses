'use server';
import { NextResponse } from "next/server";
import { createSupaClient } from "@/lib/supabaseClient";
import { sendThresholdEmail } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  const supabase = createSupaClient();
  const { surveyId } = await params;
  const body = await request.json();
  const { answer } = body;

  if (!answer) {
    return NextResponse.json({ error: "Missing answer" }, { status: 400 });
  }

  // 1️⃣ Insert response
  const { error: insertError } = await supabase
    .from("responses")
    .insert({ survey_id: surveyId, answer });

  if (insertError) {
    console.error("Database error:", insertError);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }

  // 2️⃣ Fetch survey info including email settings
  const { data: survey, error: surveyError } = await supabase
    .from("surveys")
    .select("notify_enabled, notify_threshold, notify_email, notify_sent, question")
    .eq("id", surveyId)
    .single();

  if (surveyError || !survey) {
    console.error("Survey fetch error:", surveyError);
    return NextResponse.json({ success: true }); // response inserted anyway
  }

  // 3️⃣ Count total responses for this survey
  const { count, error: countError } = await supabase
    .from("responses")
    .select("id", { count: "exact", head: true })
    .eq("survey_id", surveyId);

  const responseCount: number = count ?? 0;


  if (countError) {
    console.error("Count error:", countError);
  }

  if (survey.notify_enabled &&
    responseCount >= survey.notify_threshold &&
    !survey.notify_sent)
    try {
      await sendThresholdEmail({
        to: survey.notify_email,
        surveyId,
        question: survey.question,
        threshold: survey.notify_threshold,
        currentCount: count || 0,
      });
      console.log({
        surveyId,
        question: survey.question,
        threshold: survey.notify_threshold,
        currentCount: count || 0,
      });
      await supabase
        .from("surveys")
        .update({ notify_sent: true })
        .eq("id", surveyId);
    } catch (err) {
      console.error("Failed to send notification email:", err);
    }

  return NextResponse.json({ success: true });
}
