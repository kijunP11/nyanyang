/**
 * Branch Management API
 *
 * Handles message branching and rollback operations.
 *
 * Key features:
 * - GET: Get all branches for a room
 * - POST: Create a new branch from a message
 * - PUT: Switch to a different branch
 * - DELETE: Delete a branch
 */

import type { Route } from "./+types/branch";

import { eq } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { chatRooms } from "../schema";
import {
  getRoomBranches,
  createBranchFromMessage,
  switchBranch,
  deleteBranch,
  getMessageTree,
} from "../lib/branch-manager.server";

/**
 * Loader function for getting branches
 *
 * Handles GET requests to retrieve branch information and message tree for a room.
 * Requires authentication and room ownership verification.
 *
 * Query parameters:
 * - room_id: The chat room ID (required)
 *
 * @param request - The incoming HTTP request with room_id query parameter
 * @returns JSON response containing branches array and tree structure
 * @throws Returns 401 if not authenticated
 * @throws Returns 400 if room_id is missing
 * @throws Returns 403 if user doesn't own the room
 * @throws Returns 404 if room not found
 * @example
 * ```typescript
 * // Client-side usage
 * const response = await fetch('/api/branch?room_id=123');
 * const { branches, tree } = await response.json();
 * console.log(`Found ${branches.length} branches`);
 * ```
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  const url = new URL(request.url);
  const roomId = url.searchParams.get("room_id");

  if (!roomId) {
    return data({ error: "room_id is required" }, { status: 400, headers });
  }

  const db = drizzle;

  // Verify room ownership
  const [room] = await db
    .select()
    .from(chatRooms)
    .where(eq(chatRooms.room_id, parseInt(roomId)))
    .limit(1);

  if (!room) {
    return data({ error: "Room not found" }, { status: 404, headers });
  }

  if (room.user_id !== user.id) {
    return data({ error: "Forbidden" }, { status: 403, headers });
  }

  // Get branches and tree
  const branches = await getRoomBranches(parseInt(roomId));
  const tree = await getMessageTree(parseInt(roomId));

  return data(
    {
      branches,
      tree,
    },
    { headers }
  );
}

/**
 * Create branch request schema
 */
const createBranchSchema = z.object({
  room_id: z.coerce.number().int().positive(),
  parent_message_id: z.coerce.number().int().positive(),
  branch_name: z.string().min(1).max(50).optional(),
});

/**
 * Switch branch request schema
 */
const switchBranchSchema = z.object({
  room_id: z.coerce.number().int().positive(),
  branch_name: z.string().min(1).max(50),
});

/**
 * Delete branch request schema
 */
const deleteBranchSchema = z.object({
  room_id: z.coerce.number().int().positive(),
  branch_name: z.string().min(1).max(50),
});

/**
 * Action handler for branch operations
 *
 * Handles POST, PUT, and DELETE requests for managing conversation branches.
 * All operations require authentication and room ownership verification.
 *
 * POST - Create new branch:
 * - Body: { room_id, parent_message_id, branch_name? }
 * - Creates a new branch from a specific message
 * - Returns: { success, branch_name, message }
 *
 * PUT - Switch branch:
 * - Body: { room_id, branch_name }
 * - Switches active branch to the specified branch
 * - Returns: { success, message }
 *
 * DELETE - Delete branch:
 * - Body: { room_id, branch_name }
 * - Soft deletes all messages in the branch
 * - Cannot delete "main" branch
 * - Returns: { success, message }
 *
 * @param request - The incoming HTTP request with JSON body
 * @returns JSON response with operation result
 * @throws Returns 401 if not authenticated
 * @throws Returns 400 if request is invalid or trying to delete main branch
 * @throws Returns 403 if user doesn't own the room
 * @throws Returns 404 if room not found
 * @throws Returns 405 if method is not POST, PUT, or DELETE
 * @throws Returns 500 if branch operation fails
 * @example
 * ```typescript
 * // Create branch
 * await fetch('/api/branch', {
 *   method: 'POST',
 *   body: JSON.stringify({ room_id: 123, parent_message_id: 456 })
 * });
 *
 * // Switch branch
 * await fetch('/api/branch', {
 *   method: 'PUT',
 *   body: JSON.stringify({ room_id: 123, branch_name: 'branch-1' })
 * });
 *
 * // Delete branch
 * await fetch('/api/branch', {
 *   method: 'DELETE',
 *   body: JSON.stringify({ room_id: 123, branch_name: 'branch-1' })
 * });
 * ```
 */
export async function action({ request }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  const db = drizzle;

  try {
    const body = await request.json();

    // POST: Create new branch
    if (request.method === "POST") {
      const { success, data: validData, error } = createBranchSchema.safeParse(body);

      if (!success) {
        return data(
          { error: "Invalid request", details: error.flatten().fieldErrors },
          { status: 400, headers }
        );
      }

      // Verify room ownership
      const [room] = await db
        .select()
        .from(chatRooms)
        .where(eq(chatRooms.room_id, validData.room_id))
        .limit(1);

      if (!room) {
        return data({ error: "Room not found" }, { status: 404, headers });
      }

      if (room.user_id !== user.id) {
        return data({ error: "Forbidden" }, { status: 403, headers });
      }

      // Create branch
      const branchName = await createBranchFromMessage(
        validData.room_id,
        validData.parent_message_id,
        validData.branch_name
      );

      return data(
        {
          success: true,
          branch_name: branchName,
          message: "Branch created successfully",
        },
        { headers }
      );
    }

    // PUT: Switch branch
    if (request.method === "PUT") {
      const { success, data: validData, error } = switchBranchSchema.safeParse(body);

      if (!success) {
        return data(
          { error: "Invalid request", details: error.flatten().fieldErrors },
          { status: 400, headers }
        );
      }

      // Verify room ownership
      const [room] = await db
        .select()
        .from(chatRooms)
        .where(eq(chatRooms.room_id, validData.room_id))
        .limit(1);

      if (!room) {
        return data({ error: "Room not found" }, { status: 404, headers });
      }

      if (room.user_id !== user.id) {
        return data({ error: "Forbidden" }, { status: 403, headers });
      }

      // Switch branch
      await switchBranch(validData.room_id, validData.branch_name);

      return data(
        {
          success: true,
          message: "Branch switched successfully",
        },
        { headers }
      );
    }

    // DELETE: Delete branch
    if (request.method === "DELETE") {
      const { success, data: validData, error } = deleteBranchSchema.safeParse(body);

      if (!success) {
        return data(
          { error: "Invalid request", details: error.flatten().fieldErrors },
          { status: 400, headers }
        );
      }

      // Cannot delete main branch
      if (validData.branch_name === "main") {
        return data(
          { error: "Cannot delete main branch" },
          { status: 400, headers }
        );
      }

      // Verify room ownership
      const [room] = await db
        .select()
        .from(chatRooms)
        .where(eq(chatRooms.room_id, validData.room_id))
        .limit(1);

      if (!room) {
        return data({ error: "Room not found" }, { status: 404, headers });
      }

      if (room.user_id !== user.id) {
        return data({ error: "Forbidden" }, { status: 403, headers });
      }

      // Delete branch
      await deleteBranch(validData.room_id, validData.branch_name);

      return data(
        {
          success: true,
          message: "Branch deleted successfully",
        },
        { headers }
      );
    }

    return data({ error: "Method not allowed" }, { status: 405, headers });
  } catch (err) {
    console.error("Error in branch operation:", err);
    return data({ error: "Failed to process branch operation" }, { status: 500, headers });
  }
}
