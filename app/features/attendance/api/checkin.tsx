/**
 * Attendance Check-in API
 *
 * Handles daily attendance check-ins and rewards.
 *
 * Key features:
 * - POST: Daily check-in (once per day)
 * - GET: Fetch attendance history
 * - Consecutive day bonuses
 * - Point rewards
 */

import type { Route } from "./+types/checkin";

import { eq, and, gte, desc, sql } from "drizzle-orm";
import { data } from "react-router";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { createNotification } from "~/features/notifications/lib/create-notification.server";
import { attendanceRecords } from "../schema";
import { userPoints, pointTransactions } from "../../points/schema";

/**
 * Base points for daily check-in
 */
const BASE_POINTS = 400;

/**
 * Bonus points for consecutive days
 */
const CONSECUTIVE_BONUSES: Record<number, number> = {
  7: 50,   // 7일 연속: +50 포인트
  14: 100, // 14일 연속: +100 포인트
  30: 300, // 30일 연속: +300 포인트
};

/**
 * Loader function for fetching attendance history
 *
 * Retrieves the user's attendance data including:
 * - Today's check-in status
 * - Current consecutive day streak
 * - Recent attendance records (last 30 days)
 *
 * The current streak is calculated by counting consecutive daily check-ins
 * from today backwards. If there's any gap in the check-in history, the
 * streak resets to the most recent continuous sequence.
 *
 * @param request - The incoming HTTP request containing authentication cookies
 * @returns JSON response containing check-in status, current streak, and recent records
 * @throws {401} When user is not authenticated
 *
 * @example
 * // Response when user has checked in today with a 5-day streak
 * {
 *   checkedInToday: true,
 *   currentStreak: 5,
 *   recentRecords: [
 *     { date: "2025-11-12", points: 10, consecutiveDays: 5 },
 *     { date: "2025-11-11", points: 10, consecutiveDays: 4 },
 *     // ... more records
 *   ]
 * }
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  const db = drizzle;

  // Get today's date (YYYY-MM-DD)
  const today = new Date().toISOString().split("T")[0];

  // Check if already checked in today
  const [todayRecord] = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.user_id, user.id),
        eq(attendanceRecords.attendance_date, today)
      )
    )
    .limit(1);

  // Get recent 30 days attendance
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const recentRecords = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.user_id, user.id),
        gte(attendanceRecords.attendance_date, thirtyDaysAgoStr)
      )
    )
    .orderBy(desc(attendanceRecords.attendance_date));

  // Calculate current streak
  let currentStreak = 0;
  if (recentRecords.length > 0) {
    const sortedRecords = [...recentRecords].reverse();
    const todayDate = new Date();

    for (let i = 0; i < sortedRecords.length; i++) {
      const recordDate = new Date(sortedRecords[i].attendance_date);
      const expectedDate = new Date(todayDate);
      expectedDate.setDate(expectedDate.getDate() - i);

      const recordDateStr = recordDate.toISOString().split("T")[0];
      const expectedDateStr = expectedDate.toISOString().split("T")[0];

      if (recordDateStr === expectedDateStr) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return data(
    {
      checkedInToday: !!todayRecord,
      currentStreak,
      recentRecords: recentRecords.map(r => ({
        date: r.attendance_date,
        points: r.points_awarded,
        consecutiveDays: r.consecutive_days,
      })),
    },
    { headers }
  );
}

/**
 * Action handler for daily check-in
 *
 * Processes a daily attendance check-in for the authenticated user. This function:
 * 1. Validates that the request is a POST method
 * 2. Checks if the user has already checked in today
 * 3. Calculates consecutive day streak based on yesterday's record
 * 4. Awards base points plus any consecutive day bonuses
 * 5. Creates an attendance record
 * 6. Updates the user's point balance
 * 7. Creates a point transaction record
 *
 * Point system:
 * - Base points: 10 per check-in
 * - Consecutive bonuses: 7 days (+50), 14 days (+100), 30 days (+300)
 *
 * @param request - The incoming HTTP POST request with authentication cookies
 * @returns JSON response containing success status, points awarded, consecutive days, and new balance
 * @throws {401} When user is not authenticated
 * @throws {400} When user has already checked in today
 * @throws {405} When request method is not POST
 * @throws {500} When database operation fails
 *
 * @example
 * // Successful check-in on day 7 (with consecutive bonus)
 * {
 *   success: true,
 *   pointsAwarded: 60,  // 10 base + 50 bonus
 *   consecutiveDays: 7,
 *   newBalance: 250
 * }
 *
 * @example
 * // Error response when already checked in
 * {
 *   error: "Already checked in today"
 * }
 */
export async function action({ request }: Route.ActionArgs) {
  // Create Supabase client and require authentication
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  // Get authenticated user
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  // Validate request method (POST only)
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405, headers });
  }

  try {
    const db = drizzle;

    // Get today's date
    const today = new Date().toISOString().split("T")[0];

    // Check if already checked in today
    const [existingRecord] = await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.user_id, user.id),
          eq(attendanceRecords.attendance_date, today)
        )
      )
      .limit(1);

    if (existingRecord) {
      return data({ error: "Already checked in today" }, { status: 400, headers });
    }

    // Get yesterday's record to check consecutive days
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const [yesterdayRecord] = await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.user_id, user.id),
          eq(attendanceRecords.attendance_date, yesterdayStr)
        )
      )
      .limit(1);

    // Calculate consecutive days
    const consecutiveDays = yesterdayRecord ? yesterdayRecord.consecutive_days + 1 : 1;

    // Calculate points (base + consecutive bonus)
    let pointsAwarded = BASE_POINTS;
    if (CONSECUTIVE_BONUSES[consecutiveDays]) {
      pointsAwarded += CONSECUTIVE_BONUSES[consecutiveDays];
    }

    // Create attendance record
    await db.insert(attendanceRecords).values({
      user_id: user.id,
      attendance_date: today,
      points_awarded: pointsAwarded,
      consecutive_days: consecutiveDays,
    });

    // Get or create user points record
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

    // Update points
    const newBalance = pointBalance.current_balance + pointsAwarded;
    const newTotalEarned = pointBalance.total_earned + pointsAwarded;

    await db
      .update(userPoints)
      .set({
        current_balance: newBalance,
        total_earned: newTotalEarned,
      })
      .where(eq(userPoints.user_id, user.id));

    // Create transaction record
    await db.insert(pointTransactions).values({
      user_id: user.id,
      amount: pointsAwarded,
      balance_after: newBalance,
      type: "reward",
      reason: `Daily check-in (Day ${consecutiveDays})`,
      reference_id: `attendance_${today}`,
    });

    await createNotification({
      user_id: user.id,
      type: "checkin",
      title: "출석체크",
      body: `나냥 젤리 ${pointsAwarded}개가 도착했어요.💜`,
      subtitle: "출석체크하고 젤리 받아가세요!",
      metadata: {
        points_awarded: pointsAwarded,
        consecutive_days: consecutiveDays,
      },
    });

    return data(
      {
        success: true,
        pointsAwarded,
        consecutiveDays,
        newBalance,
      },
      { headers }
    );
  } catch (err) {
    console.error("Error processing check-in:", err);
    return data({ error: "Failed to process check-in" }, { status: 500, headers });
  }
}
