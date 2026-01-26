/**
 * Daily Attendance Card Component
 *
 * A card component displayed in the right sidebar for daily check-in.
 * Shows attendance status, reward information, and check-in button.
 */

import { Calendar, Gift } from "lucide-react";
import { useFetcher, useRevalidator } from "react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/core/components/ui/card";
import { Button } from "~/core/components/ui/button";

interface DailyAttendanceCardProps {
  checkedInToday: boolean;
  currentStreak: number;
}

/**
 * Daily Attendance Card Component
 */
export default function DailyAttendanceCard({
  checkedInToday,
  currentStreak,
}: DailyAttendanceCardProps) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  const isSubmitting = fetcher.state === "submitting";

  // Show success toast when check-in completes
  useEffect(() => {
    if (fetcher.data?.success) {
      toast.success("출석 완료! 🎉", {
        description: `${fetcher.data.pointsAwarded} 냥젤리를 받았습니다! (연속 ${fetcher.data.consecutiveDays}일)`,
      });
      // Revalidate to update the card state
      revalidator.revalidate();
    } else if (fetcher.data?.error) {
      toast.error("출석 실패", {
        description: fetcher.data.error,
      });
    }
  }, [fetcher.data, revalidator]);

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
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">매일 출석</CardTitle>
          </div>
          <Gift className="h-5 w-5 text-primary/60" />
        </div>
        <CardDescription className="text-sm">
          매일 출석하고 젤리 받기
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-primary/5 rounded-lg p-3 text-center">
          <p className="text-sm text-muted-foreground mb-1">보상</p>
          <p className="text-lg font-bold text-primary">냥젤리 400개 받기</p>
        </div>

        <Button
          onClick={handleCheckIn}
          disabled={checkedInToday || isSubmitting}
          className="w-full"
          size="lg"
        >
          {checkedInToday ? (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              출석 완료
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              일간 출석체크 하기
            </>
          )}
        </Button>

        {checkedInToday && (
          <p className="text-xs text-center text-muted-foreground">
            오늘 출석을 완료했습니다
          </p>
        )}

        {currentStreak > 0 && (
          <p className="text-xs text-center text-muted-foreground">
            연속 출석: {currentStreak}일
          </p>
        )}
      </CardContent>
    </Card>
  );
}

