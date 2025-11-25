/**
 * Update Character API
 *
 * Handles character updates with validation and ownership checks using Supabase Client
 */
import type { Route } from "./+types/update-character";

import { data } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

const updateCharacterSchema = z.object({
  character_id: z.number(),
  name: z.string().min(1).max(50).optional(),
  display_name: z.string().max(50).optional(),
  description: z.string().optional(),
  personality: z.string().optional(),
  system_prompt: z.string().optional(),
  greeting_message: z.string().optional(),
  avatar_url: z.string().url().optional().nullable(),
  banner_url: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional().nullable(),
  age_rating: z.string().optional(),
  is_public: z.boolean().optional(),
  is_nsfw: z.boolean().optional(),
  enable_memory: z.boolean().optional(),
  example_dialogues: z.any().optional().nullable(),
  status: z
    .enum(["draft", "pending_review", "approved", "rejected", "archived"])
    .optional(),
});

export async function action({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);

  if (request.method !== "PUT" && request.method !== "PATCH") {
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
    const result = updateCharacterSchema.safeParse(formData);

    if (!result.success) {
      return data(
        {
          error: "유효성 검사 실패",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { character_id, ...updateData } = result.data;

    // 소유권 확인 및 업데이트 (한 번의 쿼리로)
    const { data: updatedCharacter, error } = await client
      .from("characters")
      .update(updateData)
      .eq("character_id", character_id)
      .eq("creator_id", user.id) // 소유자만 수정 가능
      .select()
      .single();

    if (error) {
      // 레코드를 찾지 못한 경우
      if (error.code === "PGRST116") {
        return data(
          { error: "캐릭터를 찾을 수 없거나 권한이 없습니다" },
          { status: 404 },
        );
      }
      console.error("Update character error:", error);
      return data({ error: error.message }, { status: 500 });
    }

    return data({
      success: true,
      character: updatedCharacter,
      message: "캐릭터가 성공적으로 업데이트되었습니다",
    });
  } catch (error) {
    console.error("Update character error:", error);
    return data(
      {
        error: "캐릭터 업데이트 중 오류가 발생했습니다",
      },
      { status: 500 },
    );
  }
}
