/**
 * Attendance Screen
 *
 * Daily check-in interface with calendar view and streak tracking.
 */

import type { Route } from "./+types/attendance";

import { useLoaderData, useFetcher } from "react-router";

/**
 * Loader function for fetching attendance data
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const apiUrl = new URL("/api/attendance/checkin", url.origin);

  const response = await fetch(apiUrl.toString(), {
    headers: request.headers,
  });

  if (!response.ok) {
    throw new Response("Failed to fetch attendance data", { status: response.status });
  }

  const data = await response.json();
  return data;
}

/**
 * Attendance Screen Component
 */
export default function AttendanceScreen() {
  const { checkedInToday, currentStreak, recentRecords } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const isSubmitting = fetcher.state === "submitting";

  // Get calendar data for current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  // Create set of checked-in dates
  const checkedInDates = new Set(
    recentRecords.map((r: any) => r.date)
  );

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Handle check-in
  const handleCheckIn = () => {
    fetcher.submit(
      {},
      {
        method: "POST",
        action: "/api/attendance/checkin",
      }
    );
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">출석 체크</h1>
        <p className="text-muted-foreground mt-2">
          매일 출석하고 포인트를 받아보세요!
        </p>
      </div>

      {/* Check-in Card */}
      <div className="bg-card rounded-lg border p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {checkedInToday ? "오늘 출석 완료! 🎉" : "오늘의 출석 체크"}
            </h2>
            <p className="text-muted-foreground">
              현재 연속 출석: <span className="font-semibold text-primary">{currentStreak}일</span>
            </p>
          </div>
          <button
            onClick={handleCheckIn}
            disabled={checkedInToday || isSubmitting}
            className="rounded-md bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkedInToday ? "✓ 출석 완료" : "출석 체크"}
          </button>
        </div>

        {/* Rewards Info */}
        <div className="bg-muted rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">출석 보상</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-background rounded p-2">
              <div className="text-muted-foreground mb-1">매일</div>
              <div className="font-semibold">+10 포인트</div>
            </div>
            <div className="bg-background rounded p-2">
              <div className="text-muted-foreground mb-1">7일 연속</div>
              <div className="font-semibold text-primary">+50 포인트</div>
            </div>
            <div className="bg-background rounded p-2">
              <div className="text-muted-foreground mb-1">14일 연속</div>
              <div className="font-semibold text-primary">+100 포인트</div>
            </div>
            <div className="bg-background rounded p-2">
              <div className="text-muted-foreground mb-1">30일 연속</div>
              <div className="font-semibold text-primary">+300 포인트</div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-bold mb-4">
          {today.getFullYear()}년 {today.getMonth() + 1}월 출석 현황
        </h2>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} />;
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isCheckedIn = checkedInDates.has(dateStr);
            const isToday = day === today.getDate();

            return (
              <div
                key={day}
                className={`
                  aspect-square flex items-center justify-center rounded-lg text-sm font-medium
                  ${isToday ? "ring-2 ring-primary" : ""}
                  ${isCheckedIn ? "bg-primary text-primary-foreground" : "bg-muted"}
                `}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Success Message */}
      {fetcher.data?.success && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom">
          <div className="font-semibold mb-1">출석 완료! 🎉</div>
          <div className="text-sm">
            +{fetcher.data.pointsAwarded} 포인트 획득 (연속 {fetcher.data.consecutiveDays}일)
          </div>
        </div>
      )}
    </div>
  );
}
