/**
 * Attendance Page Component
 *
 * This page displays a stamp collection grid for daily attendance check.
 * Users can see their consecutive attendance days and check in daily.
 */
import type { Route } from "./+types/attendance";

import { Form, useFetcher, useLoaderData } from "react-router";
import { data } from "react-router";

import { Button } from "~/core/components/ui/button";
import makeServerClient from "~/core/lib/supa-client.server";
import type { Database } from "database.types";
import { checkAttendance } from "~/features/attendance/lib/attendance.server";
import { StampGrid } from "~/features/attendance/components/stamp-grid";

interface LoaderData {
  consecutiveDays: number;
  isCheckedIn: boolean;
  isLoggedIn: boolean;
}

export const meta: Route.MetaFunction = () => [
  { title: `출석체크 | ${import.meta.env.VITE_APP_NAME}` },
];

/**
 * Loader function for fetching attendance data
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);

  const defaultData: LoaderData = {
    consecutiveDays: 0,
    isCheckedIn: false,
    isLoggedIn: false,
  };

  try {
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return defaultData;
    }

    const today = new Date().toISOString().split("T")[0];

    // Get latest attendance record
    const { data: latestRecord } = await client
      .from("attendance_records")
      .select("consecutive_days, attendance_date")
      .eq("user_id", user.id)
      .order("attendance_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const consecutiveDays = latestRecord?.consecutive_days || 0;
    const isCheckedIn = latestRecord?.attendance_date === today;

    return {
      consecutiveDays,
      isCheckedIn,
      isLoggedIn: true,
    };
  } catch (error) {
    console.error("Attendance loader error:", error);
    return defaultData;
  }
}

/**
 * Action function for handling attendance check
 */
export async function action({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await checkAttendance(client, user.id);

  if (!result.success) {
    return data(
      { error: result.error || "Failed to check attendance" },
      { status: result.error === "Already checked today" ? 400 : 500 },
    );
  }

  return data({
    success: true,
    consecutiveDays: result.consecutiveDays,
    pointsAwarded: result.pointsAwarded,
  });
}

export default function AttendancePage() {
  const { consecutiveDays, isCheckedIn, isLoggedIn } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();

  // Get updated consecutive days from action result
  const currentConsecutiveDays =
    fetcher.data &&
    "success" in fetcher.data &&
    fetcher.data.success &&
    fetcher.data.consecutiveDays
      ? fetcher.data.consecutiveDays
      : consecutiveDays;

  const currentCheckedIn =
    isCheckedIn ||
    (fetcher.data &&
      "success" in fetcher.data &&
      fetcher.data.success === true);

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-6 py-16">
        <h1 className="text-3xl font-bold">출석체크</h1>
        <p className="text-muted-foreground text-center">
          출석체크를 하려면 로그인이 필요합니다.
        </p>
        <Button asChild>
          <a href="/login">로그인하기</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex flex-col gap-8 py-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold">스탬프 찍어라</h1>
        <p className="text-muted-foreground text-lg">
          매일매일 방문하셔서 스탬프를 모아주세요
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-6 rounded-lg bg-muted/50 p-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">보유 스탬프</p>
          <p className="text-2xl font-bold">
            {Math.min(currentConsecutiveDays, 12)}개
          </p>
        </div>
        <div className="h-12 w-px bg-border" />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">연속 출석</p>
          <p className="text-2xl font-bold">{currentConsecutiveDays}일</p>
        </div>
      </div>

      {/* Stamp Grid */}
      <div className="flex justify-center">
        <StampGrid filledCount={Math.min(currentConsecutiveDays, 12)} />
      </div>

      {/* Check In Button */}
      <div className="flex justify-center">
        <fetcher.Form method="post">
          <Button
            type="submit"
            size="lg"
            disabled={currentCheckedIn || fetcher.state === "submitting"}
            className="min-w-[200px]"
          >
            {fetcher.state === "submitting"
              ? "처리 중..."
              : currentCheckedIn
                ? "오늘 출석 완료! ✓"
                : "출석체크하기"}
          </Button>
        </fetcher.Form>
      </div>

      {/* Reward Info */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">보상 안내</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• 매일 출석: 100 포인트</li>
          <li>• 7일 연속 출석: 보너스 500 포인트</li>
          <li>• 연속 출석이 끊기면 1일부터 다시 시작됩니다</li>
        </ul>
      </div>
    </div>
  );
}

