/**
 * 댓글 작성 API
 *
 * POST /api/comments/create
 * Body: { character_id, content, image_url?, parent_id? }
 */
import type { Route } from "./+types/create";

import { eq } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { characters } from "~/features/characters/schema";
import { createNotification } from "~/features/notifications/lib/create-notification.server";
import { createComment } from "../lib/queries.server";

const bodySchema = z.object({
  character_id: z.coerce.number().int().positive(),
  content: z.string().min(1).max(1000),
  image_url: z.string().nullable().optional(),
  parent_id: z.coerce.number().int().positive().nullable().optional(),
});

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
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
      return data(
        {
          error: "Invalid request",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400, headers }
      );
    }

    const validData = parsed.data;
    const comment = await createComment(
      validData.character_id,
      user.id,
      validData.content,
      validData.image_url ?? null,
      validData.parent_id ?? null
    );

    const [char] = await drizzle
      .select({
        creator_id: characters.creator_id,
        display_name: characters.display_name,
        name: characters.name,
      })
      .from(characters)
      .where(eq(characters.character_id, validData.character_id))
      .limit(1);

    if (char && char.creator_id !== user.id) {
      await createNotification({
        user_id: char.creator_id,
        type: "comment",
        title: "댓글",
        body: "누군가 댓글을 남겼어요!",
        subtitle: validData.content.slice(0, 50),
        metadata: {
          character_id: validData.character_id,
          comment_id: comment.comment_id,
        },
      });
    }

    return data({ success: true, comment }, { headers });
  } catch (err) {
    console.error("Error creating comment:", err);
    return data({ error: "Failed to create comment" }, { status: 500, headers });
  }
}
