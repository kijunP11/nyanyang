/**
 * Manage Character Safety Filter API
 *
 * Handles safety filter configuration for characters
 */
import type { ActionFunctionArgs } from "react-router";

import { data } from "react-router";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { requireUser } from "~/core/lib/guards.server";
import { db } from "~/core/db/drizzle-client.server";

import { characters, characterSafetyFilters } from "../schema";

const updateSafetyFilterSchema = z.object({
  character_id: z.string().uuid(),
  block_nsfw: z.boolean().optional(),
  block_violence: z.boolean().optional(),
  block_hate_speech: z.boolean().optional(),
  block_personal_info: z.boolean().optional(),
  blocked_words: z.array(z.string()).optional(),
  blocked_phrases: z.array(z.string()).optional(),
  sensitivity_level: z.number().int().min(1).max(10).optional(),
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  if (request.method !== "POST" && request.method !== "PUT") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.json();
    const validatedData = updateSafetyFilterSchema.parse(formData);
    const { character_id, ...filterData } = validatedData;

    // Check ownership
    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.character_id, character_id))
      .limit(1);

    if (!character) {
      return data({ error: "캐릭터를 찾을 수 없습니다" }, { status: 404 });
    }

    if (character.creator_id !== user.id) {
      return data({ error: "권한이 없습니다" }, { status: 403 });
    }

    // Check if filter exists
    const [existingFilter] = await db
      .select()
      .from(characterSafetyFilters)
      .where(eq(characterSafetyFilters.character_id, character_id))
      .limit(1);

    let result;

    if (existingFilter) {
      // Update existing filter
      [result] = await db
        .update(characterSafetyFilters)
        .set({
          ...filterData,
          updated_at: new Date(),
        })
        .where(eq(characterSafetyFilters.character_id, character_id))
        .returning();
    } else {
      // Create new filter
      [result] = await db
        .insert(characterSafetyFilters)
        .values({
          character_id,
          ...filterData,
        })
        .returning();
    }

    return data({
      success: true,
      filter: result,
      message: "안전 필터가 업데이트되었습니다",
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

    console.error("Manage safety filter error:", error);
    return data(
      {
        error: "안전 필터 관리 중 오류가 발생했습니다",
      },
      { status: 500 },
    );
  }
}
