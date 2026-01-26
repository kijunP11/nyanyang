/**
 * Delete Character API
 *
 * Handles character deletion with ownership checks using Supabase Client
 */
import type { Route } from "./+types/delete-character";

import { data } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

const deleteCharacterSchema = z.object({
  character_id: z.number(),
});

export async function action({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);

  if (request.method !== "DELETE" && request.method !== "POST") {
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
    const result = deleteCharacterSchema.safeParse(formData);

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

    // 삭제 실행 (소유자 확인 포함)
    // CASCADE로 관련 데이터(keywords, safety_filters 등)도 자동 삭제됨
    const { error } = await client
      .from("characters")
      .delete()
      .eq("character_id", character_id)
      .eq("creator_id", user.id); // 소유자만 삭제 가능

    if (error) {
      console.error("Delete character error:", error);
      return data({ error: error.message }, { status: 500 });
    }

    return data({
      success: true,
      message: "캐릭터가 성공적으로 삭제되었습니다",
    });
  } catch (error) {
    console.error("Delete character error:", error);
    return data(
      {
        error: "캐릭터 삭제 중 오류가 발생했습니다",
      },
      { status: 500 },
    );
  }
}
