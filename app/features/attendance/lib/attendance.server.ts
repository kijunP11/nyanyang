/**
 * Attendance Server Functions
 *
 * This module provides server-side functions for handling attendance check operations.
 * Extracted from home.tsx to be reusable across different routes.
 */
import { data } from "react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/database.types";

export interface CheckAttendanceResult {
  success: boolean;
  consecutiveDays: number;
  pointsAwarded: number;
  error?: string;
}

/**
 * Checks attendance for a user and awards points
 *
 * @param client - Supabase client instance
 * @param userId - User ID to check attendance for
 * @returns Result object with success status, consecutive days, and points awarded
 */
export async function checkAttendance(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<CheckAttendanceResult> {
  const today = new Date().toISOString().split("T")[0];

  try {
    // 1. 중복 체크
    const { data: existing } = await client
      .from("attendance_records")
      .select("*")
      .eq("user_id", userId)
      .eq("attendance_date", today)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        consecutiveDays: existing.consecutive_days,
        pointsAwarded: 0,
        error: "Already checked today",
      };
    }

    // 2. 연속일 계산
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];
    const { data: yesterdayRecord } = await client
      .from("attendance_records")
      .select("consecutive_days")
      .eq("user_id", userId)
      .eq("attendance_date", yesterday)
      .maybeSingle();

    const consecutiveDays = yesterdayRecord
      ? yesterdayRecord.consecutive_days + 1
      : 1;
    
    // 보너스 계산: 7일마다 보너스 500 포인트
    const basePoints = 100;
    const bonusPoints = consecutiveDays % 7 === 0 ? 500 : 0;
    const pointsToAward = basePoints + bonusPoints;

    // 3. 현재 포인트 조회
    const { data: userPoints } = await client
      .from("user_points")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // 4. 출석 기록 저장
    await client.from("attendance_records").insert({
      user_id: userId,
      attendance_date: today,
      consecutive_days: consecutiveDays,
      points_awarded: pointsToAward,
    });

    // 5. 포인트 업데이트
    await client.from("user_points").upsert(
      {
        user_id: userId,
        current_balance: (userPoints?.current_balance || 0) + pointsToAward,
        total_earned: (userPoints?.total_earned || 0) + pointsToAward,
      },
      { onConflict: "user_id" },
    );

    return {
      success: true,
      consecutiveDays,
      pointsAwarded: pointsToAward,
    };
  } catch (error) {
    console.error("Attendance check error:", error);
    return {
      success: false,
      consecutiveDays: 0,
      pointsAwarded: 0,
      error: "Failed to check attendance",
    };
  }
}

