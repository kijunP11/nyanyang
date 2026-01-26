/**
 * Points Balance API Endpoint
 *
 * This module implements a REST API endpoint for managing user point balances
 * in the credits/billing system. It provides read access to balance information
 * and automatically initializes point records for new users.
 *
 * @module app/features/points/api/balance
 *
 * Key features:
 * - GET: Fetch user's current point balance and statistics
 * - Auto-creates point record if user doesn't have one yet
 * - Returns current_balance, total_earned, total_spent
 * - Requires authentication via Supabase
 *
 * @example
 * // Client-side usage
 * const response = await fetch('/api/points/balance');
 * const { balance } = await response.json();
 * console.log(balance.current_balance);
 */

import type { Route } from "./+types/balance";

import { eq } from "drizzle-orm";
import { data } from "react-router";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { userPoints } from "../schema";

/**
 * Loader function for fetching a user's point balance via GET request.
 *
 * This loader handles retrieving the authenticated user's point balance
 * from the database. If the user doesn't have a point record yet, it
 * automatically creates one with zero balance to ensure consistent data.
 *
 * The function performs the following operations:
 * 1. Creates a Supabase client from the request and validates authentication
 * 2. Retrieves the authenticated user's information
 * 3. Queries the database for the user's point balance
 * 4. Creates a new point record if none exists (with 0 balance)
 * 5. Returns the balance data with proper HTTP headers for cookie management
 *
 * @param {Route.LoaderArgs} args - React Router loader arguments
 * @param {Request} args.request - The incoming HTTP request object
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - On success (200): `{ balance: { current_balance, total_earned, total_spent, updated_at } }`
 *   - On unauthorized (401): `{ error: "Unauthorized" }`
 *   - On server error (500): `{ error: "Failed to fetch point balance" }`
 *
 * @throws {Response} Returns a 401 response if user is not authenticated
 * @throws {Response} Returns a 500 response if database query fails
 *
 * @example
 * // Expected response format
 * {
 *   balance: {
 *     current_balance: 1000,
 *     total_earned: 2000,
 *     total_spent: 1000,
 *     updated_at: "2025-11-12T10:30:00Z"
 *   }
 * }
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Create Supabase client and require authentication
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  // Get authenticated user
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const db = drizzle;

    // Fetch user's point balance
    let [pointBalance] = await db
      .select()
      .from(userPoints)
      .where(eq(userPoints.user_id, user.id))
      .limit(1);

    // If user doesn't have a point record yet, create one with 0 balance
    if (!pointBalance) {
      [pointBalance] = await db
        .insert(userPoints)
        .values({
          user_id: user.id,
          current_balance: 0,
          total_earned: 0,
          total_spent: 0,
        })
        .returning();
    }

    return data(
      {
        balance: {
          current_balance: pointBalance.current_balance,
          total_earned: pointBalance.total_earned,
          total_spent: pointBalance.total_spent,
          updated_at: pointBalance.updated_at,
        },
      },
      { headers }
    );
  } catch (err) {
    console.error("Error fetching point balance:", err);
    return data({ error: "Failed to fetch point balance" }, { status: 500, headers });
  }
}
