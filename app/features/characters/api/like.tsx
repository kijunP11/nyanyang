/**
 * Character Like API Endpoint
 *
 * This file implements an API endpoint for liking and unliking characters.
 *
 * Key features:
 * - POST: Add a like to a character
 * - DELETE: Remove a like from a character
 * - Update character's like_count atomically
 * - Prevent duplicate likes (composite PK enforced)
 */

import type { Route } from "./+types/like";

import { and, eq, sql } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { characterLikes, characters } from "../schema";

/**
 * Request body validation schema
 */
const bodySchema = z.object({
  character_id: z.coerce.number().int().positive(),
});

/**
 * Action handler for like/unlike operations
 *
 * This function handles:
 * - POST: Add like and increment like_count atomically
 * - DELETE: Remove like and decrement like_count (with zero-floor protection)
 *
 * The like operation is protected by a composite primary key (user_id, character_id)
 * to prevent duplicate likes. The like_count is updated atomically using SQL expressions.
 *
 * @param {Route.ActionArgs} args - The action arguments
 * @param {Request} args.request - The incoming HTTP request (POST or DELETE)
 * @returns {Promise<Response>} JSON response with success status and liked boolean
 * @throws {Response} 400 - If request body is invalid or user already liked
 * @throws {Response} 401 - If user is not authenticated
 * @throws {Response} 404 - If character not found or like not found (DELETE)
 * @throws {Response} 405 - If HTTP method is not POST or DELETE
 * @throws {Response} 500 - If database operation fails
 *
 * @example
 * // Like a character
 * POST /api/characters/like
 * Body: { "character_id": 123 }
 *
 * // Response:
 * {
 *   "success": true,
 *   "liked": true
 * }
 *
 * @example
 * // Unlike a character
 * DELETE /api/characters/like
 * Body: { "character_id": 123 }
 *
 * // Response:
 * {
 *   "success": true,
 *   "liked": false
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

  // Validate request method (POST or DELETE)
  if (request.method !== "POST" && request.method !== "DELETE") {
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

    // Verify character exists and is accessible
    const [character] = await db
      .select({ character_id: characters.character_id, like_count: characters.like_count })
      .from(characters)
      .where(eq(characters.character_id, validData.character_id))
      .limit(1);

    if (!character) {
      return data({ error: "Character not found" }, { status: 404, headers });
    }

    if (request.method === "POST") {
      // Add like
      try {
        await db.insert(characterLikes).values({
          user_id: user.id,
          character_id: validData.character_id,
        });

        // Increment like count
        await db
          .update(characters)
          .set({ like_count: sql`${characters.like_count} + 1` })
          .where(eq(characters.character_id, validData.character_id));

        return data({ success: true, liked: true }, { headers });
      } catch (err: any) {
        // Handle duplicate like (composite PK violation)
        if (err.code === "23505") {
          return data({ error: "Already liked" }, { status: 400, headers });
        }
        throw err;
      }
    } else {
      // Remove like (DELETE)
      // First check if the like exists
      const [existingLike] = await db
        .select()
        .from(characterLikes)
        .where(
          and(
            eq(characterLikes.user_id, user.id),
            eq(characterLikes.character_id, validData.character_id)
          )
        )
        .limit(1);

      if (!existingLike) {
        return data({ error: "Like not found" }, { status: 404, headers });
      }

      // Delete the like
      await db
        .delete(characterLikes)
        .where(
          and(
            eq(characterLikes.user_id, user.id),
            eq(characterLikes.character_id, validData.character_id)
          )
        );

      // Decrement like count (ensure it doesn't go below 0)
      await db
        .update(characters)
        .set({ like_count: sql`GREATEST(${characters.like_count} - 1, 0)` })
        .where(eq(characters.character_id, validData.character_id));

      return data({ success: true, liked: false }, { headers });
    }
  } catch (err) {
    console.error("Error processing like/unlike:", err);
    return data({ error: "Failed to process request" }, { status: 500, headers });
  }
}
