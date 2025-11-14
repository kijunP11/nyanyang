/**
 * Character Queries
 *
 * Database query functions for retrieving character data.
 */
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "~/core/db/drizzle-client.server";

import {
  characterKeywords,
  characterLikes,
  characters,
  characterSafetyFilters,
} from "./schema";

/**
 * Get all public approved characters
 */
export async function getPublicCharacters(params?: {
  limit?: number;
  offset?: number;
  search?: string;
  tags?: string[];
  sortBy?: "popular" | "newest" | "most_chatted";
}) {
  const {
    limit = 20,
    offset = 0,
    search,
    tags,
    sortBy = "popular",
  } = params || {};

  let query = db
    .select()
    .from(characters)
    .where(and(eq(characters.is_public, true), eq(characters.status, "approved")))
    .limit(limit)
    .offset(offset);

  // Apply search filter
  if (search) {
    query = query.where(
      or(
        ilike(characters.name, `%${search}%`),
        ilike(characters.description, `%${search}%`),
      ),
    );
  }

  // Apply tag filter
  if (tags && tags.length > 0) {
    query = query.where(sql`${characters.tags} && ${tags}`);
  }

  // Apply sorting
  if (sortBy === "popular") {
    query = query.orderBy(desc(characters.like_count));
  } else if (sortBy === "newest") {
    query = query.orderBy(desc(characters.created_at));
  } else if (sortBy === "most_chatted") {
    query = query.orderBy(desc(characters.chat_count));
  }

  return query;
}

/**
 * Get a single character by ID
 */
export async function getCharacterById(characterId: string) {
  const [character] = await db
    .select()
    .from(characters)
    .where(eq(characters.character_id, characterId))
    .limit(1);

  return character;
}

/**
 * Get character with all related data (keywords, filters)
 */
export async function getCharacterWithDetails(characterId: string) {
  const character = await getCharacterById(characterId);

  if (!character) {
    return null;
  }

  const [keywords, filters, likeCount] = await Promise.all([
    db
      .select()
      .from(characterKeywords)
      .where(
        and(
          eq(characterKeywords.character_id, characterId),
          eq(characterKeywords.is_active, true),
        ),
      )
      .orderBy(desc(characterKeywords.priority)),
    db
      .select()
      .from(characterSafetyFilters)
      .where(eq(characterSafetyFilters.character_id, characterId))
      .limit(1),
    db
      .select({ count: sql<number>`count(*)` })
      .from(characterLikes)
      .where(eq(characterLikes.character_id, characterId)),
  ]);

  return {
    ...character,
    keywords: keywords || [],
    safetyFilter: filters[0] || null,
    likeCount: Number(likeCount[0]?.count || 0),
  };
}

/**
 * Get characters created by a specific user
 */
export async function getCharactersByCreator(creatorId: string) {
  return db
    .select()
    .from(characters)
    .where(eq(characters.creator_id, creatorId))
    .orderBy(desc(characters.created_at));
}

/**
 * Check if user has liked a character
 */
export async function hasUserLikedCharacter(
  userId: string,
  characterId: string,
) {
  const [like] = await db
    .select()
    .from(characterLikes)
    .where(
      and(
        eq(characterLikes.user_id, userId),
        eq(characterLikes.character_id, characterId),
      ),
    )
    .limit(1);

  return !!like;
}

/**
 * Get trending characters (based on recent activity)
 */
export async function getTrendingCharacters(limit = 10) {
  return db
    .select()
    .from(characters)
    .where(and(eq(characters.is_public, true), eq(characters.status, "approved")))
    .orderBy(desc(characters.view_count))
    .limit(limit);
}

/**
 * Search characters by name or description
 */
export async function searchCharacters(searchTerm: string, limit = 20) {
  return db
    .select()
    .from(characters)
    .where(
      and(
        eq(characters.is_public, true),
        eq(characters.status, "approved"),
        or(
          ilike(characters.name, `%${searchTerm}%`),
          ilike(characters.description, `%${searchTerm}%`),
        ),
      ),
    )
    .limit(limit);
}

/**
 * Get character keywords
 */
export async function getCharacterKeywords(characterId: string) {
  return db
    .select()
    .from(characterKeywords)
    .where(
      and(
        eq(characterKeywords.character_id, characterId),
        eq(characterKeywords.is_active, true),
      ),
    )
    .orderBy(desc(characterKeywords.priority));
}

/**
 * Get character safety filter
 */
export async function getCharacterSafetyFilter(characterId: string) {
  const [filter] = await db
    .select()
    .from(characterSafetyFilters)
    .where(eq(characterSafetyFilters.character_id, characterId))
    .limit(1);

  return filter;
}
