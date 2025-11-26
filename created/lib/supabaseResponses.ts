'use server'

import { auth } from "@clerk/nextjs/server";
import { createSupaClient } from "./supabaseClient";

const supabase = createSupaClient()

export async function getSurveyResponses(surveyId: string, order: "asc" | "desc" = "asc") {
  const { userId } = await auth();
  const { data, error } = await supabase
    .from("responses")
    .select("id, answer, created_at")
    .eq("survey_id", surveyId)
    .order("created_at", { ascending: order === "asc" });

  if (error) {
    console.error("Error fetching survey responses:", error);
    return [];
  }

  return data;
}

export async function deleteResponses(surveyId: string) {
  const { userId } = await auth();

  const { error } = await supabase
    .from("responses")
    .delete()
    .eq("survey_id", surveyId)

  if (error) throw error;
}

export async function deleteSingleResponse(responseId: string) {
  const { userId } = await auth();

  const { error } = await supabase
    .from("responses")
    .delete()
    .eq("id", responseId)

  if (error) throw error;
}