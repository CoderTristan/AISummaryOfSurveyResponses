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

  if (!answer) return NextResponse.json({ error: "Missing answer" }, { status: 400 });

  const ipHeader = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
  const ip = ipHeader.split(",")[0].trim() || "unknown";

  const { data: existing } = await supabase
    .from("responses")
    .select("id")
    .eq("survey_id", surveyId)
    .eq("ip", ip)
    .single();

  if (existing) return NextResponse.json({ error: "You have already submitted" }, { status: 429 });

  const { error: insertError } = await supabase
    .from("responses")
    .insert({ survey_id: surveyId, answer, ip });

  if (insertError) return NextResponse.json({ error: "Failed to submit" }, { status: 500 });

  const { count } = await supabase
    .from("responses")
    .select("id", { count: "exact", head: true })
    .eq("survey_id", surveyId);

  await supabase.from("surveys").update({ response_count: count }).eq("id", surveyId);

  return NextResponse.json({ success: true, responseCount: count });
}
