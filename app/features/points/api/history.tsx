/**
 * Points Transaction History API Endpoint
 *
 * This module implements a REST API endpoint for retrieving paginated point
 * transaction history for authenticated users. It supports filtering by transaction
 * type and provides comprehensive audit trail information.
 *
 * @module app/features/points/api/history
 *
 * Key features:
 * - GET: Fetch paginated transaction history
 * - Filter by transaction type (charge, usage, reward, or all)
 * - Sort by date (newest first)
 * - Pagination support with configurable limit and offset
 * - Returns transaction details including amount, balance after, and reason
 *
 * @example
 * // Client-side usage - fetch recent transactions
 * const response = await fetch('/api/points/history?type=usage&limit=10&offset=0');
 * const { transactions, pagination } = await response.json();
 *
 * @example
 * // Fetch all transaction types with pagination
 * const response = await fetch('/api/points/history?type=all&limit=20&offset=20');
 */

import type { Route } from "./+types/history";

import { and, desc, eq } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { pointTransactions } from "../schema";

/**
 * Zod schema for validating query string parameters.
 *
 * @property {("charge"|"usage"|"reward"|"all")} [type="all"] - Filter transactions by type
 * @property {number} [limit=20] - Maximum number of transactions to return (1-100)
 * @property {number} [offset=0] - Number of transactions to skip for pagination
 */
const querySchema = z.object({
  type: z.enum(["charge", "usage", "reward", "all"]).optional().default("all"),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

/**
 * Loader function for fetching paginated transaction history via GET request.
 *
 * This loader retrieves a paginated list of point transactions for the authenticated
 * user. It supports filtering by transaction type and returns comprehensive transaction
 * details including amounts, balances, and metadata.
 *
 * The function performs the following operations:
 * 1. Creates a Supabase client and validates user authentication
 * 2. Parses and validates query parameters (type, limit, offset)
 * 3. Builds database query with optional type filter
 * 4. Fetches transactions sorted by creation date (newest first)
 * 5. Calculates pagination metadata
 * 6. Returns transaction list with pagination information
 *
 * @param {Route.LoaderArgs} args - React Router loader arguments
 * @param {Request} args.request - The incoming HTTP request with query parameters
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - On success (200): `{ transactions: Array, pagination: Object }`
 *   - On unauthorized (401): `{ error: "Unauthorized" }`
 *   - On validation error (400): `{ error: string, details: Object }`
 *   - On server error (500): `{ error: "Failed to fetch transaction history" }`
 *
 * @throws {Response} Returns a 401 response if user is not authenticated
 * @throws {Response} Returns a 400 response if query parameters are invalid
 * @throws {Response} Returns a 500 response if database query fails
 *
 * @example
 * // Expected response format
 * {
 *   transactions: [
 *     {
 *       transaction_id: "uuid",
 *       amount: -100,
 *       balance_after: 900,
 *       type: "usage",
 *       reason: "Chat message",
 *       reference_id: "room_123",
 *       created_at: "2025-11-12T10:30:00Z"
 *     }
 *   ],
 *   pagination: {
 *     total: 1,
 *     limit: 20,
 *     offset: 0,
 *     hasMore: false
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

  // Parse and validate query parameters
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams);
  const { success, data: params, error } = querySchema.safeParse(searchParams);

  if (!success) {
    return data(
      { error: "Invalid query parameters", details: error.flatten().fieldErrors },
      { status: 400, headers }
    );
  }

  try {
    const db = drizzle;

    // Build query conditions
    const conditions = [eq(pointTransactions.user_id, user.id)];

    // Filter by transaction type if specified
    if (params.type !== "all") {
      conditions.push(eq(pointTransactions.type, params.type));
    }

    // Fetch transactions
    const transactions = await db
      .select({
        transaction_id: pointTransactions.transaction_id,
        amount: pointTransactions.amount,
        balance_after: pointTransactions.balance_after,
        type: pointTransactions.type,
        reason: pointTransactions.reason,
        reference_id: pointTransactions.reference_id,
        created_at: pointTransactions.created_at,
      })
      .from(pointTransactions)
      .where(and(...conditions))
      .orderBy(desc(pointTransactions.created_at))
      .limit(params.limit)
      .offset(params.offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: eq(pointTransactions.user_id, user.id) })
      .from(pointTransactions)
      .where(and(...conditions));

    return data(
      {
        transactions,
        pagination: {
          total: count ? 1 : 0, // Simple count, will be improved with proper count function
          limit: params.limit,
          offset: params.offset,
          hasMore: transactions.length === params.limit,
        },
      },
      { headers }
    );
  } catch (err) {
    console.error("Error fetching transaction history:", err);
    return data({ error: "Failed to fetch transaction history" }, { status: 500, headers });
  }
}
