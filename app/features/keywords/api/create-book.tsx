/**
 * 키워드북 생성 API
 *
 * POST /api/keywords/create-book
 * Body: { title, book_type, character_id? }
 */
import type { Route } from "./+types/create-book";

import { data } from "react-router";
import { z } from "zod";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { createKeywordBook } from "../lib/queries.server";

const bodySchema = z.object({
  title: z.string().min(1).max(100),
  book_type: z.enum(["user", "character", "unclassified"]),
  character_id: z.coerce.number().int().positive().nullable().optional(),
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

    const book = await createKeywordBook(user.id, parsed.data);
    return data({ success: true, book }, { headers });
  } catch (err) {
    console.error("Error creating keyword book:", err);
    return data(
      { error: "Failed to create keyword book" },
      { status: 500, headers }
    );
  }
}
