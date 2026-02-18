/**
 * 대표 뱃지 설정/해제 API
 * POST: { badge_id, action: "set" | "unset" }
 */
import type { Route } from "./+types/representative";

import { eq, and } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";

import { userBadges } from "../schema";
import {
  setRepresentativeBadge,
  unsetRepresentativeBadge,
} from "../lib/queries.server";

const bodySchema = z.object({
  badge_id: z.number().int().positive(),
  action: z.enum(["set", "unset"]),
});

export async function action({ request }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    const body = await request.json();
    parsed = bodySchema.parse(body);
  } catch (err) {
    const msg =
      err instanceof z.ZodError
        ? err.errors[0]?.message ?? "Invalid request"
        : "Invalid request";
    return data({ error: msg }, { status: 400, headers });
  }

  const [owned] = await drizzle
    .select()
    .from(userBadges)
    .where(
      and(
        eq(userBadges.user_id, user.id),
        eq(userBadges.badge_id, parsed.badge_id)
      )
    )
    .limit(1);

  if (!owned) {
    return data(
      { error: "보유하지 않은 뱃지는 대표로 설정할 수 없습니다." },
      { status: 400, headers }
    );
  }

  if (parsed.action === "set") {
    await setRepresentativeBadge(user.id, parsed.badge_id);
  } else {
    await unsetRepresentativeBadge(user.id, parsed.badge_id);
  }

  return data({ success: true }, { headers });
}
