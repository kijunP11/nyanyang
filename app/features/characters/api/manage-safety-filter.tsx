/**
 * Manage Character Safety Filter API
 *
 * Handles safety filter configuration for characters using Supabase Client
 */
import type { Route } from "./+types/manage-safety-filter";

import { data } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

const updateSafetyFilterSchema = z.object({
  character_id: z.number(),
  block_nsfw: z.boolean().optional(),
  block_violence: z.boolean().optional(),
  block_hate_speech: z.boolean().optional(),
  block_personal_info: z.boolean().optional(),
  blocked_words: z.array(z.string()).optional().nullable(),
  blocked_phrases: z.array(z.string()).optional().nullable(),
  sensitivity_level: z.number().int().min(1).max(10).optional(),
});

export async function action({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);

  if (request.method !== "POST" && request.method !== "PUT") {
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
    const result = updateSafetyFilterSchema.safeParse(formData);

    if (!result.success) {
      return data(
        {
          error: "유효성 검사 실패",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { character_id, ...filterData } = result.data;

    // 캐릭터 소유권 확인
    const { data: character } = await client
      .from("characters")
      .select("creator_id")
      .eq("character_id", character_id)
      .single();

    if (!character) {
      return data({ error: "캐릭터를 찾을 수 없습니다" }, { status: 404 });
    }

    if (character.creator_id !== user.id) {
      return data({ error: "권한이 없습니다" }, { status: 403 });
    }

    // upsert 패턴: 있으면 업데이트, 없으면 생성
    const { data: filter, error } = await client
      .from("character_safety_filters")
      .upsert(
        {
          character_id,
          ...filterData,
        },
        { onConflict: "character_id" },
      )
      .select()
      .single();

    if (error) {
      console.error("Manage safety filter error:", error);
      return data({ error: error.message }, { status: 500 });
    }

    return data({
      success: true,
      filter,
      message: "안전 필터가 업데이트되었습니다",
    });
  } catch (error) {
    console.error("Manage safety filter error:", error);
    return data(
      {
        error: "안전 필터 관리 중 오류가 발생했습니다",
      },
      { status: 500 },
    );
  }
}
