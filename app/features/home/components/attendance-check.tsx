/**
 * Attendance Check Component
 * 
 * One-click button for daily and cumulative rewards
 */
import { Calendar, Gift } from "lucide-react";
import { useState } from "react";

import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";

interface AttendanceCheckProps {
  dailyReward?: number;
  cumulativeDays?: number;
  cumulativeReward?: number;
  onCheckIn?: () => void;
}

export function AttendanceCheck({
  dailyReward = 100,
  cumulativeDays = 0,
  cumulativeReward = 500,
  onCheckIn,
}: AttendanceCheckProps) {
  const [checkedIn, setCheckedIn] = useState(false);

  const handleCheckIn = () => {
    if (checkedIn) return;
    setCheckedIn(true);
    onCheckIn?.();
  };

  return (
    <Card className="bg-gradient-to-br from-[#41C7BD]/10 to-[#41C7BD]/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#41C7BD]" />
          <CardTitle className="text-lg">매일매일 출석체크</CardTitle>
        </div>
        <CardDescription>
          매일 출석하고 보상을 받아가세요!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily Reward */}
        <div className="flex items-center justify-between rounded-lg bg-background/50 p-3">
          <div>
            <p className="text-sm font-medium">일일 보상</p>
            <p className="text-muted-foreground text-xs">
              오늘 출석하면 받을 수 있어요
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-[#41C7BD]" />
            <span className="font-semibold">{dailyReward} 포인트</span>
          </div>
        </div>

        {/* Cumulative Reward */}
        {cumulativeDays > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-background/50 p-3">
            <div>
              <p className="text-sm font-medium">누적 보상</p>
              <p className="text-muted-foreground text-xs">
                {cumulativeDays}일 연속 출석 중
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-[#41C7BD]" />
              <span className="font-semibold">{cumulativeReward} 포인트</span>
            </div>
          </div>
        )}

        {/* Check In Button */}
        <Button
          onClick={handleCheckIn}
          disabled={checkedIn}
          className="w-full bg-[#41C7BD] text-white hover:bg-[#41C7BD]/90"
        >
          {checkedIn ? "오늘 출석 완료! ✓" : "출석체크 하기"}
        </Button>
      </CardContent>
    </Card>
  );
}


