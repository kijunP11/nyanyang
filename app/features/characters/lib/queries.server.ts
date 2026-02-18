/**
 * Character Queries
 *
 * Shared server-side query functions for character operations.
 * These functions can be used in both API routes and page loaders.
 */

import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";

import { characters } from "../schema";

/**
 * Query parameter validation schema
 */
export const myCharactersQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

/**
 * Get user's own characters
 *
 * @param userId - The user ID
 * @param params - Query parameters (limit, offset)
 * @returns Character list with pagination metadata and latest character
 */
export async function getMyCharacters(
  userId: string,
  params: z.infer<typeof myCharactersQuerySchema>
) {
  const db = drizzle;

  // Get user's characters (all statuses, regardless of public visibility)
  const results = await db
    .select({
      character_id: characters.character_id,
      name: characters.name,
      display_name: characters.display_name,
      description: characters.description,
      avatar_url: characters.avatar_url,
      appearance: characters.appearance,
      status: characters.status,
      is_public: characters.is_public,
      created_at: characters.created_at,
      updated_at: characters.updated_at,
    })
    .from(characters)
    .where(eq(characters.creator_id, userId))
    .orderBy(desc(characters.created_at))
    .limit(params.limit)
    .offset(params.offset);

  // Get total count for pagination
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(characters)
    .where(eq(characters.creator_id, userId));

  // Get the most recent character for profile display
  const [latestCharacter] = await db
    .select({
      character_id: characters.character_id,
      display_name: characters.display_name,
      avatar_url: characters.avatar_url,
    })
    .from(characters)
    .where(eq(characters.creator_id, userId))
    .orderBy(desc(characters.created_at))
    .limit(1);

  return {
    characters: results,
    latestCharacter: latestCharacter || null,
    pagination: {
      total: count,
      limit: params.limit,
      offset: params.offset,
      hasMore: params.offset + params.limit < count,
    },
  };
}

