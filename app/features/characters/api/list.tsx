/**
 * Character List API Endpoint
 *
 * This file implements an API endpoint for fetching, searching, filtering, and sorting characters.
 *
 * Key features:
 * - Search by name and tags
 * - Filter by category and age_rating
 * - Sort by popularity (like_count) or recent (created_at)
 * - Pagination support
 * - Returns only approved and public characters (RLS enforced)
 */

import type { Route } from "./+types/list";

import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { characters } from "../schema";

/**
 * Query parameter validation schema
 *
 * Defines validation rules for search, filter, and pagination parameters:
 * - search: Optional string for searching by name
 * - category: Optional category filter
 * - age_rating: Optional age rating filter
 * - sort: Sort order (popularity or recent)
 * - limit: Number of results per page (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 */
const querySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  age_rating: z.string().optional(),
  sort: z.enum(["popularity", "recent"]).optional().default("popularity"),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

/**
 * Loader function for fetching characters
 *
 * This function handles the complete character list flow:
 * 1. Validates authentication
 * 2. Parses and validates query parameters
 * 3. Builds dynamic query with filters
 * 4. Returns paginated character list
 *
 * @param {Route.LoaderArgs} args - The loader arguments
 * @param {Request} args.request - The incoming HTTP request with query parameters
 * @returns {Promise<Response>} JSON response with character list and pagination metadata
 * @throws {Response} 400 - If query parameters are invalid
 * @throws {Response} 401 - If user is not authenticated
 * @throws {Response} 500 - If database query fails
 *
 * @example
 * // Fetch characters with search and pagination
 * GET /api/characters/list?search=warrior&category=male&sort=popularity&limit=10&offset=0
 *
 * // Response:
 * {
 *   "characters": [...],
 *   "pagination": {
 *     "total": 45,
 *     "limit": 10,
 *     "offset": 0,
 *     "hasMore": true
 *   }
 * }
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Create Supabase client and require authentication
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  // Parse and validate query parameters
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams);
  const { success, data: params, error } = querySchema.safeParse(searchParams);

  if (!success) {
    return data(
      { error: "Invalid query parameters", details: error.flatten().fieldErrors },
      { status: 400, headers }
    );
  }

  try {
    // Build query conditions
    const conditions = [];

    // Only show approved and public characters (RLS also enforces this)
    conditions.push(eq(characters.is_public, true));
    conditions.push(eq(characters.status, "approved"));

    // Search by name or tags
    if (params.search) {
      conditions.push(
        or(
          ilike(characters.name, `%${params.search}%`),
          ilike(characters.display_name, `%${params.search}%`),
          sql`${characters.tags}::text ILIKE ${"%" + params.search + "%"}`
        )
      );
    }

    // Filter by category
    if (params.category) {
      conditions.push(eq(characters.category, params.category));
    }

    // Filter by age rating
    if (params.age_rating) {
      conditions.push(eq(characters.age_rating, params.age_rating));
    }

    // Determine sort order
    const orderBy =
      params.sort === "popularity"
        ? desc(characters.like_count)
        : desc(characters.created_at);

    // Execute query with Drizzle ORM
    const db = drizzle;
    const results = await db
      .select({
        character_id: characters.character_id,
        name: characters.name,
        display_name: characters.display_name,
        description: characters.description,
        avatar_url: characters.avatar_url,
        tags: characters.tags,
        category: characters.category,
        age_rating: characters.age_rating,
        is_nsfw: characters.is_nsfw,
        like_count: characters.like_count,
        chat_count: characters.chat_count,
        view_count: characters.view_count,
        created_at: characters.created_at,
      })
      .from(characters)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(params.limit)
      .offset(params.offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(characters)
      .where(and(...conditions));

    return data(
      {
        characters: results,
        pagination: {
          total: count,
          limit: params.limit,
          offset: params.offset,
          hasMore: params.offset + params.limit < count,
        },
      },
      { headers }
    );
  } catch (err) {
    console.error("Error fetching characters:", err);
    return data({ error: "Failed to fetch characters" }, { status: 500, headers });
  }
}
