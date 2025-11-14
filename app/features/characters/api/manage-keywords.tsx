/**
 * Manage Character Keywords API
 *
 * Handles CRUD operations for character keywords
 */
import type { ActionFunctionArgs } from "react-router";

import { data } from "react-router";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { requireUser } from "~/core/lib/guards.server";
import { db } from "~/core/db/drizzle-client.server";

import { characters, characterKeywords } from "../schema";

const addKeywordSchema = z.object({
  action: z.literal("add"),
  character_id: z.string().uuid(),
  keyword: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  response_template: z.string().max(1000).optional(),
  priority: z.number().int().min(0).default(0),
});

const updateKeywordSchema = z.object({
  action: z.literal("update"),
  keyword_id: z.string(),
  keyword: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  response_template: z.string().max(1000).optional(),
  priority: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

const deleteKeywordSchema = z.object({
  action: z.literal("delete"),
  keyword_id: z.string(),
});

const keywordActionSchema = z.discriminatedUnion("action", [
  addKeywordSchema,
  updateKeywordSchema,
  deleteKeywordSchema,
]);

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.json();
    const validatedData = keywordActionSchema.parse(formData);

    if (validatedData.action === "add") {
      // Check ownership
      const [character] = await db
        .select()
        .from(characters)
        .where(eq(characters.character_id, validatedData.character_id))
        .limit(1);

      if (!character) {
        return data({ error: "캐릭터를 찾을 수 없습니다" }, { status: 404 });
      }

      if (character.creator_id !== user.id) {
        return data({ error: "권한이 없습니다" }, { status: 403 });
      }

      // Add keyword
      const [newKeyword] = await db
        .insert(characterKeywords)
        .values({
          character_id: validatedData.character_id,
          keyword: validatedData.keyword,
          description: validatedData.description,
          response_template: validatedData.response_template,
          priority: validatedData.priority,
        })
        .returning();

      return data({
        success: true,
        keyword: newKeyword,
        message: "키워드가 추가되었습니다",
      });
    }

    if (validatedData.action === "update") {
      // Check ownership through character
      const [keyword] = await db
        .select({
          keyword: characterKeywords,
          character: characters,
        })
        .from(characterKeywords)
        .innerJoin(
          characters,
          eq(characters.character_id, characterKeywords.character_id),
        )
        .where(eq(characterKeywords.keyword_id, validatedData.keyword_id))
        .limit(1);

      if (!keyword) {
        return data({ error: "키워드를 찾을 수 없습니다" }, { status: 404 });
      }

      if (keyword.character.creator_id !== user.id) {
        return data({ error: "권한이 없습니다" }, { status: 403 });
      }

      // Update keyword
      const { action: _, keyword_id, ...updateData } = validatedData;
      const [updatedKeyword] = await db
        .update(characterKeywords)
        .set({
          ...updateData,
          updated_at: new Date(),
        })
        .where(eq(characterKeywords.keyword_id, keyword_id))
        .returning();

      return data({
        success: true,
        keyword: updatedKeyword,
        message: "키워드가 업데이트되었습니다",
      });
    }

    if (validatedData.action === "delete") {
      // Check ownership through character
      const [keyword] = await db
        .select({
          keyword: characterKeywords,
          character: characters,
        })
        .from(characterKeywords)
        .innerJoin(
          characters,
          eq(characters.character_id, characterKeywords.character_id),
        )
        .where(eq(characterKeywords.keyword_id, validatedData.keyword_id))
        .limit(1);

      if (!keyword) {
        return data({ error: "키워드를 찾을 수 없습니다" }, { status: 404 });
      }

      if (keyword.character.creator_id !== user.id) {
        return data({ error: "권한이 없습니다" }, { status: 403 });
      }

      // Delete keyword
      await db
        .delete(characterKeywords)
        .where(eq(characterKeywords.keyword_id, validatedData.keyword_id));

      return data({
        success: true,
        message: "키워드가 삭제되었습니다",
      });
    }

    return data({ error: "잘못된 요청입니다" }, { status: 400 });
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

    console.error("Manage keywords error:", error);
    return data(
      {
        error: "키워드 관리 중 오류가 발생했습니다",
      },
      { status: 500 },
    );
  }
}
