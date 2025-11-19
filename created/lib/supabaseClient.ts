import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export const createSupaClient = () => {return createClient(supabaseUrl, supabaseKey, {async accessToken() {
    return ((await auth()).getToken())
}})};