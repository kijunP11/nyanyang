/**
 * Weekly Attendance Check-in API
 *
 * POST /api/attendance/weekly-checkin
 * 7일 롤링 기준 주간 출석체크 — 800 냥젤리 지급
 */

import type { Route } from "./+types/weekly-checkin";

import { desc, eq } from "drizzle-orm";
import { data } from "react-router";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { createNotification } from "~/features/notifications/lib/create-notification.server";
import {
  pointTransactions,
  userPoints,
} from "../../points/schema";
import { weeklyAttendanceRecords } from "../schema";

const WEEKLY_POINTS = 800;

export async function action({ request }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405, headers });
  }

  try {
    const db = drizzle;

    // 마지막 주간 출석 기록 조회
    const [lastRecord] = await db
      .select()
      .from(weeklyAttendanceRecords)
      .where(eq(weeklyAttendanceRecords.user_id, user.id))
      .orderBy(desc(weeklyAttendanceRecords.created_at))
      .limit(1);

    // 7일 경과 여부 확인
    if (lastRecord) {
      const lastDate = new Date(lastRecord.created_at);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      if (lastDate > sevenDaysAgo) {
        return data(
          { error: "이번 주는 이미 출석했습니다" },
          { status: 400, headers },
        );
      }
    }

    // 주간 출석 기록 생성
    await db.insert(weeklyAttendanceRecords).values({
      user_id: user.id,
      points_awarded: WEEKLY_POINTS,
    });

    // 포인트 잔액 조회 또는 생성
    let [pointBalance] = await db
      .select()
      .from(userPoints)
      .where(eq(userPoints.user_id, user.id))
      .limit(1);

    if (!pointBalance) {
      [pointBalance] = await db
        .insert(userPoints)
        .values({
          user_id: user.id,
          current_balance: 0,
          total_earned: 0,
          total_spent: 0,
        })
        .returning();
    }

    // 잔액 업데이트
    const newBalance = pointBalance.current_balance + WEEKLY_POINTS;
    const newTotalEarned = pointBalance.total_earned + WEEKLY_POINTS;

    await db
      .update(userPoints)
      .set({
        current_balance: newBalance,
        total_earned: newTotalEarned,
      })
      .where(eq(userPoints.user_id, user.id));

    // 거래 내역 기록
    await db.insert(pointTransactions).values({
      user_id: user.id,
      amount: WEEKLY_POINTS,
      balance_after: newBalance,
      type: "reward",
      reason: "Weekly check-in",
      reference_id: `weekly_${new Date().toISOString().split("T")[0]}`,
    });

    // 알림 생성
    await createNotification({
      user_id: user.id,
      type: "checkin",
      title: "주간 출석체크",
      body: "냥젤리 800개가 도착했어요.💜",
      subtitle: "매주 출석하고 젤리 받아가세요!",
      metadata: { points_awarded: WEEKLY_POINTS },
    });

    return data(
      {
        success: true,
        pointsAwarded: WEEKLY_POINTS,
        newBalance,
      },
      { headers },
    );
  } catch (err) {
    console.error("Error processing weekly check-in:", err);
    return data(
      { error: "Failed to process weekly check-in" },
      { status: 500, headers },
    );
  }
}
