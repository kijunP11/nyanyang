/**
 * 댓글 이미지 업로드 API
 *
 * POST /api/comments/upload-image
 * Body: { file_data (base64), file_name, file_type }
 */
import type { Route } from "./+types/upload-image";

import { data } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

const uploadSchema = z.object({
  file_data: z.string(),
  file_name: z.string(),
  file_type: z.string().refine((type) => type.startsWith("image/"), {
    message: "이미지 파일만 업로드 가능합니다",
  }),
});

const STORAGE_BUCKET = "comment-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const [client, headers] = makeServerClient(request);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const body = await request.json();
    const parsed = uploadSchema.safeParse(body);

    if (!parsed.success) {
      return data({ error: "유효성 검사 실패" }, { status: 400, headers });
    }

    const validData = parsed.data;
    const base64Data = validData.file_data.split(",")[1] ?? validData.file_data;
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > MAX_FILE_SIZE) {
      return data(
        { error: "파일 크기는 5MB를 초과할 수 없습니다" },
        { status: 400, headers }
      );
    }

    const ext = validData.file_name.split(".").pop();
    const filePath = `comments/${user.id}/${Date.now()}.${ext ?? "jpg"}`;

    const { error: uploadError } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType: validData.file_type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Comment image upload error:", uploadError);
      return data({ error: "업로드 실패" }, { status: 500, headers });
    }

    const {
      data: { publicUrl },
    } = client.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return data({ success: true, url: publicUrl }, { headers });
  } catch (err) {
    console.error("Comment upload error:", err);
    return data({ error: "업로드 중 오류" }, { status: 500, headers });
  }
}
