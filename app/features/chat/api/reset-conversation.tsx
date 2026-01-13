/**
 * Reset Conversation API
 *
 * 대화를 새로 시작하기 위해 기존 메시지와 메모리를 삭제합니다.
 * - messages: 소프트 삭제 (is_deleted = 1)
 * - room_memories: 하드 삭제
 * - chat_rooms: 메타데이터 초기화
 */
import type { Route } from "./+types/reset-conversation";

import { data } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

const resetConversationSchema = z.object({
  character_id: z.number(),
});

export async function action({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);

  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  // 인증 확인
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.json();
    const result = resetConversationSchema.safeParse(formData);

    if (!result.success) {
      return data(
        {
          error: "유효성 검사 실패",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { character_id } = result.data;

    // 캐릭터 정보 조회
    const { data: character } = await client
      .from("characters")
      .select("character_id, name, greeting_message")
      .eq("character_id", character_id)
      .single();

    if (!character) {
      return data({ error: "캐릭터를 찾을 수 없습니다" }, { status: 404 });
    }

    // 채팅방 조회
    const { data: room } = await client
      .from("chat_rooms")
      .select("room_id")
      .eq("character_id", character_id)
      .eq("user_id", user.id)
      .single();

    // room이 없으면 이미 초기화된 상태로 간주하고 성공 처리
    if (!room) {
      return data({
        success: true,
        message: "대화가 이미 초기화되어 있습니다",
        greeting_message: character.greeting_message,
        character_name: character.name,
      });
    }

    // 삭제 순서: memories → messages → chat_rooms (트랜잭션 대신 순서로 안전성 확보)

    // 1. room_memories 하드 삭제
    const { error: memoriesError } = await client
      .from("room_memories")
      .delete()
      .eq("room_id", room.room_id);

    if (memoriesError) {
      console.error("Failed to delete room_memories:", memoriesError);
      return data(
        { error: "메모리 삭제에 실패했습니다. 다시 시도해주세요." },
        { status: 500 },
      );
    }

    // 2. messages 소프트 삭제 (is_deleted = 1)
    const { error: messagesError } = await client
      .from("messages")
      .update({ is_deleted: 1 })
      .eq("room_id", room.room_id);

    if (messagesError) {
      console.error("Failed to soft delete messages:", messagesError);
      return data(
        { error: "메시지 삭제에 실패했습니다. 다시 시도해주세요." },
        { status: 500 },
      );
    }

    // 3. chat_rooms 메타데이터 초기화
    const { error: roomError } = await client
      .from("chat_rooms")
      .update({
        message_count: 0,
        last_message: null,
        last_message_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("room_id", room.room_id);

    if (roomError) {
      console.error("Failed to reset chat_room metadata:", roomError);
      // 메시지는 이미 삭제됐으므로 경고만 하고 성공 처리
    }

    return data({
      success: true,
      message: "대화가 초기화되었습니다",
      greeting_message: character.greeting_message,
      character_name: character.name,
    });
  } catch (error: any) {
    console.error("Reset conversation error:", error);
    return data(
      { error: error.message || "대화 초기화에 실패했습니다" },
      { status: 500 },
    );
  }
}

