/**
 * Create Character API
 *
 * Handles character creation with validation using Supabase Client
 */
import type { Route } from "./+types/create-character";

import { data, redirect } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

const createCharacterSchema = z.object({
  name: z.string().min(1, "캐릭터 이름은 필수입니다").max(50),
  display_name: z.string().min(1).max(50),
  tagline: z.string().max(50).optional().nullable(),
  description: z.string().min(1),
  role: z.string().optional().nullable(),
  appearance: z.string().optional().nullable(),
  personality: z.string().min(1),
  speech_style: z.string().optional().nullable(),
  system_prompt: z.string().min(1),
  greeting_message: z.string().min(1),
  relationship: z.string().optional().nullable(),
  world_setting: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  banner_url: z.string().url().optional().nullable(),
  tags: z.array(z.string()).default([]),
  category: z.string().optional().nullable(),
  age_rating: z.string().default("everyone"),
  is_public: z.boolean().default(false),
  is_nsfw: z.boolean().default(false),
  enable_memory: z.boolean().default(true),
  example_dialogues: z.any().optional().nullable(),
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
    return redirect("/login");
  }

  try {
    const formData = await request.json();
    const result = createCharacterSchema.safeParse(formData);

    if (!result.success) {
      return data(
        {
          error: "유효성 검사 실패",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const validData = result.data;

    // DB 저장
    const { data: newCharacter, error } = await client
      .from("characters")
      .insert({
        creator_id: user.id,
        name: validData.name,
        display_name: validData.display_name,
        tagline: validData.tagline,
        description: validData.description,
        role: validData.role,
        appearance: validData.appearance,
        personality: validData.personality,
        speech_style: validData.speech_style,
        system_prompt: validData.system_prompt,
        greeting_message: validData.greeting_message,
        relationship: validData.relationship,
        world_setting: validData.world_setting,
        avatar_url: validData.avatar_url,
        banner_url: validData.banner_url,
        tags: validData.tags,
        category: validData.category,
        age_rating: validData.age_rating,
        is_public: validData.is_public,
        is_nsfw: validData.is_nsfw,
        enable_memory: validData.enable_memory,
        example_dialogues: validData.example_dialogues,
        status: "approved",
      })
      .select()
      .single();

    if (error) {
      console.error("Create character error:", error);
      return data({ error: error.message }, { status: 500 });
    }

    // 기본 Safety Filter 생성
    await client.from("character_safety_filters").insert({
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
    console.error("Create character error:", error);
    return data(
      {
        error: "캐릭터 생성 중 오류가 발생했습니다",
      },
      { status: 500 },
    );
  }
}
