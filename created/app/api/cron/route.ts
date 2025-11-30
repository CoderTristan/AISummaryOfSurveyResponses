import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendFrequencyEmail } from "@/lib/email";
import { shouldSendEmail } from "@/lib/shouldSendEmail";
import { createSupaClient } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createSupaClient()

  const { data: projects, error } = await supabaseAdmin
    .from("projects")
    .select("id, user_id, report_frequency, notify_enabled, last_notified_at");

  if (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: true });
  }

  for (const project of projects) {
    if (!project.notify_enabled) continue;
    console.log(project.id)

    const shouldSend = shouldSendEmail(project);
    if (!shouldSend) continue;

    const { data: surveys, error: surverror } = await supabase
      .from("surveys")
      .select("question, response_count")
      .eq("project_id", project.id);
console.log("Surveys:", surveys);
console.log("Surveyserror:", surverror);


    const formatted = surveys?.map((s: any) => ({
      question: s.question,
      currentCount: s.response_count ?? 0,
    }));
    console.log(formatted)


    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", project.user_id)
      .single();
    console.log(user)
    

    if (!user?.email) continue;

    await sendFrequencyEmail({
      to: user.email,
      frequency: project.report_frequency,
      surveys: formatted,
    });

    await supabase
      .from("projects")
      .update({ last_notified_at: new Date().toISOString() })
      .eq("id", project.id);
  }

  return NextResponse.json({ ok: true });
}
