/**
 * 키워드북 삭제 API
 *
 * DELETE /api/keywords/delete-book
 * Body: { book_id }
 */
import type { Route } from "./+types/delete-book";

import { data } from "react-router";
import { z } from "zod";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { deleteKeywordBook } from "../lib/queries.server";

const bodySchema = z.object({
  book_id: z.coerce.number().int().positive(),
});

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "DELETE") {
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
      return data({ error: "Invalid book_id" }, { status: 400, headers });
    }

    const deleted = await deleteKeywordBook(parsed.data.book_id, user.id);

    if (!deleted) {
      return data(
        { error: "Not found or not authorized" },
        { status: 404, headers }
      );
    }

    return data({ success: true }, { headers });
  } catch (err) {
    console.error("Error deleting keyword book:", err);
    return data(
      { error: "Failed to delete keyword book" },
      { status: 500, headers }
    );
  }
}
