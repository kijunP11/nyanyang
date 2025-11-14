/**
 * Create Character API
 *
 * Handles character creation with validation
 */
import type { ActionFunctionArgs } from "react-router";

import { data } from "react-router";
import { z } from "zod";

import { requireUser } from "~/core/lib/guards.server";
import { db } from "~/core/db/drizzle-client.server";

import { characters, characterSafetyFilters } from "../schema";

const createCharacterSchema = z.object({
  name: z.string().min(1, "캐릭터 이름은 필수입니다").max(50),
  display_name: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  greeting_message: z.string().max(200).optional(),
  avatar_url: z.string().url().optional(),
  banner_url: z.string().url().optional(),
  personality_traits: z.array(z.string()).default([]),
  tone: z.string().optional(),
  age: z.number().int().positive().optional(),
  gender: z.string().optional(),
  is_public: z.boolean().default(false),
  is_nsfw: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.json();
    const validatedData = createCharacterSchema.parse(formData);

    // Create character
    const [newCharacter] = await db
      .insert(characters)
      .values({
        ...validatedData,
        creator_id: user.id,
        status: "draft",
      })
      .returning();

    // Create default safety filter for the character
    await db.insert(characterSafetyFilters).values({
      character_id: newCharacter.character_id,
      block_nsfw: true,
      block_violence: true,
      block_hate_speech: true,
      block_personal_info: true,
      sensitivity_level: 5,
    });

    return data(
      {
        success: true,
        character: newCharacter,
        message: "캐릭터가 성공적으로 생성되었습니다",
      },
      { status: 201 },
    );
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

    console.error("Create character error:", error);
    return data(
      {
        error: "캐릭터 생성 중 오류가 발생했습니다",
      },
      { status: 500 },
    );
  }
}
