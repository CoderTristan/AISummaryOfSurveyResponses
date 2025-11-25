'use server'

import { auth } from "@clerk/nextjs/server";
import { createSupaClient } from "./supabaseClient";

const supabase = createSupaClient()

export async function createProject(payload: {
  id: string;
  name: string;
}) {
  const { userId } = await auth(); // no await needed

  const { error } = await supabase
    .from("projects")
    .insert({ ...payload, user_id: userId });

  if (error) throw error;
}

export async function deleteProject(projectId: string) {
  const { userId } = await auth();

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId); // Only allow deleting own projects

  if (error) throw error;
}

export async function getUserProjects() {
  const { userId } = await auth();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data;
}

export async function updateProjectEmailFields(id: any, data:any) {
return supabase
.from("projects")
.update({
notify_enabled: data.notify_enabled,
notify_email: data.notify_email,
report_frequency: data.notify_threshold,
notify_sent: data.notify_sent,
})
.eq("id", id);
}