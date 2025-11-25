'use server';
import { NextResponse } from "next/server";
import { createSupaClient } from "@/lib/supabaseClient";

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

  // 2️⃣ Count total responses for this survey
  const { count } = await supabase
    .from("responses")
    .select("id", { count: "exact", head: true })
    .eq("survey_id", surveyId);

  const responseCount: number = count ?? 0;

  // 3️⃣ Update survey's response_count column
  const { error: updateError } = await supabase
    .from("surveys")
    .update({ response_count: responseCount })  // <-- MUST pass object
    .eq("id", surveyId);                        // <-- surveyId column is "id"

  if (updateError) {
    console.error("Failed to update survey response count:", updateError);
  }

  return NextResponse.json({ success: true, responseCount });
}
