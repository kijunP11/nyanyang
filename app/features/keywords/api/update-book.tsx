/**
 * 키워드북 수정 API
 *
 * POST /api/keywords/update-book
 * Body: { book_id, title }
 */
import type { Route } from "./+types/update-book";

import { data } from "react-router";
import { z } from "zod";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { updateKeywordBook } from "../lib/queries.server";

const bodySchema = z.object({
  book_id: z.coerce.number().int().positive(),
  title: z.string().min(1).max(100),
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

    const updated = await updateKeywordBook(
      parsed.data.book_id,
      user.id,
      { title: parsed.data.title }
    );

    if (!updated) {
      return data(
        { error: "Not found or not authorized" },
        { status: 404, headers }
      );
    }

    return data({ success: true, book: updated }, { headers });
  } catch (err) {
    console.error("Error updating keyword book:", err);
    return data(
      { error: "Failed to update keyword book" },
      { status: 500, headers }
    );
  }
}
