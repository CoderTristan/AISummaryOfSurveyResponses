import { NextResponse } from "next/server";
import { createSupaClient } from "@/lib/supabaseClient";
import { sendFrequencyEmail } from "@/lib/email";
import { shouldSendEmail } from "@/lib/shouldSendEmail";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createSupaClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, user_id, report_frequency, notify_enabled, last_notified_at");

  if (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: true });
  }

  for (const project of projects) {
    if (!project.notify_enabled) continue;

    const shouldSend = shouldSendEmail(project);
    if (!shouldSend) continue;

    const { data: surveys } = await supabase
      .from("surveys")
      .select("question, responses_count")
      .eq("project_id", project.id);

    const formatted = surveys?.map((s: any) => ({
      question: s.question,
      currentCount: s.responses_count ?? 0,
    }));

    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", project.user_id)
      .single();

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
