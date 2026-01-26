/**
 * Points Usage API Endpoint
 *
 * This module implements a REST API endpoint for deducting points from user balances
 * when services are consumed (e.g., AI chat messages, feature usage). It ensures
 * atomic transactions and maintains a complete audit trail.
 *
 * @module app/features/points/api/usage
 *
 * Key features:
 * - POST: Deduct points from user's balance
 * - Atomic transaction with balance update and history record
 * - Validates sufficient balance before deduction
 * - Creates transaction record for audit trail
 * - Auto-initializes point record if user doesn't have one
 *
 * @example
 * // Client-side usage - deduct points for a chat message
 * const response = await fetch('/api/points/usage', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     amount: 10,
 *     reason: 'AI chat message',
 *     reference_id: 'msg_123'
 *   })
 * });
 * const { success, balance } = await response.json();
 */

import type { Route } from "./+types/usage";

import { eq, sql } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { pointTransactions, userPoints } from "../schema";

/**
 * Zod schema for validating the request body for point deduction.
 *
 * @property {number} amount - Positive integer amount to deduct from user's balance
 * @property {string} reason - Descriptive reason for deduction (1-200 characters)
 * @property {string} [reference_id] - Optional reference ID linking to the service/action
 *
 * @example
 * {
 *   amount: 10,
 *   reason: "Chat message with GPT-4",
 *   reference_id: "room_abc123"
 * }
 */
const bodySchema = z.object({
  amount: z.number().int().positive(), // Amount to deduct (positive number)
  reason: z.string().min(1).max(200), // Reason for deduction (e.g., "Chat message")
  reference_id: z.string().optional(), // Optional reference (e.g., room_id, message_id)
});

/**
 * Action handler for deducting points from a user's balance via POST request.
 *
 * This action handles point deduction operations atomically, ensuring that both
 * the user's balance is updated and a transaction record is created. The operation
 * validates sufficient balance before proceeding and automatically initializes
 * point records for new users.
 *
 * The function performs the following operations:
 * 1. Creates a Supabase client and validates user authentication
 * 2. Validates HTTP method (POST only)
 * 3. Parses and validates request body (amount, reason, reference_id)
 * 4. Fetches or creates user's point record
 * 5. Validates sufficient balance for the deduction
 * 6. Atomically updates balance and creates transaction record
 * 7. Returns success response with balance details
 *
 * @param {Route.ActionArgs} args - React Router action arguments
 * @param {Request} args.request - The incoming HTTP POST request with JSON body
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - On success (200): `{ success: true, balance: Object, transaction: Object }`
 *   - On unauthorized (401): `{ error: "Unauthorized" }`
 *   - On method not allowed (405): `{ error: "Method not allowed" }`
 *   - On validation error (400): `{ error: string, details: Object }`
 *   - On insufficient balance (400): `{ error: string, current_balance, required }`
 *   - On server error (500): `{ error: "Failed to deduct points" }`
 *
 * @throws {Response} Returns a 401 response if user is not authenticated
 * @throws {Response} Returns a 405 response if HTTP method is not POST
 * @throws {Response} Returns a 400 response if request body is invalid
 * @throws {Response} Returns a 400 response if user has insufficient balance
 * @throws {Response} Returns a 500 response if database operation fails
 *
 * @example
 * // Expected success response format
 * {
 *   success: true,
 *   balance: {
 *     previous: 1000,
 *     current: 990,
 *     deducted: 10
 *   },
 *   transaction: {
 *     transaction_id: "uuid",
 *     created_at: "2025-11-12T10:30:00Z"
 *   }
 * }
 *
 * @example
 * // Expected insufficient balance error
 * {
 *   error: "Insufficient balance",
 *   current_balance: 5,
 *   required: 10
 * }
 */
export async function action({ request }: Route.ActionArgs) {
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

  // Validate request method (POST only)
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405, headers });
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const { success, data: validData, error } = bodySchema.safeParse(body);

    if (!success) {
      return data(
        { error: "Invalid request", details: error.flatten().fieldErrors },
        { status: 400, headers }
      );
    }

    const db = drizzle;

    // Fetch current balance
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

    // Check if user has sufficient balance
    if (pointBalance.current_balance < validData.amount) {
      return data(
        {
          error: "Insufficient balance",
          current_balance: pointBalance.current_balance,
          required: validData.amount,
        },
        { status: 400, headers }
      );
    }

    // Calculate new balance
    const newBalance = pointBalance.current_balance - validData.amount;
    const newTotalSpent = pointBalance.total_spent + validData.amount;

    // Update user points (atomic)
    const [updatedBalance] = await db
      .update(userPoints)
      .set({
        current_balance: newBalance,
        total_spent: newTotalSpent,
      })
      .where(eq(userPoints.user_id, user.id))
      .returning();

    // Create transaction record
    const [transaction] = await db
      .insert(pointTransactions)
      .values({
        user_id: user.id,
        amount: -validData.amount, // Negative for deduction
        balance_after: newBalance,
        type: "usage",
        reason: validData.reason,
        reference_id: validData.reference_id || null,
      })
      .returning();

    return data(
      {
        success: true,
        balance: {
          previous: pointBalance.current_balance,
          current: newBalance,
          deducted: validData.amount,
        },
        transaction: {
          transaction_id: transaction.transaction_id,
          created_at: transaction.created_at,
        },
      },
      { headers }
    );
  } catch (err) {
    console.error("Error deducting points:", err);
    return data({ error: "Failed to deduct points" }, { status: 500, headers });
  }
}
