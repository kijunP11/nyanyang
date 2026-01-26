/**
 * Character Delete API Endpoint
 *
 * This file implements an API endpoint for deleting AI characters.
 *
 * Key features:
 * - DELETE: Remove a character
 * - Only allows creator to delete their own characters
 * - Cascades to related data (likes, chat rooms via FK constraints)
 */

import type { Route } from "./+types/delete";

import { and, eq } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication, requireMethod } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { characters } from "../schema";

/**
 * Request body validation schema
 */
const bodySchema = z.object({
  character_id: z.coerce.number().int().positive(),
});

/**
 * Action handler for deleting a character
 *
 * This function handles:
 * - DELETE: Validate ownership, delete character and cascade to related data
 * - Only the character creator can delete their character
 * - Automatically cascades deletion to character_likes and chat_rooms via FK constraints
 *
 * @param {Route.ActionArgs} args - The action arguments
 * @param {Request} args.request - The incoming HTTP request (DELETE only)
 * @returns {Promise<Response>} JSON response indicating successful deletion
 * @throws {Response} 400 - If request body validation fails
 * @throws {Response} 401 - If user is not authenticated
 * @throws {Response} 403 - If user is not the creator of the character
 * @throws {Response} 404 - If character not found
 * @throws {Response} 405 - If HTTP method is not DELETE (via requireMethod guard)
 * @throws {Response} 500 - If database deletion fails
 *
 * @example
 * // Delete a character
 * DELETE /api/characters/delete
 * Body: { "character_id": 123 }
 *
 * // Response:
 * {
 *   "success": true,
 *   "message": "Character deleted successfully"
 * }
 */
export async function action({ request }: Route.ActionArgs) {
  // Validate request method (DELETE only)
  requireMethod("DELETE")(request);

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

    // Verify character exists and user is the creator
    const [character] = await db
      .select({ character_id: characters.character_id, creator_id: characters.creator_id })
      .from(characters)
      .where(eq(characters.character_id, validData.character_id))
      .limit(1);

    if (!character) {
      return data({ error: "Character not found" }, { status: 404, headers });
    }

    // Check ownership
    if (character.creator_id !== user.id) {
      return data({ error: "Forbidden: You can only delete your own characters" }, { status: 403, headers });
    }

    // Delete character (cascades to related data via FK constraints)
    await db
      .delete(characters)
      .where(eq(characters.character_id, validData.character_id));

    return data(
      {
        success: true,
        message: "Character deleted successfully",
      },
      { headers }
    );
  } catch (err) {
    console.error("Error deleting character:", err);
    return data({ error: "Failed to delete character" }, { status: 500, headers });
  }
}
