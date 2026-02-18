/**
 * 뱃지 수령 API
 * POST: 조건 충족 시 뱃지 수령 (중복 시 400)
 */
import type { Route } from "./+types/claim";

import { data } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";

import { eq } from "drizzle-orm";
import drizzle from "~/core/db/drizzle-client.server";

import { badgeDefinitions } from "../schema";
import { evaluateSingleBadge } from "../lib/badge-checker.server";
import { claimBadge } from "../lib/queries.server";

const bodySchema = z.object({
  badge_id: z.number().int().positive(),
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

  const [badgeDef] = await drizzle
    .select()
    .from(badgeDefinitions)
    .where(eq(badgeDefinitions.badge_id, parsed.badge_id))
    .limit(1);
  if (!badgeDef) {
    return data(
      { error: "존재하지 않는 뱃지입니다." },
      { status: 400, headers }
    );
  }

  const claimable = await evaluateSingleBadge(user.id, parsed.badge_id);
  if (!claimable) {
    return data(
      { error: "아직 뱃지 획득 조건을 충족하지 않습니다." },
      { status: 400, headers }
    );
  }

  const result = await claimBadge(user.id, parsed.badge_id);
  if (result.length === 0) {
    return data(
      { error: "이미 수령한 뱃지입니다." },
      { status: 400, headers }
    );
  }

  return data(
    {
      success: true,
      badge: result[0],
      reward_points: badgeDef.reward_points ?? 0,
    },
    { headers }
  );
}
