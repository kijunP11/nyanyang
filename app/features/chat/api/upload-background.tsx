/**
 * Chat background image upload
 * POST: base64 image → Supabase Storage → public URL
 */
import { data } from "react-router";
import { z } from "zod";
import makeServerClient from "~/core/lib/supa-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const BUCKET = "character-media";

const bodySchema = z.object({
  image: z.string().min(1),
});

export async function action({ request }: { request: Request }) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405, headers });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return data({ error: "Invalid body" }, { status: 400, headers });
  }

  const base64Data = body.image.includes(",")
    ? body.image.split(",")[1]
    : body.image;
  if (!base64Data) {
    return data({ error: "Invalid image data" }, { status: 400, headers });
  }

  const buffer = Buffer.from(base64Data, "base64");
  if (buffer.length > MAX_FILE_SIZE) {
    return data(
      { error: "파일 크기는 5MB를 초과할 수 없습니다" },
      { status: 400, headers }
    );
  }

  const ext = "png";
  const path = `${user.id}/chat-background/${Date.now()}.${ext}`;

  const { error: uploadError } = await client.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload background error:", uploadError);
    return data(
      { error: "파일 업로드 중 오류가 발생했습니다" },
      { status: 500, headers }
    );
  }

  const {
    data: { publicUrl },
  } = client.storage.from(BUCKET).getPublicUrl(path);

  return data({ success: true, url: publicUrl }, { headers });
}
