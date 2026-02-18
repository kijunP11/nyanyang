# F8 마이페이지 Phase 1: 내 콘텐츠 + 사이드바 리디자인

## 개요
대시보드 메인 화면을 **다크 테마에서 라이트 테마**로 전면 리디자인한다.
프로필 헤더, 콘텐츠 테이블(상태 배지), 빈 상태, **번호 페이지네이션**, 사이드바(출석 카드, 메뉴 섹션)를 Figma에 맞게 구현한다.

**스키마/API 변경 없음** — 기존 API 라우트를 그대로 재사용한다.

## 수정 파일 목록

| # | 파일 | 유형 |
|---|------|------|
| 1 | `users/layouts/dashboard.layout.tsx` | 수정 |
| 2 | `users/types.ts` | 수정 |
| 3 | `users/screens/dashboard.tsx` | 수정 (전면 리디자인) |
| 4 | `users/components/mypage-sidebar-card.tsx` | 수정 (전면 리디자인) |
| 5 | `users/screens/my-content.tsx` | 수정 (리다이렉트) |

---

## 1. `users/layouts/dashboard.layout.tsx` (수정)

다크 배경을 라이트로 전환하고, `points` 데이터를 레이아웃 컨텍스트에 추가한다.

**기존 코드:**
```typescript
import type { Route } from "./+types/dashboard.layout";
import { data, Outlet } from "react-router";
import makeServerClient from "~/core/lib/supa-client.server";
import { getUserProfileWithCounts } from "../lib/queries.server";
import type { DashboardLayoutContext } from "../types";

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  const profile = user ? await getUserProfileWithCounts(user.id) : null;

  const url = new URL(request.url);
  const apiUrl = new URL("/api/attendance/checkin", url.origin);
  const attendanceData = await fetch(apiUrl.toString(), {
    headers: request.headers,
  })
    .then((res) => (res.ok ? res.json() : { checkedInToday: false, currentStreak: 0 }))
    .catch(() => ({ checkedInToday: false, currentStreak: 0 }));

  return data(
    { user, profile, attendanceData } satisfies DashboardLayoutContext,
    { headers }
  );
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-[#111111]">
      <Outlet context={loaderData} />
    </div>
  );
}
```

**변경 후:**
```typescript
import type { Route } from "./+types/dashboard.layout";
import { data, Outlet } from "react-router";
import { eq } from "drizzle-orm";
import makeServerClient from "~/core/lib/supa-client.server";
import drizzle from "~/core/db/drizzle-client.server";
import { getUserProfileWithCounts } from "../lib/queries.server";
import { userPoints } from "../../points/schema";
import type { DashboardLayoutContext } from "../types";

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  const profile = user ? await getUserProfileWithCounts(user.id) : null;

  const url = new URL(request.url);
  const apiUrl = new URL("/api/attendance/checkin", url.origin);

  const [attendanceData, pointsData] = await Promise.all([
    fetch(apiUrl.toString(), { headers: request.headers })
      .then((res) => (res.ok ? res.json() : { checkedInToday: false, currentStreak: 0 }))
      .catch(() => ({ checkedInToday: false, currentStreak: 0 })),
    user
      ? drizzle
          .select()
          .from(userPoints)
          .where(eq(userPoints.user_id, user.id))
          .limit(1)
          .then(([result]) => result || { current_balance: 0, total_earned: 0, total_spent: 0 })
          .catch(() => ({ current_balance: 0, total_earned: 0, total_spent: 0 }))
      : { current_balance: 0, total_earned: 0, total_spent: 0 },
  ]);

  return data(
    { user, profile, attendanceData, points: pointsData } satisfies DashboardLayoutContext,
    { headers }
  );
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#181D27]">
      <Outlet context={loaderData} />
    </div>
  );
}
```

