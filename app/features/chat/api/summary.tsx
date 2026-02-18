/**
 * Summary API
 * POST: 수동 요약 생성
 * GET: 룸의 요약 목록
 */
import { data } from "react-router";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import makeServerClient from "~/core/lib/supa-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import { createConversationSummary, getRoomMemories } from "../lib/memory-manager.server";
import drizzle from "~/core/db/drizzle-client.server";
import { chatRooms } from "../schema";

export async function action({ request }: { request: Request }) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  const formData = await request.formData();
  const roomIdRaw = formData.get("room_id");
  if (roomIdRaw == null || roomIdRaw === "") {
    return data({ error: "room_id required" }, { status: 400, headers });
  }
  const body = z
    .object({
      room_id: z.coerce.number(),
      character_name: z.string().optional(),
    })
    .parse({
      room_id: roomIdRaw,
      character_name: formData.get("character_name") || undefined,
    });

  const [room] = await drizzle
    .select({ room_id: chatRooms.room_id })
    .from(chatRooms)
    .where(
      and(
        eq(chatRooms.room_id, body.room_id),
        eq(chatRooms.user_id, user.id)
      )
    )
    .limit(1);

  if (!room) {
    return data({ error: "Room not found" }, { status: 404, headers });
  }

  try {
    await createConversationSummary(body.room_id, body.character_name ?? "캐릭터");
    return data({ success: true }, { headers });
  } catch (error) {
    console.error("Summary creation failed:", error);
    return data(
      { success: false, error: "요약 생성에 실패했습니다." },
      { status: 500, headers }
    );
  }
}

export async function loader({ request }: { request: Request }) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  const url = new URL(request.url);
  const roomId = parseInt(url.searchParams.get("room_id") ?? "0");
  if (!roomId) {
    return data({ error: "room_id required" }, { status: 400, headers });
  }

  const [room] = await drizzle
    .select({ room_id: chatRooms.room_id })
    .from(chatRooms)
    .where(
      and(eq(chatRooms.room_id, roomId), eq(chatRooms.user_id, user.id))
    )
    .limit(1);

  if (!room) {
    return data({ error: "Room not found" }, { status: 404, headers });
  }

  const memories = await getRoomMemories(roomId);
  const summaries = memories.filter((m) => m.memory_type === "summary");

  return data(
    {
      summaries: summaries.map((s) => ({
        content: s.content,
        message_range_start: s.message_range_start,
        message_range_end: s.message_range_end,
        created_at: s.created_at,
        memory_id: s.memory_id,
      })),
    },
    { headers }
  );
}
