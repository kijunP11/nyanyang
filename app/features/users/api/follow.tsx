/**
 * User Follow/Unfollow API Endpoint
 *
 * POST /api/users/follow   → 팔로우
 * DELETE /api/users/follow → 언팔로우
 */

import type { Route } from "./+types/follow";

import { and, eq, sql } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { createNotification } from "~/features/notifications/lib/create-notification.server";
import { profiles, userFollows } from "../schema";

const bodySchema = z.object({
  user_id: z.string().uuid(),
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

  if (request.method !== "POST" && request.method !== "DELETE") {
    return data({ error: "Method not allowed" }, { status: 405, headers });
  }

  try {
    const body = await request.json();
    const { success, data: validData, error } = bodySchema.safeParse(body);

    if (!success) {
      return data(
        { error: "Invalid request", details: error.flatten().fieldErrors },
        { status: 400, headers }
      );
    }

    // 자기 자신 팔로우 방지
    if (validData.user_id === user.id) {
      return data({ error: "Cannot follow yourself" }, { status: 400, headers });
    }

    const db = drizzle;

    if (request.method === "POST") {
      // 팔로우
      try {
        await db.insert(userFollows).values({
          follower_id: user.id,
          following_id: validData.user_id,
        });

        // follower_count++ (대상 유저)
        await db
          .update(profiles)
          .set({ follower_count: sql`${profiles.follower_count} + 1` })
          .where(eq(profiles.profile_id, validData.user_id));

        // following_count++ (나)
        await db
          .update(profiles)
          .set({ following_count: sql`${profiles.following_count} + 1` })
          .where(eq(profiles.profile_id, user.id));

        await createNotification({
          user_id: validData.user_id,
          type: "follow",
          title: "팔로우 알림",
          body: "누군가 내 작품을 팔로우했어요!",
          metadata: { follower_id: user.id },
        });

        return data({ success: true, following: true }, { headers });
      } catch (err: any) {
        if (err.code === "23505") {
          return data({ error: "Already following" }, { status: 400, headers });
        }
        throw err;
      }
    } else {
      // 언팔로우 (DELETE)
      const [existing] = await db
        .select()
        .from(userFollows)
        .where(
          and(
            eq(userFollows.follower_id, user.id),
            eq(userFollows.following_id, validData.user_id)
          )
        )
        .limit(1);

      if (!existing) {
        return data({ error: "Not following" }, { status: 404, headers });
      }

      await db
        .delete(userFollows)
        .where(
          and(
            eq(userFollows.follower_id, user.id),
            eq(userFollows.following_id, validData.user_id)
          )
        );

      // follower_count-- (대상 유저, 최소 0)
      await db
        .update(profiles)
        .set({ follower_count: sql`GREATEST(${profiles.follower_count} - 1, 0)` })
        .where(eq(profiles.profile_id, validData.user_id));

      // following_count-- (나, 최소 0)
      await db
        .update(profiles)
        .set({ following_count: sql`GREATEST(${profiles.following_count} - 1, 0)` })
        .where(eq(profiles.profile_id, user.id));

      return data({ success: true, following: false }, { headers });
    }
  } catch (err) {
    console.error("Error processing follow/unfollow:", err);
    return data({ error: "Failed to process request" }, { status: 500, headers });
  }
}
