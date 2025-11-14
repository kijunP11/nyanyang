/**
 * Payment System Database Queries
 * 
 * This file contains functions for interacting with the payment records
 * in the database. It provides a clean interface for fetching payment data
 * while handling errors appropriately.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

/**
 * Retrieve all payment records for a specific user
 * 
 * This function fetches the complete payment history for a user,
 * including all payment details like amount, status, and timestamps.
 * The RLS policies ensure users can only access their own payment records.
 * 
 * @param client - Authenticated Supabase client instance
 * @param userId - The ID of the user whose payments to retrieve
 * @returns An array of payment records for the specified user
 * @throws Will throw an error if the database query fails
 */
export async function getPayments(
  client: SupabaseClient<Database>,
  { userId }: { userId: string },
) {
  // Query the payments table for all records matching the user ID
  const { data, error } = await client
    .from("payments")
    .select("*")
    .eq("user_id", userId);

  // Throw any database errors that occur during the query
  if (error) {
    throw error;
  }
  
  // Return the payment records
  return data;
}
