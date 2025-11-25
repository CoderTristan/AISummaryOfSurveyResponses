'use server'

import { auth } from "@clerk/nextjs/server";
import { createSupaClient } from "./supabaseClient";

const supabase = createSupaClient();

export async function getSurveys(projectId: string) {
  const { data, error } = await supabase
    .from("surveys")
    .select("*")
    .eq("project_id", projectId);

  if (error) throw error;
  return data || [];
}

export async function deleteSurveys(projectId: string, surveyId: string) {
  const { userId } = await auth();

  const { error } = await supabase
    .from("surveys")
    .delete()
    .eq("project_id", projectId)
    .eq("id", surveyId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateSurveyEmailFields(id: any, data:any) {
return supabase
.from("surveys")
.update({
notify_enabled: data.notify_enabled,
notify_email: data.notify_email,
notify_threshold: data.notify_threshold,
notify_sent: data.notify_sent,
})
.eq("id", id);
}

export async function createSurvey(payload: {
  id: string;
  question: string;
  type: string;
  color: string;
  survey_link: string;
  survey_iframe: string;
  survey_script: string;
  survey_widget: string;
  options: string[] | null;
  project_id: string | undefined;
}) {
  const { userId } = await auth();

  const { error } = await supabase
    .from("surveys")
    .insert({ ...payload, user_id: userId });

  if (error) throw error;
}
