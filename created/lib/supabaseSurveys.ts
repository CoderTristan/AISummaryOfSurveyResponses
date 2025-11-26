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



export async function createSurvey(payload: {
  id: string;
  question: string;
  type: string;
  color: string;
  survey_link: string;
  survey_iframe: string;
  survey_script: string;
  survey_widget: string;
  survey_react_component: string;
  options: string[] | null;
  project_id: string | undefined;
}) {
  const { userId } = await auth();

  const { error } = await supabase
    .from("surveys")
    .insert({ ...payload, user_id: userId });

  if (error) throw error;
}
