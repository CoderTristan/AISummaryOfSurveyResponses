import { NextResponse } from "next/server";
import { createSupaClient } from "@/lib/supabaseClient";
import { sendFrequencyEmail } from "@/lib/email";
import { shouldSendEmail } from "@/lib/shouldSendEmail";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const {userId} = await auth()
  const supabase = createSupaClient();

  // 1. Get all projects with notify_enabled ON
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

    // 2. Load surveys belonging to this project
    const { data: surveys } = await supabase
      .from("surveys")
      .select("question, responses_count")
      .eq("project_id", project.id);

    const formatted = surveys?.map((s: any) => ({
      question: s.question,
      currentCount: s.responses[0]?.count ?? 0,
    }));

    // 3. Get user email
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    // 4. Send email
    await sendFrequencyEmail({
      to: user?.email,
      frequency: project.report_frequency,
      surveys: formatted,
    });

    // 5. Update last_notified_at
    await supabase
      .from("projects")
      .update({ last_notified_at: new Date().toISOString() })
      .eq("id", project.id);
  }

  return NextResponse.json({ ok: true });
}
