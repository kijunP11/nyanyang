/**
 * Memory Management API Endpoint
 *
 * Handles memory (conversation summaries) retrieval and deletion.
 *
 * Key features:
 * - GET: Retrieve all memories for a room
 * - DELETE: Delete a specific memory
 */

import type { Route } from "./+types/memory";

import { eq, and } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { chatRooms, roomMemories } from "../schema";
import { getRoomMemories } from "../lib/memory-manager.server";

/**
 * Loader function for fetching room memories
 *
 * @param request - The incoming HTTP request with room_id query parameter
 * @returns JSON response containing memories array
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

  try {
    // Get memories for the room
    const memories = await getRoomMemories(parseInt(roomId));

    return data(
      {
        memories: memories.map((mem) => ({
          memory_id: mem.memory_id,
          memory_type: mem.memory_type,
          content: mem.content,
          importance: mem.importance,
          message_range_start: mem.message_range_start,
          message_range_end: mem.message_range_end,
          created_at: mem.created_at,
          metadata: mem.metadata,
        })),
      },
      { headers }
    );
  } catch (err) {
    console.error("Error fetching memories:", err);
    return data({ error: "Failed to fetch memories" }, { status: 500, headers });
  }
}

/**
 * Delete memory request schema
 */
const deleteMemorySchema = z.object({
  memory_id: z.coerce.number().int().positive(),
});

/**
 * Action handler for memory operations
 *
 * DELETE - Delete a memory:
 * - Body: { memory_id }
 * - Deletes the specified memory
 * - Returns: { success, message }
 *
 * @param request - The incoming HTTP request
 * @returns JSON response with operation result
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

  // Validate request method (DELETE only)
  if (request.method !== "DELETE") {
    return data({ error: "Method not allowed" }, { status: 405, headers });
  }

  try {
    const body = await request.json();
    const { success, data: validData, error } = deleteMemorySchema.safeParse(body);

    if (!success) {
      return data(
        { error: "Invalid request", details: error.flatten().fieldErrors },
        { status: 400, headers }
      );
    }

    const db = drizzle;

    // Verify memory exists and user owns the room
    const [memory] = await db
      .select({
        memory_id: roomMemories.memory_id,
        room_id: roomMemories.room_id,
      })
      .from(roomMemories)
      .where(eq(roomMemories.memory_id, validData.memory_id))
      .limit(1);

    if (!memory) {
      return data({ error: "Memory not found" }, { status: 404, headers });
    }

    // Verify room ownership
    const [room] = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.room_id, memory.room_id))
      .limit(1);

    if (!room || room.user_id !== user.id) {
      return data({ error: "Forbidden" }, { status: 403, headers });
    }

    // Delete memory
    await db
      .delete(roomMemories)
      .where(eq(roomMemories.memory_id, validData.memory_id));

    return data(
      {
        success: true,
        message: "Memory deleted successfully",
      },
      { headers }
    );
  } catch (err) {
    console.error("Error deleting memory:", err);
    return data({ error: "Failed to delete memory" }, { status: 500, headers });
  }
}

