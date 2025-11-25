/**
 * Manage Character Keywords API
 *
 * Handles CRUD operations for character keywords using Supabase Client
 */
import type { Route } from "./+types/manage-keywords";

import { data } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

const addKeywordSchema = z.object({
  action: z.literal("add"),
  character_id: z.number(),
  keyword: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  response_template: z.string().max(1000).optional().nullable(),
  priority: z.number().int().min(0).default(0),
});

const updateKeywordSchema = z.object({
  action: z.literal("update"),
  keyword_id: z.number(),
  keyword: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  response_template: z.string().max(1000).optional().nullable(),
  priority: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

const deleteKeywordSchema = z.object({
  action: z.literal("delete"),
  keyword_id: z.number(),
});

const keywordActionSchema = z.discriminatedUnion("action", [
  addKeywordSchema,
  updateKeywordSchema,
  deleteKeywordSchema,
]);

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
    const result = keywordActionSchema.safeParse(formData);

    if (!result.success) {
      return data(
        {
          error: "유효성 검사 실패",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const validatedData = result.data;

    if (validatedData.action === "add") {
      // 캐릭터 소유권 확인
      const { data: character } = await client
        .from("characters")
        .select("creator_id")
        .eq("character_id", validatedData.character_id)
        .single();

      if (!character) {
        return data({ error: "캐릭터를 찾을 수 없습니다" }, { status: 404 });
      }

      if (character.creator_id !== user.id) {
        return data({ error: "권한이 없습니다" }, { status: 403 });
      }

      // 키워드 추가
      const { data: newKeyword, error } = await client
        .from("character_keywords")
        .insert({
          character_id: validatedData.character_id,
          keyword: validatedData.keyword,
          description: validatedData.description,
          response_template: validatedData.response_template,
          priority: validatedData.priority,
        })
        .select()
        .single();

      if (error) {
        console.error("Add keyword error:", error);
        return data({ error: error.message }, { status: 500 });
      }

      return data({
        success: true,
        keyword: newKeyword,
        message: "키워드가 추가되었습니다",
      });
    }

    if (validatedData.action === "update") {
      // 키워드 조회 및 소유권 확인
      const { data: keyword } = await client
        .from("character_keywords")
        .select("*, characters!inner(creator_id)")
        .eq("keyword_id", validatedData.keyword_id)
        .single();

      if (!keyword) {
        return data({ error: "키워드를 찾을 수 없습니다" }, { status: 404 });
      }

      if ((keyword.characters as { creator_id: string }).creator_id !== user.id) {
        return data({ error: "권한이 없습니다" }, { status: 403 });
      }

      // 키워드 업데이트
      const { action: _, keyword_id, ...updateData } = validatedData;
      const { data: updatedKeyword, error } = await client
        .from("character_keywords")
        .update(updateData)
        .eq("keyword_id", keyword_id)
        .select()
        .single();

      if (error) {
        console.error("Update keyword error:", error);
        return data({ error: error.message }, { status: 500 });
      }

      return data({
        success: true,
        keyword: updatedKeyword,
        message: "키워드가 업데이트되었습니다",
      });
    }

    if (validatedData.action === "delete") {
      // 키워드 조회 및 소유권 확인
      const { data: keyword } = await client
        .from("character_keywords")
        .select("*, characters!inner(creator_id)")
        .eq("keyword_id", validatedData.keyword_id)
        .single();

      if (!keyword) {
        return data({ error: "키워드를 찾을 수 없습니다" }, { status: 404 });
      }

      if ((keyword.characters as { creator_id: string }).creator_id !== user.id) {
        return data({ error: "권한이 없습니다" }, { status: 403 });
      }

      // 키워드 삭제
      const { error } = await client
        .from("character_keywords")
        .delete()
        .eq("keyword_id", validatedData.keyword_id);

      if (error) {
        console.error("Delete keyword error:", error);
        return data({ error: error.message }, { status: 500 });
      }

      return data({
        success: true,
        message: "키워드가 삭제되었습니다",
      });
    }

    return data({ error: "잘못된 요청입니다" }, { status: 400 });
  } catch (error) {
    console.error("Manage keywords error:", error);
    return data(
      {
        error: "키워드 관리 중 오류가 발생했습니다",
      },
      { status: 500 },
    );
  }
}