**핵심 변경:**
- `bg-[#111111]` → `bg-white dark:bg-[#181D27]`
- `points` 데이터를 레이아웃 로더에서 fetch (dashboard.tsx 로더에서 제거)
- `attendanceData`와 `pointsData`를 `Promise.all`로 병렬 fetch

---

## 2. `users/types.ts` (수정)

`DashboardLayoutContext`에 `points` 필드를 추가한다.

**기존 코드:**
```typescript
export interface DashboardLayoutContext {
  user: User | null;
  profile: DashboardProfile | null;
  attendanceData: DashboardAttendance;
}
```

**변경 후:**
```typescript
export interface DashboardPoints {
  current_balance: number;
  total_earned: number;
  total_spent: number;
}

export interface DashboardLayoutContext {
  user: User | null;
  profile: DashboardProfile | null;
  attendanceData: DashboardAttendance;
  points: DashboardPoints;
}
```

---

## 3. `users/screens/dashboard.tsx` (수정 — 전면 리디자인)

전면 리디자인: 라이트 테마, 프로필 헤더에 "회원정보 수정" 버튼, 상태 배지 테이블, 빈 상태, 번호 페이지네이션.
`points` fetch는 레이아웃 로더로 이동했으므로 dashboard 로더에서 제거한다.

```typescript
import type { Route } from "./+types/dashboard";

import { Edit, Trash2 } from "lucide-react";
import { Link, useFetcher, useLoaderData, useOutletContext, useSearchParams } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "~/core/components/ui/avatar";
import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/core/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/core/components/ui/table";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import {
  getMyCharacters,
  myCharactersQuerySchema,
} from "../../characters/lib/queries.server";
import MypageSidebarCard from "../components/mypage-sidebar-card";
import type { DashboardLayoutContext } from "../types";

export const meta: Route.MetaFunction = () => {
  return [{ title: `마이페이지 | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams);
  const { data: params } = myCharactersQuerySchema.safeParse(searchParams);

  const charactersResult = await getMyCharacters(user.id, params || { limit: 20, offset: 0 });

  return charactersResult;
}

