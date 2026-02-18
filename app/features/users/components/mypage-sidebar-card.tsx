/**
 * MyPage Sidebar Card
 *
 * 우측 사이드바. dashboard.tsx에서만 사용.
 * Figma F8 스펙: 유저 프로필, 젤리 잔액, 출석 카드, 메뉴 섹션.
 */

import { Link, useFetcher, useLocation } from "react-router";

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

const ACTIVITY_MENU = [
  { label: "팔로잉 목록", href: "/dashboard/likes?tab=following" },
  { label: "좋아요 목록", href: "/dashboard/likes?tab=likes" },
  { label: "내 키워드북", href: "/account/edit?tab=keywords" },
  { label: "세이프티 수정", href: "/account/edit?tab=safety" },
  { label: "이미지/캐릭터 생성", href: "/characters/create" },
];

const CREATOR_MENU = [
  { label: "크리에이터 도전하기", href: "/characters/create" },
];

const BENEFIT_MENU = [
  { label: "출석체크하기", href: "/attendance" },
];

export default function MypageSidebarCard({
  user,
  profile,
  points,
  attendance,
}: MypageSidebarCardProps) {
  const fetcher = useFetcher();
  const location = useLocation();
  const isCheckingIn = fetcher.state !== "idle";

  const handleCheckIn = () => {
    fetcher.submit(null, {
      method: "POST",
      action: "/api/attendance/checkin",
    });
  };

  const isActive = (href: string) => {
    const [path, query] = href.split("?");
    if (location.pathname !== path) return false;
    if (!query) return true;
    return location.search.includes(query);
  };

  return (
    <div className="sticky top-4 flex w-[400px] flex-col gap-4">
      {/* 1. 유저 프로필 */}
      <div className="rounded-xl border border-[#E9EAEB] bg-white p-4 dark:border-[#333741] dark:bg-[#1F242F]">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="bg-[#E9EAEB] text-[#414651] dark:bg-[#333741] dark:text-white">
              {user.name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-[#181D27] dark:text-white">
              {user.name}
            </h3>
            <div className="flex items-center gap-3 text-sm text-[#535862] dark:text-[#94969C]">
              <span>팔로워 {profile.follower_count}</span>
              <span>팔로잉 {profile.following_count}</span>
            </div>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          className="mt-3 w-full border-[#D5D7DA] text-[#414651] hover:bg-[#F5F5F5] dark:border-[#414651] dark:text-[#D5D7DA] dark:hover:bg-[#333741]"
        >
          <Link to="/dashboard">마이페이지</Link>
        </Button>
      </div>

      {/* 2. 냥젤리 (포인트) */}
      <div className="rounded-xl border border-[#E9EAEB] bg-white p-4 dark:border-[#333741] dark:bg-[#1F242F]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#535862] dark:text-[#94969C]">냥젤리</p>
            <p className="text-xl font-bold text-[#181D27] dark:text-white">
              🐾 {points.current_balance.toLocaleString()}젤리
            </p>
          </div>
          <Button
            asChild
            className="bg-[#00C4AF] text-white hover:bg-[#00b39e]"
          >
            <Link to="/points">충전</Link>
          </Button>
        </div>
      </div>

      {/* 3. 출석 카드 */}
      <div className="overflow-hidden rounded-xl border border-[#E9EAEB] bg-gradient-to-r from-[#00C4AF] to-[#00E5CC] p-4 dark:border-[#333741]">
        <p className="text-xs font-medium text-white/80">매일 출석</p>
        <p className="mt-1 text-lg font-bold text-white">
          냥젤리 400개 받기
        </p>
        <p className="mt-0.5 text-xs text-white/70">
          연속 {attendance.currentStreak}일째 출석 중
        </p>
        <Button
          onClick={handleCheckIn}
          disabled={attendance.checkedInToday || isCheckingIn}
          className={`mt-3 w-full ${
            attendance.checkedInToday
              ? "cursor-not-allowed bg-white/30 text-white/70"
              : "bg-white text-[#00C4AF] hover:bg-white/90"
          }`}
        >
          {attendance.checkedInToday ? "출석완료" : "일간 출석체크 하기"}
        </Button>
      </div>

      {/* 4. 활동 메뉴 */}
      <div className="rounded-xl border border-[#E9EAEB] bg-white p-4 dark:border-[#333741] dark:bg-[#1F242F]">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#717680] dark:text-[#94969C]">
          활동
        </h4>
        <div className="space-y-1">
          {ACTIVITY_MENU.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive(item.href)
                  ? "bg-[#E0F7F5] font-medium text-[#00897B] dark:bg-[#00C4AF]/10 dark:text-[#00C4AF]"
                  : "text-[#414651] hover:bg-[#F5F5F5] dark:text-[#D5D7DA] dark:hover:bg-[#333741]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 5. 크리에이터 */}
      <div className="rounded-xl border border-[#E9EAEB] bg-white p-4 dark:border-[#333741] dark:bg-[#1F242F]">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#717680] dark:text-[#94969C]">
          크리에이터
        </h4>
        {CREATOR_MENU.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="block rounded-lg px-3 py-2 text-sm text-[#00C4AF] transition-colors hover:bg-[#E0F7F5] dark:hover:bg-[#00C4AF]/10"
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* 6. 혜택 */}
      <div className="rounded-xl border border-[#E9EAEB] bg-white p-4 dark:border-[#333741] dark:bg-[#1F242F]">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#717680] dark:text-[#94969C]">
          혜택
        </h4>
        {BENEFIT_MENU.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="block rounded-lg px-3 py-2 text-sm text-[#414651] transition-colors hover:bg-[#F5F5F5] dark:text-[#D5D7DA] dark:hover:bg-[#333741]"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
