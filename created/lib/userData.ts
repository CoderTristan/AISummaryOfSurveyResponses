'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { auth } from '@clerk/nextjs/server';


export async function deleteUserData(clerkId: string) {
  if (!clerkId) throw new Error("No user ID provided");

  // Step 1: Get all survey IDs for the user
const { data: surveys, error: surveysError1 } = await supabaseAdmin
  .from('surveys')
  .select('id')
  .eq('user_id', clerkId);

if (surveysError1) {
  console.error('Error fetching surveys:', surveysError1);
} else if (surveys?.length) {
  const surveyIds = surveys.map((s) => s.id);

  // Step 2: Delete responses associated with these surveys
  const { error: responsesError } = await supabaseAdmin
    .from('responses')
    .delete()
    .in('survey_id', surveyIds);

  if (responsesError) console.error('Error deleting responses:', responsesError);
} else {
  console.log('No surveys found for this user, skipping response deletion');
}

  // Delete surveys
  const { error: surveysError } = await supabaseAdmin
    .from('surveys')
    .delete()
    .eq('user_id', clerkId);
  if (surveysError) console.error('Error deleting surveys:', surveysError);

  // Delete projects
  const { error: projectsError } = await supabaseAdmin
    .from('projects')
    .delete()
    .eq('user_id', clerkId);
  if (projectsError) console.error('Error deleting projects:', projectsError);

  // Delete subscriptions
  const { error: subscriptionsError } = await supabaseAdmin
    .from('subscriptions')
    .delete()
    .eq('clerk_id', clerkId);
  if (subscriptionsError) console.error('Error deleting subscriptions:', subscriptionsError);

  // Delete the user
  const { error: userError } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('clerk_id', clerkId);
  if (userError) {
    console.error('Error deleting user:', userError);
    throw new Error('Failed to delete user');
  }

  return true;
}

export async function getBalance() {
  const { userId } = await auth();
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("balance")
    .eq("clerk_id", userId)
    .maybeSingle()

  if (error) throw error;
  return data;
}