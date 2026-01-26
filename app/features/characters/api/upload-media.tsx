/**
 * Upload Character Media API
 *
 * Handles image uploads to Supabase Storage for character avatars and banners
 */
import type { Route } from "./+types/upload-media";

import { data } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

const uploadMediaSchema = z.object({
  character_id: z.number(),
  media_type: z.enum(["avatar", "banner"]),
  file_data: z.string(), // base64 encoded file data
  file_name: z.string(),
  file_type: z.string().refine((type) => type.startsWith("image/"), {
    message: "이미지 파일만 업로드 가능합니다",
  }),
});

const STORAGE_BUCKET = "character-media";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
    const result = uploadMediaSchema.safeParse(formData);

    if (!result.success) {
      return data(
        {
          error: "유효성 검사 실패",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { character_id, media_type, file_data, file_name, file_type } =
      result.data;

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
    const { error: uploadError } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(uniqueFileName, buffer, {
        contentType: file_type,
        upsert: true,
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
    } = client.storage.from(STORAGE_BUCKET).getPublicUrl(uniqueFileName);

    // Update character with new media URL
    const updateField =
      media_type === "avatar" ? { avatar_url: publicUrl } : { banner_url: publicUrl };

    const { data: updatedCharacter, error: updateError } = await client
      .from("characters")
      .update(updateField)
      .eq("character_id", character_id)
      .eq("creator_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Update character error:", updateError);
      return data({ error: updateError.message }, { status: 500 });
    }

    return data({
      success: true,
      url: publicUrl,
      character: updatedCharacter,
      message: "미디어가 성공적으로 업로드되었습니다",
    });
  } catch (error) {
    console.error("Upload media error:", error);
    return data(
      {
        error: "미디어 업로드 중 오류가 발생했습니다",
      },
      { status: 500 },
    );
  }
}