export default function Dashboard() {
  const { characters, pagination } = useLoaderData<typeof loader>();
  const { user, profile, attendanceData, points } =
    useOutletContext<DashboardLayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const deleteFetcher = useFetcher();

  const limit = pagination.limit || 20;
  const currentPage = Math.floor((pagination.offset || 0) / limit) + 1;
  const totalPages = Math.ceil((pagination.total || 0) / limit);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("offset", String((page - 1) * limit));
    setSearchParams(params);
  };

  const handleDelete = (characterId: number) => {
    deleteFetcher.submit(null, {
      method: "DELETE",
      action: `/api/characters/${characterId}`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 번호 페이지네이션: 최대 5페이지 노출
  const getPageNumbers = () => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        {/* 좌측: 메인 콘텐츠 */}
        <div className="space-y-6">
          {/* 프로필 헤더 */}
          <div className="rounded-xl border border-[#E9EAEB] bg-white p-6 dark:border-[#333741] dark:bg-[#1F242F]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-[#E9EAEB] text-[#414651] dark:bg-[#333741] dark:text-white">
                    {profile?.name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-[#181D27] dark:text-white">
                    {profile?.name || user?.user_metadata?.name || "사용자"}
                  </h2>
                  <div className="mt-1 flex items-center gap-4 text-sm text-[#535862] dark:text-[#94969C]">
                    <span>팔로워 {profile?.follower_count || 0}</span>
                    <span>·</span>
                    <span>팔로잉 {profile?.following_count || 0}</span>
                  </div>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="border-[#D5D7DA] text-[#414651] hover:bg-[#F5F5F5] dark:border-[#414651] dark:text-[#D5D7DA] dark:hover:bg-[#333741]"
              >
                <Link to="/account/edit">회원정보 수정</Link>
              </Button>
            </div>
          </div>

          {/* 전체 작품 테이블 */}
          <div className="rounded-xl border border-[#E9EAEB] bg-white dark:border-[#333741] dark:bg-[#1F242F]">
            <div className="flex items-center justify-between border-b border-[#E9EAEB] p-6 dark:border-[#333741]">
              <h3 className="text-lg font-semibold text-[#181D27] dark:text-white">
                전체 작품
              </h3>
            </div>

            {characters.length === 0 ? (
              /* 빈 상태 */
              <div className="flex flex-col items-center justify-center px-6 py-16">
                {/* 실루엣 아이콘 */}
                <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-[#F5F5F5] dark:bg-[#333741]">
                  <svg
                    className="h-16 w-16 text-[#A4A7AE] dark:text-[#717680]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <p className="mb-2 text-lg font-medium text-[#181D27] dark:text-white">
                  내 캐릭터가 없습니다
                </p>
                <p className="mb-6 text-center text-[#535862] dark:text-[#94969C]">
                  첫 번째 캐릭터를 만들어보세요!
                </p>
                <Button
                  asChild
                  className="bg-[#00C4AF] text-white hover:bg-[#00b39e]"
                >
                  <Link to="/characters/create">캐릭터 생성하기</Link>
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#E9EAEB] hover:bg-transparent dark:border-[#333741]">
                      <TableHead className="text-[#535862] dark:text-[#94969C]">
                        작품명
                      </TableHead>
                      <TableHead className="text-[#535862] dark:text-[#94969C]">
                        캐릭터명
                      </TableHead>
                      <TableHead className="text-[#535862] dark:text-[#94969C]">
                        상태
                      </TableHead>
                      <TableHead className="text-[#535862] dark:text-[#94969C]">
                        만든 일자
                      </TableHead>
                      <TableHead className="text-right text-[#535862] dark:text-[#94969C]">
                        관리
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {characters.map((character: any) => (
                      <TableRow
                        key={character.character_id}
                        className="border-[#E9EAEB] hover:bg-[#F9FAFB] dark:border-[#333741] dark:hover:bg-[#262B36]"
                      >
                        <TableCell className="font-medium text-[#181D27] dark:text-white">
                          {character.display_name || character.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={character.avatar_url || undefined}
                              />
                              <AvatarFallback className="bg-[#E9EAEB] text-xs text-[#414651] dark:bg-[#333741] dark:text-white">
                                {(character.display_name || "C")[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[#181D27] dark:text-white">
                              {character.display_name || character.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={character.status} />
                        </TableCell>
                        <TableCell className="text-[#535862] dark:text-[#94969C]">
                          {formatDate(character.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="text-[#535862] hover:text-[#181D27] dark:text-[#94969C] dark:hover:text-white"
                            >
                              <Link
                                to={`/characters/${character.character_id}/edit`}
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={deleteFetcher.state !== "idle"}
                                  className="text-red-400 hover:text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="border-[#E9EAEB] bg-white dark:border-[#333741] dark:bg-[#1F242F]">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-[#181D27] dark:text-white">
                                    캐릭터 삭제
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-[#535862] dark:text-[#94969C]">
                                    "{character.display_name || character.name}"
                                    캐릭터를 삭제하시겠습니까? 이 작업은 되돌릴 수
                                    없습니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-[#D5D7DA] text-[#414651] dark:border-[#414651] dark:text-[#D5D7DA]">
                                    취소
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDelete(character.character_id)
                                    }
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    삭제
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* 번호 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 border-t border-[#E9EAEB] p-4 dark:border-[#333741]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="text-[#535862] hover:text-[#181D27] disabled:text-[#D5D7DA] dark:text-[#94969C] dark:hover:text-white dark:disabled:text-[#414651]"
                    >
                      이전
                    </Button>
                    {getPageNumbers().map((page) => (
                      <Button
                        key={page}
                        variant="ghost"
                        size="sm"
                        onClick={() => goToPage(page)}
                        className={
                          page === currentPage
                            ? "bg-[#00C4AF] text-white hover:bg-[#00b39e] hover:text-white"
                            : "text-[#535862] hover:bg-[#F5F5F5] hover:text-[#181D27] dark:text-[#94969C] dark:hover:bg-[#333741] dark:hover:text-white"
                        }
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="text-[#535862] hover:text-[#181D27] disabled:text-[#D5D7DA] dark:text-[#94969C] dark:hover:text-white dark:disabled:text-[#414651]"
                    >
                      다음
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 우측: 사이드바 (lg 이상에서만 표시) */}
        <div className="hidden lg:block">
          <MypageSidebarCard
            user={{
              name:
                profile?.name || user?.user_metadata?.name || "사용자",
              avatarUrl:
                profile?.avatar_url ||
                user?.user_metadata?.avatar_url ||
                null,
              email: user?.email || "",
            }}
            profile={{
              follower_count: profile?.follower_count || 0,
              following_count: profile?.following_count || 0,
            }}
            points={{
              current_balance: points?.current_balance || 0,
            }}
            attendance={attendanceData || { checkedInToday: false, currentStreak: 0 }}
          />
        </div>
      </div>
    </div>
  );
}

/** 상태 배지 */
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<
    string,
    { label: string; className: string; dot: string }
  > = {
    approved: {
      label: "공개",
      className:
        "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
      dot: "bg-green-500",
    },
    pending: {
      label: "심사중",
      className:
        "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
      dot: "bg-orange-500",
    },
    pending_review: {
      label: "심사중",
      className:
        "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
      dot: "bg-orange-500",
    },
    rejected: {
      label: "심사불가",
      className:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
      dot: "bg-red-500",
    },
    draft: {
      label: "임시저장",
      className:
        "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20",
      dot: "bg-gray-500",
    },
  };
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <Badge variant="outline" className={config.className}>
      <span className={`mr-2 h-2 w-2 rounded-full ${config.dot}`} />
      {config.label}
    </Badge>
  );
}
```

**핵심 변경:**
- 다크 테마 하드코딩 → 라이트/다크 반응형 색상
- `points` fetch 제거 (레이아웃으로 이동)
- 이전/다음 버튼 → **번호 페이지네이션** (`getPageNumbers()` 최대 5페이지)
- 프로필 헤더에 "회원정보 수정" 버튼 → `/account/edit`
- 빈 상태에 "캐릭터 생성하기" 버튼 (Figma CTA 텍스트)

---

## 4. `users/components/mypage-sidebar-card.tsx` (수정 — 전면 리디자인)

라이트 테마, Figma 사이드바 스펙 반영: 유저 프로필, 젤리 잔액+충전, 출석 카드(그라데이션 bg, CTA), 메뉴 섹션(활동/크리에이터/혜택), 현재 라우트 하이라이트.

```typescript
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
  { label: "세이프티 설정", href: "/account/edit?tab=safety" },
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

  /** 현재 경로가 메뉴 href와 일치하는지 (query 포함 비교) */
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
              ? "bg-white/30 text-white/70 cursor-not-allowed"
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
```

**핵심 변경:**
- 다크 하드코딩 → 라이트/다크 반응형 (`bg-white dark:bg-[#1F242F]` 등)
- 사이드바 너비: 340px → 400px (Figma 스펙)
- 유저 프로필에 `[마이페이지]` 버튼 추가
- 젤리 잔액에 🐾 발바닥 아이콘 + `N젤리` 표기 + `[충전]` 버튼
- 출석 카드: **그라데이션 배경** (`from-[#00C4AF] to-[#00E5CC]`), "매일 출석" 라벨, "일간 출석체크 하기" CTA
- 메뉴를 상수 배열로 분리 (`ACTIVITY_MENU`, `CREATOR_MENU`, `BENEFIT_MENU`)
- `useLocation()` 기반 **활성 메뉴 하이라이트** (`bg-[#E0F7F5]`)

---

## 5. `users/screens/my-content.tsx` (수정 — 리다이렉트)

기존 my-content 화면은 dashboard와 중복이므로 `/dashboard`로 리다이렉트한다.

**전체 파일을 다음으로 교체:**
```typescript
import { redirect } from "react-router";

export function loader() {
  return redirect("/dashboard");
}

export default function MyContentRedirect() {
  return null;
}
```

---

## 참고 파일 (읽기 전용 — 수정하지 않음)

| 파일 | 용도 |
|------|------|
| `characters/lib/queries.server.ts` | `getMyCharacters()`, `myCharactersQuerySchema` |
| `points/schema.ts` | `userPoints` 테이블 스키마 |
| `core/components/ui/table.tsx` | shadcn Table |
| `core/components/ui/alert-dialog.tsx` | shadcn AlertDialog |
| `core/components/ui/avatar.tsx` | shadcn Avatar |
| `core/components/ui/badge.tsx` | shadcn Badge |
| `core/components/ui/button.tsx` | shadcn Button |

## 라이트 테마 컬러 레퍼런스

| 용도 | 라이트 | 다크 |
|------|--------|------|
| 배경 | `bg-white` | `dark:bg-[#181D27]` |
| 카드 bg | `bg-white border-[#E9EAEB]` | `dark:bg-[#1F242F] dark:border-[#333741]` |
| 제목 텍스트 | `text-[#181D27]` | `dark:text-white` |
| 보조 텍스트 | `text-[#535862]` | `dark:text-[#94969C]` |
| 연한 텍스트 | `text-[#717680]` | `dark:text-[#717680]` |
| 매우 연한 텍스트 | `text-[#A4A7AE]` | `dark:text-[#535862]` |
| 액센트 (CTA) | `bg-[#00C4AF] text-white` | 동일 |
| 메뉴 호버 | `hover:bg-[#F5F5F5]` | `dark:hover:bg-[#333741]` |
| 활성 메뉴 | `bg-[#E0F7F5] text-[#00897B]` | `dark:bg-[#00C4AF]/10 dark:text-[#00C4AF]` |
| 테이블 행 호버 | `hover:bg-[#F9FAFB]` | `dark:hover:bg-[#262B36]` |

## 검증 체크리스트

- [ ] `npm run typecheck` 통과
- [ ] `/dashboard` → 라이트 테마 프로필 헤더 + 콘텐츠 테이블 + 사이드바
- [ ] 프로필 헤더에 "회원정보 수정" 버튼 → `/account/edit` 이동
- [ ] 상태 배지 색상 정확 (green/orange/red) — 라이트/다크 모두
- [ ] 수정 버튼 → `/characters/:id/edit` 이동
- [ ] 삭제 버튼 → AlertDialog → "삭제" 클릭 → 삭제 실행
- [ ] 빈 상태 → 실루엣 아이콘 + "내 캐릭터가 없습니다" + "캐릭터 생성하기" 버튼
- [ ] 번호 페이지네이션: 현재 페이지 강조, 최대 5페이지 표시, 이전/다음 비활성 처리
- [ ] 사이드바 유저 프로필: 아바타, 이름, 팔로워/팔로잉, [마이페이지] 버튼
- [ ] 사이드바 젤리 잔액: 🐾 N젤리 + [충전] 버튼 → `/points`
- [ ] 사이드바 출석 카드: 그라데이션 bg, "매일 출석", "냥젤리 400개 받기", CTA 클릭 → 출석 → 버튼 비활성
- [ ] 사이드바 메뉴: 활동/크리에이터/혜택 섹션, 현재 라우트 메뉴 하이라이트
- [ ] `/dashboard/my-content` → `/dashboard` 리다이렉트 동작
- [ ] `lg` 미만 해상도에서 사이드바 숨김 (`hidden lg:block`)
