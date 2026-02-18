/**
 * Admin Users Management API
 *
 * Provides API endpoints for administrative user management operations including
 * listing users, suspending accounts, and permanently deleting users. All operations
 * require admin authentication and are logged for audit purposes.
 *
 * @module features/admin/api/users
 */

import type { Route } from "./+types/users";

import { eq, like, or, desc, sql } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import makeServerClient from "~/core/lib/supa-client.server";
import makeServerAdminClient from "~/core/lib/supa-admin-client.server";

import { profiles } from "../../users/schema";
import { userPoints } from "../../points/schema";
import { requireAdmin, logAdminAction } from "../lib/guards.server";

/**
 * Fetches a paginated list of users with their profile and points information.
 *
 * Supports search filtering by display name and pagination. Returns user profiles
 * joined with their point balances. Requires admin authentication.
 *
 * @param request - The incoming request object containing URL parameters
 * @returns JSON response with users list and pagination metadata
 * @throws {Response} 401 Unauthorized if user is not authenticated
 * @throws {Response} 403 Forbidden if user is not an admin
 *
 * @example
 * ```typescript
 * // GET /api/admin/users?search=john&offset=0&limit=20
 * {
 *   users: [{
 *     user_id: "uuid",
 *     display_name: "John Doe",
 *     avatar_url: "https://...",
 *     points: { current_balance: 100, total_earned: 500, total_spent: 400 }
 *   }],
 *   pagination: { offset: 0, limit: 20, total: 150, hasMore: true }
 * }
 * ```
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const db = drizzle;

  // Build query
  let query = db
    .select({
      user_id: profiles.profile_id,
      display_name: profiles.name,
      avatar_url: profiles.avatar_url,
      verified_at: profiles.verified_at,
      created_at: profiles.created_at,
      updated_at: profiles.updated_at,
      points: {
        current_balance: userPoints.current_balance,
        total_earned: userPoints.total_earned,
        total_spent: userPoints.total_spent,
      },
    })
    .from(profiles)
    .leftJoin(userPoints, eq(profiles.profile_id, userPoints.user_id))
    .orderBy(desc(profiles.created_at))
    .limit(limit)
    .offset(offset);

  // Add search filter
  if (search) {
    query = query.where(
      like(profiles.name, `%${search}%`)
    ) as typeof query;
  }

  const users = await query;

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(profiles);

  return data(
    {
      users,
      pagination: {
        offset,
        limit,
        total: countResult.count,
        hasMore: offset + limit < countResult.count,
      },
    },
    { headers }
  );
}

/**
 * Zod schema for validating user suspension requests.
 *
 * @property user_id - UUID of the user to suspend
 * @property reason - Reason for suspension (1-500 characters)
 */
const suspendUserSchema = z.object({
  user_id: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

/**
 * Zod schema for validating user deletion requests.
 *
 * @property user_id - UUID of the user to delete
 * @property reason - Reason for deletion (1-500 characters)
 */
const deleteUserSchema = z.object({
  user_id: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

/**
 * Handles user management actions including suspension and deletion.
 *
 * Supports two HTTP methods:
 * - POST: Suspends a user by banning them for 100 years (effectively permanent)
 * - DELETE: Permanently deletes a user and all associated data
 *
 * All actions are logged to the admin audit log with the reason provided.
 * Requires admin authentication.
 *
 * @param request - The incoming action request with JSON body
 * @returns JSON response indicating success or error
 * @throws {Response} 401 Unauthorized if user is not authenticated
 * @throws {Response} 403 Forbidden if user is not an admin
 * @throws {Response} 400 Bad Request if request body validation fails
 * @throws {Response} 405 Method Not Allowed if HTTP method is not POST or DELETE
 *
 * @example
 * ```typescript
 * // POST /api/admin/users - Suspend user
 * {
 *   user_id: "user-uuid",
 *   reason: "Violation of terms of service"
 * }
 * // Response: { success: true, message: "User suspended successfully" }
 *
 * // DELETE /api/admin/users - Delete user
 * {
 *   user_id: "user-uuid",
 *   reason: "User requested account deletion"
 * }
 * // Response: { success: true, message: "User deleted successfully" }
 * ```
 */
export async function action({ request }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const body = await request.json();

    // POST: Suspend user (ban from platform)
    if (request.method === "POST") {
      const { success, data: validData, error } = suspendUserSchema.safeParse(body);

      if (!success) {
        return data(
          { error: "Invalid request", details: error.flatten().fieldErrors },
          { status: 400, headers }
        );
      }

      // Use admin client to ban user
      const adminClient = makeServerAdminClient();

      const { error: banError } = await adminClient.auth.admin.updateUserById(
        validData.user_id,
        { ban_duration: "876000h" } // Ban for 100 years (effectively permanent)
      );

      if (banError) {
        throw banError;
      }

      // Log action
      await logAdminAction(
        user.id,
        "user_suspend",
        "user",
        validData.user_id,
        { reason: validData.reason }
      );

      return data(
        {
          success: true,
          message: "User suspended successfully",
        },
        { headers }
      );
    }

    // DELETE: Permanently delete user
    if (request.method === "DELETE") {
      const { success, data: validData, error } = deleteUserSchema.safeParse(body);

      if (!success) {
        return data(
          { error: "Invalid request", details: error.flatten().fieldErrors },
          { status: 400, headers }
        );
      }

      // Use admin client to delete user
      const adminClient = makeServerAdminClient();

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(
        validData.user_id
      );

      if (deleteError) {
        throw deleteError;
      }

      // Log action
      await logAdminAction(
        user.id,
        "user_delete",
        "user",
        validData.user_id,
        { reason: validData.reason }
      );

      return data(
        {
          success: true,
          message: "User deleted successfully",
        },
        { headers }
      );
    }

    return data({ error: "Method not allowed" }, { status: 405, headers });
  } catch (err) {
    console.error("Error in admin users management:", err);
    return data({ error: "Failed to process request" }, { status: 500, headers });
  }
}
