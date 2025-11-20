"use server"
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

  const { error } = await supabase
    .from("responses")
    .insert({
      survey_id: surveyId,
      answer,
    });

  if (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}