/**
 * MyPage Sidebar Card
 *
 * 우측 사이드바 카드. dashboard.tsx에서만 사용.
 */

import { Link, useFetcher } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "~/core/components/ui/avatar";
import { Button } from "~/core/components/ui/button";

interface MypageSidebarCardProps {
  user: {
    name: string;
    avatarUrl: string | null;
    email: string;
  };
  profile: {
    follower_count: number;
    following_count: number;
  };
  points: {
    current_balance: number;
  };
  attendance: {
    checkedInToday: boolean;
    currentStreak: number;
  };
}

export default function MypageSidebarCard({
  user,
  profile,
  points,
  attendance,
}: MypageSidebarCardProps) {
  const fetcher = useFetcher();
  const isCheckingIn = fetcher.state !== "idle";

  const handleCheckIn = () => {
    fetcher.submit(null, {
      method: "POST",
      action: "/api/attendance/checkin",
    });
  };

  return (
    <div className="w-[340px] flex flex-col gap-4 sticky top-4">
      {/* 1. 유저 프로필 영역 */}
      <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="bg-[#3f3f46] text-white">
              {user.name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{user.name}</h3>
            <div className="flex items-center gap-3 text-sm text-[#9ca3af]">
              <span>팔로워 {profile.follower_count}</span>
              <span>팔로잉 {profile.following_count}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 냥젤리 (포인트) */}
      <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#9ca3af]">냥젤리</p>
            <p className="text-xl font-bold text-white">
              {points.current_balance.toLocaleString()}
            </p>
          </div>
          <Button
            asChild
            className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg"
          >
            <Link to="/points">충전하기</Link>
          </Button>
        </div>
      </div>

      {/* 3. 출석 배너 */}
      <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">냥젤리 400개 받기</p>
            <p className="text-sm text-[#9ca3af]">
              연속 {attendance.currentStreak}일째 출석 중
            </p>
          </div>
          <Button
            onClick={handleCheckIn}
            disabled={attendance.checkedInToday || isCheckingIn}
            className={
              attendance.checkedInToday
                ? "bg-[#3f3f46] text-[#9ca3af] cursor-not-allowed"
                : "bg-[#14b8a6] hover:bg-[#0d9488] text-white"
            }
          >
            {attendance.checkedInToday ? "출석완료" : "출석하기"}
          </Button>
        </div>
      </div>

      {/* 4. 활동 메뉴 */}
      <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-4">
        <h4 className="text-sm font-medium text-[#9ca3af] mb-3">활동</h4>
        <div className="space-y-2">
          <Link
            to="/dashboard/likes?tab=following"
            className="block px-3 py-2 rounded-lg text-white hover:bg-[#3f3f46] transition-colors"
          >
            팔로잉
          </Link>
          <Link
            to="/dashboard/likes?tab=likes"
            className="block px-3 py-2 rounded-lg text-white hover:bg-[#3f3f46] transition-colors"
          >
            좋아요
          </Link>
          <Link
            to="/account/edit?tab=safety"
            className="block px-3 py-2 rounded-lg text-white hover:bg-[#3f3f46] transition-colors"
          >
            세이프티
          </Link>
          <Link
            to="/characters/create"
            className="block px-3 py-2 rounded-lg text-white hover:bg-[#3f3f46] transition-colors"
          >
            캐릭터 생성
          </Link>
        </div>
      </div>

      {/* 5. 크리에이터 섹션 */}
      <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-4">
        <h4 className="text-sm font-medium text-[#9ca3af] mb-3">크리에이터</h4>
        <Link
          to="/characters/create"
          className="block px-3 py-2 rounded-lg text-[#14b8a6] hover:bg-[#14b8a6]/10 transition-colors"
        >
          크리에이터 도전하기
        </Link>
      </div>

      {/* 6. 혜택 섹션 */}
      <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-4">
        <h4 className="text-sm font-medium text-[#9ca3af] mb-3">혜택</h4>
        <Link
          to="/attendance"
          className="block px-3 py-2 rounded-lg text-white hover:bg-[#3f3f46] transition-colors"
        >
          출석체크
        </Link>
      </div>
    </div>
  );
}
