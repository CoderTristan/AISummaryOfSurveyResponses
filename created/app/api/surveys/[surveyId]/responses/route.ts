'use server';
import { NextResponse } from "next/server";
import { createSupaClient } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  const supabase = createSupaClient();
  const { surveyId } = await params;
  const body = await request.json();
  const { answer, token, userId } = body; // userId comes from a cookie

  if (!answer) return NextResponse.json({ error: "Missing answer" }, { status: 400 });
  if (!token) return NextResponse.json({ error: "Missing embed token" }, { status: 401 });

  // Verify embed token
  const { data: survey, error: surveyError } = await supabase
    .from("surveys")
    .select("id, embed_token")
    .eq("id", surveyId)
    .single();
  if (surveyError || survey?.embed_token !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  // Fallback: generate a userId cookie if missing
  const uid = userId || uuidv4();

  // Prevent multiple submissions by same userId
  const { data: existing } = await supabase
    .from("responses")
    .select("id")
    .eq("survey_id", surveyId)
    .eq("user_id", uid)
    .single();

  if (existing) return NextResponse.json({ error: "You have already submitted" }, { status: 429 });

  // Insert response
  const { error: insertError } = await supabase
    .from("responses")
    .insert({ survey_id: surveyId, answer, user_id: uid });
  if (insertError) return NextResponse.json({ error: "Failed to submit" }, { status: 500 });

  // Update response count
  const { count } = await supabase
    .from("responses")
    .select("id", { count: "exact", head: true })
    .eq("survey_id", surveyId);
  await supabase.from("surveys").update({ response_count: count }).eq("id", surveyId);

  return NextResponse.json({ success: true, responseCount: count, userId: uid });
}
