/**
 * Admin Guards Module
 *
 * Provides authentication and authorization middleware functions to protect admin-only routes.
 * This module handles admin role verification, super admin checks, and audit logging for
 * administrative actions across the platform.
 *
 * @module features/admin/lib/guards.server
 */

import { eq } from "drizzle-orm";
import type { SupabaseClient } from "@supabase/supabase-js";

import drizzle from "~/core/db/drizzle-client.server";

import { admins } from "../schema";

/**
 * Verifies that the current user has admin privileges.
 *
 * Checks if the authenticated user exists in the admins table. If the user is not
 * authenticated or not an admin, throws an appropriate HTTP error response.
 *
 * @param client - Supabase client instance with user session
 * @returns Promise that resolves if user is an admin
 * @throws {Response} 401 Unauthorized if user is not authenticated
 * @throws {Response} 403 Forbidden if user is authenticated but not an admin
 *
 * @example
 * ```typescript
 * export async function loader({ request }: Route.LoaderArgs) {
 *   const [client, headers] = makeServerClient(request);
 *   await requireAdmin(client);
 *   // Continue with admin-only logic
 * }
 * ```
 */
export async function requireAdmin(client: SupabaseClient): Promise<void> {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const db = drizzle;

  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.user_id, user.id))
    .limit(1);

  if (!admin) {
    throw new Response("Forbidden: Admin access required", { status: 403 });
  }
}

/**
 * Verifies that the current user has super admin privileges.
 *
 * Checks if the authenticated user exists in the admins table with the role of "super_admin".
 * Super admins have elevated permissions for platform-wide administrative operations.
 *
 * @param client - Supabase client instance with user session
 * @returns Promise that resolves if user is a super admin
 * @throws {Response} 401 Unauthorized if user is not authenticated
 * @throws {Response} 403 Forbidden if user is not a super admin
 *
 * @example
 * ```typescript
 * export async function action({ request }: Route.ActionArgs) {
 *   const [client, headers] = makeServerClient(request);
 *   await requireSuperAdmin(client);
 *   // Continue with super-admin-only logic
 * }
 * ```
 */
export async function requireSuperAdmin(client: SupabaseClient): Promise<void> {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const db = drizzle;

  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.user_id, user.id))
    .limit(1);

  if (!admin || admin.role !== "super_admin") {
    throw new Response("Forbidden: Super admin access required", { status: 403 });
  }
}

/**
 * Retrieves admin information for a specific user.
 *
 * Queries the admins table to fetch the admin record associated with the given user ID.
 * Returns undefined if the user is not an admin.
 *
 * @param userId - UUID of the user to look up
 * @returns Promise resolving to admin record or undefined if not found
 *
 * @example
 * ```typescript
 * const adminInfo = await getAdminInfo(user.id);
 * if (adminInfo?.role === "super_admin") {
 *   // Show super admin features
 * }
 * ```
 */
export async function getAdminInfo(userId: string) {
  const db = drizzle;

  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.user_id, userId))
    .limit(1);

  return admin;
}

/**
 * Records an administrative action in the audit log.
 *
 * Creates an entry in the admin action logs table for tracking and auditing purposes.
 * This helps maintain a complete history of all administrative operations performed
 * on the platform.
 *
 * @param adminId - UUID of the admin performing the action
 * @param actionType - Type of action (e.g., "user_suspend", "character_approve")
 * @param targetType - Optional type of target entity (e.g., "user", "character")
 * @param targetId - Optional ID of the target entity being acted upon
 * @param details - Optional additional details about the action (will be JSON stringified)
 * @returns Promise that resolves when the log entry is created
 *
 * @example
 * ```typescript
 * await logAdminAction(
 *   adminUser.id,
 *   "user_suspend",
 *   "user",
 *   targetUserId,
 *   { reason: "Violation of terms of service" }
 * );
 * ```
 */
export async function logAdminAction(
  adminId: string,
  actionType: string,
  targetType?: string,
  targetId?: string,
  details?: any
): Promise<void> {
  const db = drizzle;
  const { adminActionLogs } = await import("../schema");

  await db.insert(adminActionLogs).values({
    admin_id: adminId,
    action_type: actionType,
    target_type: targetType || null,
    target_id: targetId || null,
    details: details ? JSON.stringify(details) : null,
  });
}
