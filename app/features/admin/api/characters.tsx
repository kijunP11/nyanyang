/**
 * Admin Characters Management API
 *
 * Provides API endpoints for character content moderation including approval,
 * rejection, and deletion of user-created characters. All operations require
 * admin authentication and are logged for audit purposes. Supports filtering
 * by moderation status (pending, approved, rejected).
 *
 * @module features/admin/api/characters
 */

import type { Route } from "./+types/characters";

import { eq, like, or, desc, sql } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { characters } from "../../characters/schema";
import { profiles } from "../../users/schema";
import { requireAdmin, logAdminAction } from "../lib/guards.server";

/**
 * Fetches a paginated list of characters filtered by moderation status.
 *
 * Returns characters with their creator information, engagement metrics (chat count,
 * likes, views), and moderation details. Supports filtering by status (pending,
 * approved, rejected) and pagination. Requires admin authentication.
 *
 * @param request - The incoming request object containing URL parameters
 * @returns JSON response with characters list, pagination, and current status filter
 * @throws {Response} 401 Unauthorized if user is not authenticated
 * @throws {Response} 403 Forbidden if user is not an admin
 *
 * @example
 * ```typescript
 * // GET /api/admin/characters?status=pending&offset=0&limit=20
 * {
 *   characters: [{
 *     character_id: 123,
 *     name: "character-slug",
 *     display_name: "Character Name",
 *     status: "pending",
 *     creator: { user_id: "uuid", display_name: "Creator" },
 *     chat_count: 50,
 *     like_count: 10
 *   }],
 *   pagination: { offset: 0, limit: 20, total: 5, hasMore: false },
 *   status: "pending"
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
  const status = url.searchParams.get("status") || "pending"; // pending, approved, rejected
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const db = drizzle;

  // Get all characters with the query
  const allCharacters = await db
    .select()
    .from(characters)
    .innerJoin(profiles, eq(characters.creator_id, profiles.profile_id))
    .where(eq(characters.status, status))
    .orderBy(desc(characters.created_at))
    .limit(limit)
    .offset(offset);

  // Map to response format
  const charactersList = allCharacters.map((row) => ({
    character_id: (row.characters as any).character_id,
    name: row.characters.name,
    display_name: row.characters.display_name,
    description: row.characters.description,
    avatar_url: row.characters.avatar_url,
    category: row.characters.category,
    is_public: row.characters.is_public,
    is_nsfw: row.characters.is_nsfw,
    status: row.characters.status,
    moderation_note: row.characters.moderation_note,
    chat_count: row.characters.chat_count,
    message_count: row.characters.message_count,
    view_count: row.characters.view_count,
    like_count: row.characters.like_count,
    created_at: row.characters.created_at,
    updated_at: row.characters.updated_at,
    creator: {
      user_id: row.profiles.profile_id,
      display_name: row.profiles.name,
    },
  }));

  // Get total count for status
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(characters)
    .where(eq(characters.status, status));

  return data(
    {
      characters: charactersList,
      pagination: {
        offset,
        limit,
        total: countResult.count,
        hasMore: offset + limit < countResult.count,
      },
      status,
    },
    { headers }
  );
}

/**
 * Zod schema for validating character approval requests.
 *
 * @property character_id - Positive integer ID of the character to approve
 * @property moderation_note - Optional note explaining approval (for internal records)
 */
const approveCharacterSchema = z.object({
  character_id: z.coerce.number().int().positive(),
  moderation_note: z.string().optional(),
});

/**
 * Zod schema for validating character rejection requests.
 *
 * @property character_id - Positive integer ID of the character to reject
 * @property moderation_note - Required note explaining rejection (1-500 characters, shown to creator)
 */
const rejectCharacterSchema = z.object({
  character_id: z.coerce.number().int().positive(),
  moderation_note: z.string().min(1).max(500),
});

/**
 * Zod schema for validating character deletion requests.
 *
 * @property character_id - Positive integer ID of the character to delete
 * @property reason - Reason for deletion (1-500 characters)
 */
const deleteCharacterSchema = z.object({
  character_id: z.coerce.number().int().positive(),
  reason: z.string().min(1).max(500),
});

