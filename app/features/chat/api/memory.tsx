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
          room_id: mem.room_id,
          memory_type: mem.memory_type,
          content: mem.content,
          importance: mem.importance,
          message_range_start: mem.message_range_start,
          message_range_end: mem.message_range_end,
          created_at: mem.created_at,
          updated_at: mem.updated_at,
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

const deleteMemorySchema = z.object({
  memory_id: z.coerce.number().int().positive(),
});

const createMemorySchema = z.object({
  roomId: z.coerce.number().int().positive(),
  content: z.string().min(1).max(2000),
  memoryType: z.enum(["summary", "fact", "user_note", "entity", "event"]).optional(),
  importance: z.coerce.number().int().min(1).max(10).optional(),
});

const updateMemorySchema = z.object({
  memoryId: z.coerce.number().int().positive(),
  roomId: z.coerce.number().int().positive(),
  content: z.string().min(1).max(2000),
  memoryType: z.string().optional(),
  importance: z.coerce.number().int().min(1).max(10).optional(),
});

/**
 * Action handler for memory operations: DELETE, POST (create), PUT (update).
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

  const method = request.method;
  if (method !== "DELETE" && method !== "POST" && method !== "PUT") {
    return data({ error: "Method not allowed" }, { status: 405, headers });
  }

  const db = drizzle;

  try {
    if (method === "DELETE") {
      const body = await request.json();
      const parsed = deleteMemorySchema.safeParse(body);
      if (!parsed.success) {
        return data(
          { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
          { status: 400, headers }
        );
      }
      const validData = parsed.data;

      const [memory] = await db
        .select({ memory_id: roomMemories.memory_id, room_id: roomMemories.room_id })
        .from(roomMemories)
        .where(eq(roomMemories.memory_id, validData.memory_id))
        .limit(1);

      if (!memory) {
        return data({ error: "Memory not found" }, { status: 404, headers });
      }

      const [room] = await db
        .select()
        .from(chatRooms)
        .where(eq(chatRooms.room_id, memory.room_id))
        .limit(1);

      if (!room || room.user_id !== user.id) {
        return data({ error: "Forbidden" }, { status: 403, headers });
      }

      await db
        .delete(roomMemories)
        .where(eq(roomMemories.memory_id, validData.memory_id));

      return data({ success: true, message: "Memory deleted successfully" }, { headers });
    }

    if (method === "POST") {
      const body = await request.json();
      const parsed = createMemorySchema.safeParse(body);
      if (!parsed.success) {
        return data(
          { error: "Missing required fields", details: parsed.error.flatten().fieldErrors },
          { status: 400, headers }
        );
      }
      const { roomId, content, memoryType, importance } = parsed.data;

      const [room] = await db
        .select()
        .from(chatRooms)
        .where(eq(chatRooms.room_id, roomId))
        .limit(1);
      if (!room || room.user_id !== user.id) {
        return data({ error: "Forbidden" }, { status: 403, headers });
      }

      const [newMemory] = await db
        .insert(roomMemories)
        .values({
          room_id: roomId,
          memory_type: memoryType ?? "user_note",
          content: content.trim(),
          importance: importance ?? 5,
          metadata: { created_by: "user" },
          created_by: "user",
        })
        .returning();

      return data({ success: true, memory: newMemory }, { headers });
    }

    if (method === "PUT") {
      const body = await request.json();
      const parsed = updateMemorySchema.safeParse(body);
      if (!parsed.success) {
        return data(
          { error: "Missing required fields", details: parsed.error.flatten().fieldErrors },
          { status: 400, headers }
        );
      }
      const { memoryId, content, memoryType, importance } = parsed.data;

      const [memory] = await db
        .select({ memory_id: roomMemories.memory_id, room_id: roomMemories.room_id })
        .from(roomMemories)
        .where(eq(roomMemories.memory_id, memoryId))
        .limit(1);
      if (!memory) {
        return data({ error: "Memory not found" }, { status: 404, headers });
      }

      const [room] = await db
        .select()
        .from(chatRooms)
        .where(eq(chatRooms.room_id, memory.room_id))
        .limit(1);
      if (!room || room.user_id !== user.id) {
        return data({ error: "Forbidden" }, { status: 403, headers });
      }

      const [updated] = await db
        .update(roomMemories)
        .set({
          content: content.trim(),
          memory_type: memoryType ?? "user_note",
          importance: importance ?? 5,
        })
        .where(eq(roomMemories.memory_id, memoryId))
        .returning();

      return data({ success: true, memory: updated }, { headers });
    }
  } catch (err) {
    console.error("Error in memory action:", err);
    return data({ error: "Failed to process request" }, { status: 500, headers });
  }

  return data({ error: "Method not allowed" }, { status: 405, headers });
}

