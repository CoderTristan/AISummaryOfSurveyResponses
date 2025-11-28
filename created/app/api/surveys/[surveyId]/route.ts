'use server'
import { NextResponse } from "next/server";
import { createSupaClient } from "@/lib/supabaseClient";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  const supabase = createSupaClient();
  const { surveyId } = await params;
  console.log("SURVEY: " + surveyId)

  const { data, error } = await supabase
    .from("surveys")
    .select("id, question, type, options, project_id, color")
    .eq("id", surveyId)
    .single();
    
  if (error || !data) {
    return NextResponse.json({ error: "Survey not found" }, { status: 500 });
  }

  return NextResponse.json(data);
}
