import type { Route } from "./+types/notices";

import { eq, desc } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { requireAdmin } from "../../admin/lib/guards.server";
import { notices } from "../schema";

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  const items = await drizzle
    .select()
    .from(notices)
    .orderBy(desc(notices.created_at));

  return data({ items }, { headers });
}

const createSchema = z.object({
  type: z.enum(["notice", "event"]),
  title: z.string().min(1),
  slug: z.string().min(1),
  tag: z.string().optional(),
  content: z.string().min(1),
  status: z.enum(["draft", "published"]).default("draft"),
  published_at: z.string().optional(),
});

const updateSchema = z.object({
  notice_id: z.number(),
  type: z.enum(["notice", "event"]).optional(),
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  tag: z.string().nullable().optional(),
  content: z.string().min(1).optional(),
  status: z.enum(["draft", "published"]).optional(),
  published_at: z.string().nullable().optional(),
});

const deleteSchema = z.object({
  notice_id: z.number(),
});

export async function action({ request }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const body = await request.json();

    if (request.method === "POST") {
      const parsed = createSchema.safeParse(body);
      if (!parsed.success) {
        return data(
          { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
          { status: 400, headers },
        );
      }

      const values = {
        ...parsed.data,
        tag: parsed.data.tag ?? null,
        author_id: user.id,
        published_at: parsed.data.published_at
          ? new Date(parsed.data.published_at)
          : null,
      };

      const [created] = await drizzle
        .insert(notices)
        .values(values)
        .returning();

      return data({ success: true, notice: created }, { headers });
    }

    if (request.method === "PUT") {
      const parsed = updateSchema.safeParse(body);
      if (!parsed.success) {
        return data(
          { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
          { status: 400, headers },
        );
      }

      const { notice_id, published_at, ...rest } = parsed.data;
      const updateValues: Record<string, unknown> = { ...rest };
      if (published_at !== undefined) {
        updateValues.published_at = published_at
          ? new Date(published_at)
          : null;
      }

      const [updated] = await drizzle
        .update(notices)
        .set(updateValues)
        .where(eq(notices.notice_id, notice_id))
        .returning();

      if (!updated) {
        return data({ error: "Notice not found" }, { status: 404, headers });
      }

      return data({ success: true, notice: updated }, { headers });
    }

    if (request.method === "DELETE") {
      const parsed = deleteSchema.safeParse(body);
      if (!parsed.success) {
        return data(
          { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
          { status: 400, headers },
        );
      }

      const [deleted] = await drizzle
        .delete(notices)
        .where(eq(notices.notice_id, parsed.data.notice_id))
        .returning();

      if (!deleted) {
        return data({ error: "Notice not found" }, { status: 404, headers });
      }

      return data({ success: true }, { headers });
    }

    return data({ error: "Method not allowed" }, { status: 405, headers });
  } catch (err) {
    console.error("Error in admin notices API:", err);
    return data(
      { error: "Failed to process request" },
      { status: 500, headers },
    );
  }
}
