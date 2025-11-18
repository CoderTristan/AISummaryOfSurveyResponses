import { supabase } from "./supabase";

export async function createSurvey(payload: {
  id: string;
  user_id: string;
  question: string;
  type: string;
  options: string[] | null;
}) {
  const { error } = await supabase.from("surveys").insert(payload);

  if (error) throw error;
}
