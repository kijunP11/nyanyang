/**
 * Upload Character Media API
 *
 * Handles image uploads to Supabase Storage for character avatars, banners, and gallery
 */
import type { ActionFunctionArgs } from "react-router";

import { data } from "react-router";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { requireUser } from "~/core/lib/guards.server";
import { db } from "~/core/db/drizzle-client.server";
import { supabaseAdmin } from "~/core/lib/supa-admin-client.server";

import { characters } from "../schema";

const uploadMediaSchema = z.object({
  character_id: z.string().uuid(),
  media_type: z.enum(["avatar", "banner", "gallery"]),
  file_data: z.string(), // base64 encoded file data
  file_name: z.string(),
  file_type: z.string().refine((type) => type.startsWith("image/"), {
    message: "이미지 파일만 업로드 가능합니다",
  }),
});

const STORAGE_BUCKET = "character-media";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.json();
    const validatedData = uploadMediaSchema.parse(formData);
    const { character_id, media_type, file_data, file_name, file_type } =
      validatedData;

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

    // Decode base64 file data
    const base64Data = file_data.split(",")[1] || file_data;
    const buffer = Buffer.from(base64Data, "base64");

    // Check file size
    if (buffer.length > MAX_FILE_SIZE) {
      return data(
        { error: "파일 크기는 5MB를 초과할 수 없습니다" },
        { status: 400 },
      );
    }

    // Generate unique file path
    const fileExtension = file_name.split(".").pop();
    const uniqueFileName = `${character_id}/${media_type}/${Date.now()}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(uniqueFileName, buffer, {
        contentType: file_type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return data(
        { error: "파일 업로드 중 오류가 발생했습니다" },
        { status: 500 },
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(uniqueFileName);

    // Update character with new media URL
    let updatedCharacter;

    if (media_type === "avatar") {
      [updatedCharacter] = await db
        .update(characters)
        .set({
          avatar_url: publicUrl,
          updated_at: new Date(),
        })
        .where(eq(characters.character_id, character_id))
        .returning();
    } else if (media_type === "banner") {
      [updatedCharacter] = await db
        .update(characters)
        .set({
          banner_url: publicUrl,
          updated_at: new Date(),
        })
        .where(eq(characters.character_id, character_id))
        .returning();
    } else if (media_type === "gallery") {
      // Add to gallery_urls array
      const currentGalleryUrls = character.gallery_urls || [];
      [updatedCharacter] = await db
        .update(characters)
        .set({
          gallery_urls: [...currentGalleryUrls, publicUrl],
          updated_at: new Date(),
        })
        .where(eq(characters.character_id, character_id))
        .returning();
    }

    return data({
      success: true,
      url: publicUrl,
      character: updatedCharacter,
      message: "미디어가 성공적으로 업로드되었습니다",
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

    console.error("Upload media error:", error);
    return data(
      {
        error: "미디어 업로드 중 오류가 발생했습니다",
      },
      { status: 500 },
    );
  }
}
