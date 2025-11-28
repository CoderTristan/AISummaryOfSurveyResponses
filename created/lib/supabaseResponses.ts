'use server'

import { auth } from "@clerk/nextjs/server";
import { createSupaClient } from "./supabaseClient";

const supabase = createSupaClient()

export async function deleteAllProjectResponses(projectId: string) {
  const { userId } = await auth();

  // 1. Get all surveys for this project
  const { data: surveys, error: surveyErr } = await supabase
    .from("surveys")
    .select("id")
    .eq("project_id", projectId);

  if (surveyErr) throw surveyErr;
  if (!surveys || surveys.length === 0) return; // no surveys, nothing to delete

  const surveyIds = surveys.map((s) => s.id);

  // 2. Delete all responses where survey_id is in these ids
  const { error: deleteErr } = await supabase
    .from("responses")
    .delete()
    .in("survey_id", surveyIds);

  if (deleteErr) throw deleteErr;
}


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