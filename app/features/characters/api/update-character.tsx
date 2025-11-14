/**
 * Update Character API
 *
 * Handles character updates with validation and ownership checks
 */
import type { ActionFunctionArgs } from "react-router";

import { data } from "react-router";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { requireUser } from "~/core/lib/guards.server";
import { db } from "~/core/db/drizzle-client.server";

import { characters } from "../schema";

const updateCharacterSchema = z.object({
  character_id: z.string().uuid(),
  name: z.string().min(1).max(50).optional(),
  display_name: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  greeting_message: z.string().max(200).optional(),
  avatar_url: z.string().url().optional(),
  banner_url: z.string().url().optional(),
  gallery_urls: z.array(z.string().url()).optional(),
  personality_traits: z.array(z.string()).optional(),
  tone: z.string().optional(),
  age: z.number().int().positive().optional(),
  gender: z.string().optional(),
  is_public: z.boolean().optional(),
  is_nsfw: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "pending_review", "approved", "rejected", "archived"]).optional(),
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  if (request.method !== "PUT" && request.method !== "PATCH") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.json();
    const { character_id, ...updateData } = updateCharacterSchema.parse(formData);

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

    // Update character
    const [updatedCharacter] = await db
      .update(characters)
      .set({
        ...updateData,
        updated_at: new Date(),
      })
      .where(eq(characters.character_id, character_id))
      .returning();

    return data({
      success: true,
      character: updatedCharacter,
      message: "캐릭터가 성공적으로 업데이트되었습니다",
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

    console.error("Update character error:", error);
    return data(
      {
        error: "캐릭터 업데이트 중 오류가 발생했습니다",
      },
      { status: 500 },
    );
  }
}
