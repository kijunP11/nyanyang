import { and, eq, sql } from "drizzle-orm";
import drizzle from "~/core/db/drizzle-client.server";

import { userPoints, pointTransactions } from "~/features/points/schema";
import { badgeDefinitions, userBadges } from "../schema";

/** 모든 뱃지 정의 조회 (sort_order 순) */
export async function getAllBadgeDefinitions() {
  return drizzle
    .select()
    .from(badgeDefinitions)
    .orderBy(badgeDefinitions.sort_order);
}

/** 유저가 수령한 뱃지 목록 (claimed_at 역순) */
export async function getUserBadges(userId: string) {
  return drizzle
    .select()
    .from(userBadges)
    .where(eq(userBadges.user_id, userId))
    .orderBy(sql`${userBadges.claimed_at} DESC`);
}

/** 뱃지 수령 + 보상 포인트 지급 (트랜잭션) */
export async function claimBadge(userId: string, badgeId: number) {
  return drizzle.transaction(async (tx) => {
    const inserted = await tx
      .insert(userBadges)
      .values({ user_id: userId, badge_id: badgeId })
      .onConflictDoNothing({
        target: [userBadges.user_id, userBadges.badge_id],
      })
      .returning();

    if (inserted.length === 0) return inserted;

    const [def] = await tx
      .select({ reward_points: badgeDefinitions.reward_points })
      .from(badgeDefinitions)
      .where(eq(badgeDefinitions.badge_id, badgeId))
      .limit(1);

    const reward = def?.reward_points ?? 0;
    if (reward <= 0) return inserted;

    const [updated] = await tx
      .insert(userPoints)
      .values({
        user_id: userId,
        current_balance: reward,
        total_earned: reward,
      })
      .onConflictDoUpdate({
        target: userPoints.user_id,
        set: {
          current_balance: sql`${userPoints.current_balance} + ${reward}`,
          total_earned: sql`${userPoints.total_earned} + ${reward}`,
          updated_at: new Date(),
        },
      })
      .returning();

    const balanceAfter = updated?.current_balance ?? reward;
    await tx.insert(pointTransactions).values({
      user_id: userId,
      amount: reward,
      balance_after: balanceAfter,
      type: "reward",
      reason: `뱃지 보상: ${badgeId}`,
      reference_id: `badge:${badgeId}`,
    });

    return inserted;
  });
}

/** 대표 뱃지 설정 (트랜잭션: 기존 해제 → 새로 설정) */
export async function setRepresentativeBadge(
  userId: string,
  badgeId: number
) {
  return drizzle.transaction(async (tx) => {
    await tx
      .update(userBadges)
      .set({ is_representative: false, updated_at: new Date() })
      .where(
        and(
          eq(userBadges.user_id, userId),
          eq(userBadges.is_representative, true)
        )
      );
    await tx
      .update(userBadges)
      .set({ is_representative: true, updated_at: new Date() })
      .where(
        and(
          eq(userBadges.user_id, userId),
          eq(userBadges.badge_id, badgeId)
        )
      );
  });
}

/** 대표 뱃지 해제 */
export async function unsetRepresentativeBadge(
  userId: string,
  badgeId: number
) {
  return drizzle
    .update(userBadges)
    .set({ is_representative: false, updated_at: new Date() })
    .where(
      and(eq(userBadges.user_id, userId), eq(userBadges.badge_id, badgeId))
    );
}
