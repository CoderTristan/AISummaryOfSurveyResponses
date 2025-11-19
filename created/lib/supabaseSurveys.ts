'use server'

import { auth } from "@clerk/nextjs/server";
import { createSupaClient } from "./supabaseClient";

const supabase = createSupaClient();

export async function getSurveys(projectId: string) {
  const { userId } = await auth();

  const { data, error } = await supabase
    .from("surveys")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId);

  if (error) throw error;

  return data;
}

export async function createSurvey(payload: {
  id: string;
  question: string;
  type: string;
  options: string[] | null;
  project_id: string;
}) {
  const { userId } = await auth();

  const { error } = await supabase
    .from("surveys")
    .insert({ ...payload, user_id: userId });

  if (error) throw error;
}
