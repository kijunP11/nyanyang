import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

export async function getUserProfile(
  client: SupabaseClient<Database>,
  { userId }: { userId: string | null },
) {
  if (!userId) {
    return null;
  }
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("profile_id", userId)
    .single();
  if (error) {
    throw error;
  }
  return data;
}
