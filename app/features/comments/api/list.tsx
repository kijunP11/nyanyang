/**
 * 댓글 목록 API
 *
 * GET /api/comments/list?character_id=123&cursor=456
 * 답글은 별도: GET /api/comments/list?parent_id=789
 */
import type { Route } from "./+types/list";

import { data } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

import { getComments, getReplies } from "../lib/queries.server";

const querySchema = z.object({
  character_id: z.coerce.number().int().positive().optional(),
  parent_id: z.coerce.number().int().positive().optional(),
  cursor: z.coerce.number().int().positive().optional(),
});

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);

  const {
    data: { user },
  } = await client.auth.getUser();

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(
    Object.fromEntries(url.searchParams)
  );

  if (!parsed.success) {
    return data({ error: "Invalid parameters" }, { status: 400, headers });
  }

  const params = parsed.data;

  try {
    if (params.parent_id != null) {
      const replies = await getReplies(params.parent_id, user?.id ?? null);
      return data({ replies }, { headers });
    }

    if (params.character_id == null) {
      return data({ error: "character_id required" }, { status: 400, headers });
    }

    const result = await getComments(
      params.character_id,
      user?.id ?? null,
      params.cursor
    );

    return data(result, { headers });
  } catch (err) {
    console.error("Error fetching comments:", err);
    return data({ error: "Failed to fetch comments" }, { status: 500, headers });
  }
}
