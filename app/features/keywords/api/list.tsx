/**
 * 키워드북 목록 API
 *
 * GET /api/keywords/list           → 전체 목록 (타입별 그룹)
 * GET /api/keywords/list?book_id=1 → 특정 키워드북 상세 (아이템 포함)
 */
import type { Route } from "./+types/list";

import { data } from "react-router";
import { z } from "zod";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import {
  getKeywordBooksByUser,
  getKeywordBookDetail,
} from "../lib/queries.server";

const querySchema = z.object({
  book_id: z.coerce.number().int().positive().optional(),
});

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(
    Object.fromEntries(url.searchParams)
  );

  if (!parsed.success) {
    return data({ error: "Invalid parameters" }, { status: 400, headers });
  }

  try {
    if (parsed.data.book_id) {
      const book = await getKeywordBookDetail(
        parsed.data.book_id,
        user.id
      );
      if (!book) {
        return data({ error: "Not found" }, { status: 404, headers });
      }
      return data({ book }, { headers });
    }

    const books = await getKeywordBooksByUser(user.id);
    return data({ books }, { headers });
  } catch (err) {
    console.error("Error fetching keyword books:", err);
    return data(
      { error: "Failed to fetch keyword books" },
      { status: 500, headers }
    );
  }
}