/**
 * Handles character moderation actions including approval, rejection, and deletion.
 *
 * Supports three HTTP methods:
 * - POST: Approves a character, changing status from pending to approved
 * - PUT: Rejects a character with a required moderation note
 * - DELETE: Permanently deletes a character and all associated data (cascade)
 *
 * All actions are logged to the admin audit log with relevant details.
 * Requires admin authentication.
 *
 * @param request - The incoming action request with JSON body
 * @returns JSON response indicating success or error
 * @throws {Response} 401 Unauthorized if user is not authenticated
 * @throws {Response} 403 Forbidden if user is not an admin
 * @throws {Response} 400 Bad Request if request body validation fails
 * @throws {Response} 404 Not Found if character does not exist
 * @throws {Response} 405 Method Not Allowed if HTTP method is not POST, PUT, or DELETE
 *
 * @example
 * ```typescript
 * // POST /api/admin/characters - Approve character
 * {
 *   character_id: 123,
 *   moderation_note: "Quality character, approved for platform"
 * }
 * // Response: { success: true, message: "Character approved successfully", character: {...} }
 *
 * // PUT /api/admin/characters - Reject character
 * {
 *   character_id: 123,
 *   moderation_note: "Contains inappropriate content"
 * }
 * // Response: { success: true, message: "Character rejected successfully", character: {...} }
 *
 * // DELETE /api/admin/characters - Delete character
 * {
 *   character_id: 123,
 *   reason: "Copyright violation"
 * }
 * // Response: { success: true, message: "Character deleted successfully" }
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
    const db = drizzle;

    // POST: Approve character (change status from pending to approved)
    if (request.method === "POST") {
      const { success, data: validData, error } = approveCharacterSchema.safeParse(body);

      if (!success) {
        return data(
          { error: "Invalid request", details: error.flatten().fieldErrors },
          { status: 400, headers }
        );
      }

      // Update character status to approved
      const [updatedCharacter] = await db
        .update(characters)
        .set({
          status: "approved",
          moderation_note: validData.moderation_note || null,
          updated_at: new Date(),
        })
        .where(sql`${characters}.character_id = ${validData.character_id}`)
        .returning();

      if (!updatedCharacter) {
        return data({ error: "Character not found" }, { status: 404, headers });
      }

      // Log action
      await logAdminAction(
        user.id,
        "character_approve",
        "character",
        validData.character_id.toString(),
        { moderation_note: validData.moderation_note }
      );

      return data(
        {
          success: true,
          message: "Character approved successfully",
          character: updatedCharacter,
        },
        { headers }
      );
    }

    // PUT: Reject character (change status to rejected)
    if (request.method === "PUT") {
      const { success, data: validData, error } = rejectCharacterSchema.safeParse(body);

      if (!success) {
        return data(
          { error: "Invalid request", details: error.flatten().fieldErrors },
          { status: 400, headers }
        );
      }

      // Update character status to rejected
      const [updatedCharacter] = await db
        .update(characters)
        .set({
          status: "rejected",
          moderation_note: validData.moderation_note,
          updated_at: new Date(),
        })
        .where(sql`${characters}.character_id = ${validData.character_id}`)
        .returning();

      if (!updatedCharacter) {
        return data({ error: "Character not found" }, { status: 404, headers });
      }

      // Log action
      await logAdminAction(
        user.id,
        "character_reject",
        "character",
        validData.character_id.toString(),
        { moderation_note: validData.moderation_note }
      );

      return data(
        {
          success: true,
          message: "Character rejected successfully",
          character: updatedCharacter,
        },
        { headers }
      );
    }

    // DELETE: Permanently delete character
    if (request.method === "DELETE") {
      const { success, data: validData, error } = deleteCharacterSchema.safeParse(body);

      if (!success) {
        return data(
          { error: "Invalid request", details: error.flatten().fieldErrors },
          { status: 400, headers }
        );
      }

      // Get character info before deleting
      const [characterToDelete] = await db
        .select()
        .from(characters)
        .where(sql`${characters}.character_id = ${validData.character_id}`)
        .limit(1);

      if (!characterToDelete) {
        return data({ error: "Character not found" }, { status: 404, headers });
      }

      // Delete character (cascade will delete related data)
      await db
        .delete(characters)
        .where(sql`${characters}.character_id = ${validData.character_id}`);

      // Log action
      await logAdminAction(
        user.id,
        "character_delete",
        "character",
        validData.character_id.toString(),
        {
          reason: validData.reason,
          character_name: characterToDelete.display_name,
          creator_id: characterToDelete.creator_id,
        }
      );

      return data(
        {
          success: true,
          message: "Character deleted successfully",
        },
        { headers }
      );
    }

    return data({ error: "Method not allowed" }, { status: 405, headers });
  } catch (err) {
    console.error("Error in admin characters management:", err);
    return data({ error: "Failed to process request" }, { status: 500, headers });
  }
}
