/**
 * Delete Character API
 *
 * Handles character deletion with ownership checks
 */
import type { ActionFunctionArgs } from "react-router";

import { data } from "react-router";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { requireUser } from "~/core/lib/guards.server";
import { db } from "~/core/db/drizzle-client.server";

import { characters } from "../schema";

const deleteCharacterSchema = z.object({
  character_id: z.string().uuid(),
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  if (request.method !== "DELETE") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.json();
    const { character_id } = deleteCharacterSchema.parse(formData);

    // Check ownership
    const [existingCharacter] = await db
      .select()
      .from(characters)
      .where(eq(characters.character_id, character_id))
      .limit(1);

    if (!existingCharacter) {
      return data({ error: "캐릭터를 찾을 수 없습니다" }, { status: 404 });
    }

    if (existingCharacter.creator_id !== user.id) {
      return data({ error: "권한이 없습니다" }, { status: 403 });
    }

    // Delete character (cascades to related data)
    await db
      .delete(characters)
      .where(eq(characters.character_id, character_id));

    return data({
      success: true,
      message: "캐릭터가 성공적으로 삭제되었습니다",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return data(
        {
          error: "유효성 검사 실패",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    console.error("Delete character error:", error);
    return data(
      {
        error: "캐릭터 삭제 중 오류가 발생했습니다",
      },
      { status: 500 },
    );
  }
}
