/**
 * Character Create API Endpoint
 *
 * This file implements an API endpoint for creating new AI characters.
 *
 * Key features:
 * - POST: Create a new character
 * - Validates all required fields with Zod schema
 * - Sets creator_id to current authenticated user
 * - Defaults status to "pending" for moderation
 * - Handles file upload for avatar and banner images
 */

import type { Route } from "./+types/create";

import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { characters } from "../schema";

/**
 * Request body validation schema
 */
const bodySchema = z.object({
  name: z.string().min(1).max(50),
  display_name: z.string().min(1).max(50),
  description: z.string().min(10).max(500),
  greeting_message: z.string().min(1).max(500),
  personality: z.string().min(10).max(1000),
  system_prompt: z.string().min(10).max(2000),
  example_dialogues: z.array(z.object({
    user: z.string(),
    assistant: z.string(),
  })).optional(),
  tags: z.array(z.string()).default([]),
  category: z.enum(["male", "female", "other"]).optional(),
  age_rating: z.enum(["general", "teen", "mature", "adult"]).default("general"),
  is_public: z.coerce.boolean().default(false),
  is_nsfw: z.coerce.boolean().default(false),
  enable_memory: z.coerce.boolean().default(true),
  avatar_url: z.string().url().optional(),
  banner_url: z.string().url().optional(),
});

/**
 * Action handler for creating a new character
 *
 * This function handles:
 * - POST: Validate input, create character, set creator_id to current user
 * - Automatically sets status to "pending" for moderation review
 * - Initializes counters (like_count, chat_count, view_count) to 0
 *
 * @param {Route.ActionArgs} args - The action arguments
 * @param {Request} args.request - The incoming HTTP request (POST only)
 * @returns {Promise<Response>} JSON response with created character basic info
 * @throws {Response} 400 - If request body validation fails
 * @throws {Response} 401 - If user is not authenticated
 * @throws {Response} 405 - If HTTP method is not POST
 * @throws {Response} 500 - If database insert fails
 *
 * @example
 * // Create a new character
 * POST /api/characters/create
 * Body: {
 *   "name": "warrior",
 *   "display_name": "Brave Warrior",
 *   "description": "A brave warrior character...",
 *   "greeting_message": "Hello, I am a warrior!",
 *   "personality": "Brave, strong, honorable...",
 *   "system_prompt": "You are a brave warrior...",
 *   "tags": ["fantasy", "warrior"],
 *   "category": "male",
 *   "age_rating": "general",
 *   "is_public": false,
 *   "is_nsfw": false,
 *   "enable_memory": true
 * }
 *
 * // Response:
 * {
 *   "success": true,
 *   "character": {
 *     "character_id": 123,
 *     "name": "warrior",
 *     "display_name": "Brave Warrior",
 *     "status": "pending"
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

  // Validate request method (POST only)
  if (request.method !== "POST") {
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

    // Create new character
    const [newCharacter] = await db
      .insert(characters)
      .values({
        creator_id: user.id,
        name: validData.name,
        display_name: validData.display_name,
        description: validData.description,
        greeting_message: validData.greeting_message,
        personality: validData.personality,
        system_prompt: validData.system_prompt,
        example_dialogues: validData.example_dialogues || null,
        tags: validData.tags,
        category: validData.category || null,
        age_rating: validData.age_rating,
        is_public: validData.is_public,
        is_nsfw: validData.is_nsfw,
        enable_memory: validData.enable_memory,
        avatar_url: validData.avatar_url || null,
        banner_url: validData.banner_url || null,
        status: "pending_review", // Default to pending_review for moderation
      })
      .returning({
        character_id: characters.character_id,
        name: characters.name,
        display_name: characters.display_name,
        status: characters.status,
      });

    return data(
      {
        success: true,
        character: newCharacter,
      },
      { headers }
    );
  } catch (err) {
    console.error("Error creating character:", err);
    return data({ error: "Failed to create character" }, { status: 500, headers });
  }
}
