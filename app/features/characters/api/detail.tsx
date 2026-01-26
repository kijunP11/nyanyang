/**
 * Character Detail API Endpoint
 *
 * This file implements an API endpoint for fetching a single character's detailed information.
 *
 * Key features:
 * - Fetch character by ID
 * - Check if current user has liked the character
 * - Increment view count
 * - Return full character details
 */

import type { Route } from "./+types/detail";

import { and, eq } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { characterLikes, characters } from "../schema";

/**
 * Path parameter validation schema
 */
const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * Loader function for fetching character details
 *
 * This function:
 * 1. Validates authentication
 * 2. Validates character ID parameter
 * 3. Fetches character details
 * 4. Checks if user has liked the character
 * 5. Increments view count (async, fire-and-forget)
 * 6. Returns complete character information
 *
 * @param {Route.LoaderArgs} args - The loader arguments
 * @param {Request} args.request - The incoming HTTP request
 * @param {Record<string, string>} args.params - Route parameters containing character ID
 * @returns {Promise<Response>} JSON response with character details including isLiked flag
 * @throws {Response} 400 - If character ID parameter is invalid
 * @throws {Response} 401 - If user is not authenticated
 * @throws {Response} 404 - If character not found or not accessible
 * @throws {Response} 500 - If database query fails
 *
 * @example
 * // Fetch character details by ID
 * GET /api/characters/detail/123
 *
 * // Response:
 * {
 *   "character": {
 *     "character_id": 123,
 *     "name": "warrior",
 *     "display_name": "Brave Warrior",
 *     "description": "...",
 *     "isLiked": true,
 *     ...
 *   }
 * }
 */
export async function loader({ request, params }: Route.LoaderArgs) {
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

  // Validate character ID
  const { success, data: validParams } = paramsSchema.safeParse(params);
  if (!success) {
    return data({ error: "Invalid character ID" }, { status: 400, headers });
  }

  try {
    const db = drizzle;

    // Fetch character details
    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.character_id, validParams.id))
      .limit(1);

    if (!character) {
      return data({ error: "Character not found" }, { status: 404, headers });
    }

    // Check if character is accessible (public + approved OR owned by user)
    const isAccessible =
      (character.is_public && character.status === "approved") ||
      character.creator_id === user.id;

    if (!isAccessible) {
      return data({ error: "Character not found" }, { status: 404, headers });
    }

    // Check if user has liked this character
    const [like] = await db
      .select()
      .from(characterLikes)
      .where(
        and(
          eq(characterLikes.character_id, validParams.id),
          eq(characterLikes.user_id, user.id)
        )
      )
      .limit(1);

    const isLiked = !!like;

    // Increment view count (fire and forget, don't await)
    db.update(characters)
      .set({ view_count: character.view_count + 1 })
      .where(eq(characters.character_id, validParams.id))
      .execute()
      .catch((err) => console.error("Failed to increment view count:", err));

    return data(
      {
        character: {
          ...character,
          isLiked,
        },
      },
      { headers }
    );
  } catch (err) {
    console.error("Error fetching character details:", err);
    return data({ error: "Failed to fetch character" }, { status: 500, headers });
  }
}
