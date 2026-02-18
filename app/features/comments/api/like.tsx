/**
 * 댓글 좋아요 API
 *
 * POST /api/comments/like — 좋아요 추가
 * DELETE /api/comments/like — 좋아요 제거
 * Body: { comment_id }
 */
import type { Route } from "./+types/like";

import { eq } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { createNotification } from "~/features/notifications/lib/create-notification.server";
import { toggleCommentLike } from "../lib/queries.server";
import { comments } from "../schema";

const bodySchema = z.object({
  comment_id: z.coerce.number().int().positive(),
});

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST" && request.method !== "DELETE") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return data({ error: "Invalid comment_id" }, { status: 400, headers });
    }

    const liked = request.method === "POST";
    await toggleCommentLike(parsed.data.comment_id, user.id, liked);

    if (liked) {
      const [commentRow] = await drizzle
        .select({
          user_id: comments.user_id,
          content: comments.content,
        })
        .from(comments)
        .where(eq(comments.comment_id, parsed.data.comment_id))
        .limit(1);

      if (commentRow && commentRow.user_id !== user.id) {
        await createNotification({
          user_id: commentRow.user_id,
          type: "like",
          title: "좋아요",
          body: "누군가 내 댓글에 좋아요를 눌렀어요!",
          subtitle: commentRow.content?.slice(0, 50),
          metadata: { comment_id: parsed.data.comment_id },
        });
      }
    }

    return data({ success: true, liked }, { headers });
  } catch (err) {
    console.error("Error toggling comment like:", err);
    return data({ error: "Failed to process like" }, { status: 500, headers });
  }
}
