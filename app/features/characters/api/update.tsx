/**
 * Character Update API Endpoint
 *
 * This file implements an API endpoint for updating existing AI characters.
 *
 * Key features:
 * - PUT: Update an existing character
 * - Only allows creator to update their own characters
 * - Validates all fields with Zod schema
 * - Partial updates supported (only provided fields are updated)
 */

import type { Route } from "./+types/update";

import { and, eq } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { characters } from "../schema";

/**
 * Request body validation schema (all fields optional for partial updates)
 */
const bodySchema = z.object({
  character_id: z.coerce.number().int().positive(),
  name: z.string().min(1).max(50).optional(),
  display_name: z.string().min(1).max(50).optional(),
  description: z.string().min(10).max(500).optional(),
  greeting_message: z.string().min(1).max(500).optional(),
  personality: z.string().min(10).max(1000).optional(),
  system_prompt: z.string().min(10).max(2000).optional(),
  example_dialogues: z.array(z.object({
    user: z.string(),
    assistant: z.string(),
  })).optional(),
  tags: z.array(z.string()).optional(),
  category: z.enum(["male", "female", "other"]).optional(),
  age_rating: z.enum(["general", "teen", "mature", "adult"]).optional(),
  is_public: z.coerce.boolean().optional(),
  is_nsfw: z.coerce.boolean().optional(),
  enable_memory: z.coerce.boolean().optional(),
  avatar_url: z.string().url().nullable().optional(),
  banner_url: z.string().url().nullable().optional(),
});

/**
 * Action handler for updating a character
 *
 * This function handles:
 * - PUT: Validate ownership, validate input, perform partial update
 * - Only the character creator can update their character
 * - Supports partial updates (only provided fields are modified)
 * - Automatically updates the updated_at timestamp
 *
 * @param {Route.ActionArgs} args - The action arguments
 * @param {Request} args.request - The incoming HTTP request (PUT only)
 * @returns {Promise<Response>} JSON response with updated character info
 * @throws {Response} 400 - If request body validation fails or no fields to update
 * @throws {Response} 401 - If user is not authenticated
 * @throws {Response} 403 - If user is not the creator of the character
 * @throws {Response} 404 - If character not found
 * @throws {Response} 405 - If HTTP method is not PUT
 * @throws {Response} 500 - If database update fails
 *
 * @example
 * // Update character's description and tags
 * PUT /api/characters/update
 * Body: {
 *   "character_id": 123,
 *   "description": "Updated description...",
 *   "tags": ["fantasy", "warrior", "hero"]
 * }
 *
 * // Response:
 * {
 *   "success": true,
 *   "character": {
 *     "character_id": 123,
 *     "name": "warrior",
 *     "display_name": "Brave Warrior",
 *     "updated_at": "2025-11-12T10:30:00Z"
 *   }
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

  // Validate request method (PUT only)
  if (request.method !== "PUT") {
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
      return data({ error: "Forbidden: You can only update your own characters" }, { status: 403, headers });
    }

    // Build update object (only include provided fields)
    const updateData: Record<string, any> = {};

    if (validData.name !== undefined) updateData.name = validData.name;
    if (validData.display_name !== undefined) updateData.display_name = validData.display_name;
    if (validData.description !== undefined) updateData.description = validData.description;
    if (validData.greeting_message !== undefined) updateData.greeting_message = validData.greeting_message;
    if (validData.personality !== undefined) updateData.personality = validData.personality;
    if (validData.system_prompt !== undefined) updateData.system_prompt = validData.system_prompt;
    if (validData.example_dialogues !== undefined) updateData.example_dialogues = validData.example_dialogues;
    if (validData.tags !== undefined) updateData.tags = validData.tags;
    if (validData.category !== undefined) updateData.category = validData.category;
    if (validData.age_rating !== undefined) updateData.age_rating = validData.age_rating;
    if (validData.is_public !== undefined) updateData.is_public = validData.is_public;
    if (validData.is_nsfw !== undefined) updateData.is_nsfw = validData.is_nsfw;
    if (validData.enable_memory !== undefined) updateData.enable_memory = validData.enable_memory;
    if (validData.avatar_url !== undefined) updateData.avatar_url = validData.avatar_url;
    if (validData.banner_url !== undefined) updateData.banner_url = validData.banner_url;

    // If nothing to update, return early
    if (Object.keys(updateData).length === 0) {
      return data({ error: "No fields to update" }, { status: 400, headers });
    }

    // Update character
    const [updatedCharacter] = await db
      .update(characters)
      .set(updateData)
      .where(eq(characters.character_id, validData.character_id))
      .returning({
        character_id: characters.character_id,
        name: characters.name,
        display_name: characters.display_name,
        updated_at: characters.updated_at,
      });

    return data(
      {
        success: true,
        character: updatedCharacter,
      },
      { headers }
    );
  } catch (err) {
    console.error("Error updating character:", err);
    return data({ error: "Failed to update character" }, { status: 500, headers });
  }
}
