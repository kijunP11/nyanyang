# F10 Section 00: Admin Layout + Dashboard 리디자인

## 개요

어드민 전용 사이드바 레이아웃 신규 생성 + 대시보드 Figma 기반 리디자인.
현재 어드민은 `private.layout.tsx`만 사용하며 전용 레이아웃이 없음.
GNB(NavigationBar) 없이 자체 사이드바 레이아웃으로 독립 운영.

---

## 수정/생성 파일 (5개)

| # | 파일 | 유형 |
|---|------|------|
| 1 | `app/features/admin/layouts/admin.layout.tsx` | **신규** |
| 2 | `app/features/admin/components/admin-sidebar.tsx` | **신규** |
| 3 | `app/features/admin/screens/dashboard.tsx` | 수정 |
| 4 | `app/features/admin/screens/placeholder.tsx` | **신규** |
| 5 | `app/routes.ts` | 수정 |

---

## 파일 1: `app/features/admin/layouts/admin.layout.tsx` (신규)

어드민 전용 레이아웃. 사이드바 + 메인 콘텐츠 영역.

```tsx
import type { Route } from "./+types/admin.layout";

import { data, Outlet } from "react-router";

import { requireAdmin, getAdminInfo } from "../lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { getUserProfileWithCounts } from "~/features/users/lib/queries.server";

import { AdminSidebar } from "../components/admin-sidebar";

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) throw new Response("Unauthorized", { status: 401 });

  const profile = await getUserProfileWithCounts(user.id);

  return data(
    {
      admin: {
        name: profile?.name || user.user_metadata?.name || "admin",
        email: user.email || "",
        avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
      },
    },
    { headers },
  );
}

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar admin={loaderData.admin} />
      <main className="flex-1 overflow-auto">
        <Outlet context={loaderData} />
      </main>
    </div>
  );
}
```

---

## 파일 2: `app/features/admin/components/admin-sidebar.tsx` (신규)

아코디언 사이드바 컴포넌트.

### 구현 요구사항:

**레이아웃:**
- 너비: `w-[240px]` 고정
- 배경: `bg-white`
- 오른쪽 보더: `border-r border-[#E9EAEB]`
- 높이: `h-screen sticky top-0`
- 내부 스크롤: `overflow-y-auto`

**상단:**
- NYANYANG 로고: `<img src="/logo3.png" alt="NYANYANG" className="h-[30px]" />`
- 검색 입력: `<div>` 형태의 검색 UI (placeholder "Search", lucide `Search` 아이콘)

**메뉴 구조:**

`useState`로 `openMenuId` 관리 (한 번에 하나의 메뉴만 펼침).
각 메뉴 그룹은 `button`으로 클릭 시 아코디언 토글. 하위 항목은 `NavLink`.

```ts
const MENU_GROUPS = [
  {
    id: "home",
    label: "홈",
    icon: Home, // lucide-react
    items: [], // 홈은 하위 항목 없이 직접 /admin 링크
    href: "/admin",
  },
  {
    id: "users",
    label: "유저관리",
    icon: Users,
    items: [
      { label: "유저 목록 / 검색", href: "/admin/users" },
      { label: "신고 내역", href: "/admin/reports/users", badge: 10 },
      { label: "제재 관리", href: "/admin/sanctions" },
      { label: "권한 관리", href: "/admin/permissions" },
    ],
  },
  {
    id: "characters",
    label: "캐릭터 관리",
    icon: Layers,
    items: [
      { label: "캐릭터 목록", href: "/admin/characters" },
      { label: "신고 캐릭터", href: "/admin/reports/characters", badge: 10 },
      { label: "승인 / 숨김 관리", href: "/admin/characters/moderation" },
      { label: "태그 / 세이프티 설정", href: "/admin/characters/settings" },
    ],
  },
  {
    id: "chat",
    label: "채팅 / 콘텐츠",
    icon: MessageSquare,
    items: [
      { label: "신고 채팅 로그 목록", href: "/admin/reports/chats" },
      { label: "금칙어 관리 화면", href: "/admin/chat/banned-words" },
    ],
  },
  {
    id: "payments",
    label: "결제 / 포인트",
    icon: CreditCard,
    items: [
      { label: "결제 내역", href: "/admin/payments" },
      { label: "환불 관리", href: "/admin/payments/refunds", badge: 10 },
      { label: "포인트 / 티켓 관리", href: "/admin/points" },
      { label: "추천인 / 정산", href: "/admin/referrals" },
    ],
  },
  {
    id: "stats",
    label: "통계 / 모니터링",
    icon: BarChart3,
    items: [
      { label: "사용 지표 (DAU / MAU)", href: "/admin/stats/usage" },
      { label: "사용 패턴 분석", href: "/admin/stats/patterns", badge: 10 },
      { label: "매출 / 경제 지표", href: "/admin/stats/revenue" },
      { label: "랭킹", href: "/admin/stats/ranking" },
    ],
  },
  {
    id: "notices",
    label: "공지 / 운영",
    icon: Bell,
    items: [
      { label: "공지사항 관리", href: "/admin/notices" },
      { label: "운영 메시지", href: "/admin/messages", badge: 10 },
      { label: "팝업 공지", href: "/admin/popups" },
      { label: "모델 상태 공지", href: "/admin/model-status" },
    ],
  },
  {
    id: "settings",
    label: "보안 / 설정",
    icon: Lock,
    items: [
      { label: "운영자 계정 관리", href: "/admin/settings/accounts" },
      { label: "권한 레벨 관리", href: "/admin/settings/roles", badge: 10 },
      { label: "감사 로그", href: "/admin/settings/audit-log" },
      { label: "보안 설정 (2FA / IP)", href: "/admin/settings/security" },
    ],
  },
];
```

**메뉴 그룹 렌더링:**
```tsx
// 하위 항목이 없는 메뉴 (홈): 직접 NavLink
// 하위 항목이 있는 메뉴: button 클릭 → 아코디언 토글

{group.items.length === 0 ? (
  <NavLink to={group.href} end className={...}>
    <Icon className="size-5" />
    <span>{group.label}</span>
    <ChevronDown className="size-4 ml-auto" />
  </NavLink>
) : (
  <>
    <button onClick={() => toggleMenu(group.id)} className={...}>
      <Icon className="size-5" />
      <span>{group.label}</span>
      {openMenuId === group.id ? (
        <ChevronUp className="size-4 ml-auto" />
      ) : (
        <ChevronDown className="size-4 ml-auto" />
      )}
    </button>
    {openMenuId === group.id && (
      <div className="flex flex-col">
        {group.items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `pl-11 pr-4 py-2 text-sm ${
                isActive
                  ? "bg-[#F5F5F5] text-[#181D27] font-semibold"
                  : "text-[#414651] hover:bg-[#F9FAFB]"
              }`
            }
          >
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-[#F5F5F5] text-[#535862] rounded-full px-2 py-0.5 text-xs">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    )}
  </>
)}
```

**스타일:**
- 메뉴 그룹 버튼: `flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-[#414651] hover:bg-[#F9FAFB] rounded-lg`
- 활성 하위 항목: `bg-[#F5F5F5] font-semibold text-[#181D27]`
- 배지: `bg-[#F5F5F5] text-[#535862] rounded-full px-2 py-0.5 text-xs font-medium`

**하단 프로필:**
```tsx
<div className="border-t border-[#E9EAEB] p-4 mt-auto">
  <div className="flex items-center gap-3">
    <Avatar className="size-8">
      <AvatarImage src={admin.avatarUrl ?? undefined} />
      <AvatarFallback>{admin.name.slice(0, 2)}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-[#181D27] truncate">{admin.name}</p>
      <p className="text-xs text-[#535862] truncate">admin setting</p>
    </div>
    <Link to="/logout" className="text-[#717680] hover:text-[#181D27]">
      <LogOut className="size-5" />
    </Link>
  </div>
</div>
```

**import:**
```tsx
import { useState } from "react";
import { NavLink, Link } from "react-router";
import {
  Home, Users, Layers, MessageSquare, CreditCard,
  BarChart3, Bell, Lock, ChevronDown, ChevronUp,
  Search, LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/core/components/ui/avatar";
```

**Props:**
```tsx
interface AdminSidebarProps {
  admin: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}
```

---

## 파일 3: `app/features/admin/screens/dashboard.tsx` (수정)

기존 대시보드를 Figma 기반으로 리디자인.

### Loader

기존 loader 유지 (stats API 호출). 변경 없음.

### UI 구조

```tsx
export default function AdminDashboard() {
  const { stats } = useLoaderData<typeof loader>();

  return (
    <div className="p-8 max-w-[1200px]">
      {/* 1. KPI 카드 */}
      <h2 className="text-lg font-semibold text-[#181D27] mb-4">KPI</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <KpiCard
          label="전체 유저 수"
          value={stats.stats.users.total_users}
          change={40}
          positive={true}
        />
        <KpiCard
          label="오늘 활성 유저(DAU)"
          value={stats.stats.messages.messages_today > 0
            ? stats.stats.users.new_users_today * 10  // 근사치 또는 하드코딩
            : 0}
          change={10}
          positive={false}
        />
        <KpiCard
          label="현재 접속 중"
          value={stats.stats.chats.active_chat_rooms_today}
          change={20}
          positive={true}
        />
      </div>

      {/* 2. 서비스 상태 + 긴급 알림 (2컬럼) */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* 서비스 상태 */}
        <div>
          <h2 className="text-lg font-semibold text-[#181D27] mb-4">서비스 상태</h2>
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#E9EAEB] p-4">
            <StatusCard label="모델 상태" name="Gemini" status="정상" color="green" />
            <StatusCard label="모델 상태" name="Opus" status="지연" color="orange" />
            <StatusCard label="서버 상태" status="정상" color="green" />
            <StatusCard label="로그 적재 상태" status="정상" color="green" />
          </div>
        </div>

        {/* 긴급 알림 / 처리 대기 */}
        <div>
          <h2 className="text-lg font-semibold text-[#181D27] mb-4">긴급 알림 / 처리 대기</h2>
          <div className="flex flex-col gap-3">
            <AlertCard
              icon="📢"
              label="신고 대기"
              count={12}
              href="/admin/reports/users"
              bgColor="bg-red-50 border-red-200"
              textColor="text-red-700"
            />
            <AlertCard
              icon="⚠️"
              label="자동 블라인드"
              count={3}
              href="/admin/reports/characters"
              bgColor="bg-orange-50 border-orange-200"
              textColor="text-orange-700"
            />
            <AlertCard
              icon="📄"
              label="환불요청"
              count={2}
              href="/admin/payments/refunds"
              bgColor="bg-yellow-50 border-yellow-200"
              textColor="text-yellow-700"
            />
          </div>
        </div>
      </div>

      {/* 3. 오늘 할일 / 운영 퀵 액션 */}
      <h2 className="text-lg font-semibold text-[#181D27] mb-4">오늘 할일 / 운영 퀵 액션</h2>
      <div className="grid grid-cols-5 gap-4">
        <QuickActionCard icon={Search} label="신고 처리하기" href="/admin/reports/users" />
        <QuickActionCard icon={Users} label="유저 검색" href="/admin/users" />
        <QuickActionCard icon={Layers} label="캐릭터 승인" href="/admin/characters" />
        <QuickActionCard icon={Bell} label="공지 등록" href="/admin/notices" />
        <QuickActionCard icon={BarChart3} label="통계 보기" href="/admin/stats/usage" />
      </div>
    </div>
  );
}
```

### 하위 컴포넌트 (같은 파일 내부에 정의)

**KpiCard:**
```tsx
function KpiCard({
  label,
  value,
  change,
  positive,
}: {
  label: string;
  value: number;
  change: number;
  positive: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E9EAEB] bg-white p-6">
      <p className="text-sm text-[#535862] mb-1">{label}</p>
      <p className="text-3xl font-bold text-[#181D27] mb-2">
        {value.toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        <span className={`text-sm font-medium ${positive ? "text-green-600" : "text-red-500"}`}>
          {positive ? "↑" : "↓"} {change}%
        </span>
        <span className="text-xs text-[#717680]">vs 전 달 대비</span>
      </div>
      {/* 스파크라인 (장식용 SVG) */}
      <svg className="mt-3 h-8 w-full" viewBox="0 0 100 30">
        <polyline
          points="0,25 15,20 30,22 45,15 60,18 75,10 100,5"
          fill="none"
          stroke={positive ? "#22c55e" : "#ef4444"}
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
```

**StatusCard:**
```tsx
function StatusCard({
  label,
  name,
  status,
  color,
}: {
  label: string;
  name?: string;
  status: string;
  color: "green" | "orange" | "red";
}) {
  const dotColor = {
    green: "bg-green-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
  }[color];

  return (
    <div className="rounded-lg bg-[#F9FAFB] p-4">
      <p className="text-xs text-[#717680] mb-2">{label}</p>
      {name && <p className="text-sm font-semibold text-[#181D27] mb-1">{name}</p>}
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${dotColor}`} />
        <span className="text-sm text-[#414651]">{status}</span>
      </div>
    </div>
  );
}
```

**AlertCard:**
```tsx
function AlertCard({
  icon,
  label,
  count,
  href,
  bgColor,
  textColor,
}: {
  icon: string;
  label: string;
  count: number;
  href: string;
  bgColor: string;
  textColor: string;
}) {
  return (
    <Link
      to={href}
      className={`flex items-center justify-between rounded-lg border p-4 ${bgColor}`}
    >
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className={`text-sm font-semibold ${textColor}`}>
          {label}
        </span>
        <span className={`text-sm font-bold ${textColor}`}>
          {count}건
        </span>
      </div>
      <span className="text-xs text-[#535862] border border-[#D5D7DA] rounded px-2 py-1">
        처리하기 &gt;
      </span>
    </Link>
  );
}
```

**QuickActionCard:**
```tsx
function QuickActionCard({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof Search;
  label: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="flex flex-col gap-3 rounded-lg border border-[#E9EAEB] p-6 hover:bg-[#F5F5F5] transition-colors"
    >
      <Icon className="size-6 text-[#717680]" />
      <span className="text-sm font-medium text-[#414651]">{label}</span>
    </Link>
  );
}
```

**import 목록:**
```tsx
import type { Route } from "./+types/dashboard";
import { Link, useLoaderData } from "react-router";
import { Search, Users, Layers, Bell, BarChart3 } from "lucide-react";
import { requireAdmin } from "../lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";
```

---

## 파일 4: `app/features/admin/screens/placeholder.tsx` (신규)

미구현 어드민 서브페이지의 플레이스홀더.

```tsx
export default function AdminPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
      <div className="flex size-16 items-center justify-center rounded-full bg-[#F5F5F5] mb-4">
        <svg className="size-8 text-[#A4A7AE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-[#535862]">이 페이지는 준비 중입니다.</p>
      <p className="text-xs text-[#717680] mt-1">다음 업데이트에서 제공될 예정입니다.</p>
    </div>
  );
}
```

---

## 파일 5: `app/routes.ts` (수정)

### 변경 내용

**기존 admin 라우트** (navigation.layout.tsx 안에 있음, lines 211-218):
```ts
layout("core/layouts/private.layout.tsx", { id: "private-admin" }, [
  ...prefix("/admin", [
    index("features/admin/screens/dashboard.tsx"),
    route("/users", "features/admin/screens/users.tsx"),
    route("/characters", "features/admin/screens/characters.tsx"),
  ]),
]),
```

**이 블록을 삭제하고**, `navigation.layout.tsx` **바깥**(최상위)에 새 admin 라우트 추가:

```ts
// 어드민 라우트 — 자체 사이드바 레이아웃 (GNB 없음)
layout("features/admin/layouts/admin.layout.tsx", [
  ...prefix("/admin", [
    index("features/admin/screens/dashboard.tsx"),
    route("/users", "features/admin/screens/users.tsx"),
    route("/characters", "features/admin/screens/characters.tsx"),
    // 유저관리
    route("/reports/users", "features/admin/screens/placeholder.tsx"),
    route("/sanctions", "features/admin/screens/placeholder.tsx"),
    route("/permissions", "features/admin/screens/placeholder.tsx"),
    // 캐릭터 관리
    route("/reports/characters", "features/admin/screens/placeholder.tsx"),
    route("/characters/moderation", "features/admin/screens/placeholder.tsx"),
    route("/characters/settings", "features/admin/screens/placeholder.tsx"),
    // 채팅 / 콘텐츠
    route("/reports/chats", "features/admin/screens/placeholder.tsx"),
    route("/chat/banned-words", "features/admin/screens/placeholder.tsx"),
    // 결제 / 포인트
    route("/payments", "features/admin/screens/placeholder.tsx"),
    route("/payments/refunds", "features/admin/screens/placeholder.tsx"),
    route("/points", "features/admin/screens/placeholder.tsx"),
    route("/referrals", "features/admin/screens/placeholder.tsx"),
    // 통계 / 모니터링
    route("/stats/usage", "features/admin/screens/placeholder.tsx"),
    route("/stats/patterns", "features/admin/screens/placeholder.tsx"),
    route("/stats/revenue", "features/admin/screens/placeholder.tsx"),
    route("/stats/ranking", "features/admin/screens/placeholder.tsx"),
    // 공지 / 운영
    route("/notices", "features/admin/screens/placeholder.tsx"),
    route("/messages", "features/admin/screens/placeholder.tsx"),
    route("/popups", "features/admin/screens/placeholder.tsx"),
    route("/model-status", "features/admin/screens/placeholder.tsx"),
    // 보안 / 설정
    route("/settings/accounts", "features/admin/screens/placeholder.tsx"),
    route("/settings/roles", "features/admin/screens/placeholder.tsx"),
    route("/settings/audit-log", "features/admin/screens/placeholder.tsx"),
    route("/settings/security", "features/admin/screens/placeholder.tsx"),
  ]),
]),
```

**배치 위치**: `navigation.layout.tsx` 블록과 같은 레벨 (최상위 배열). 예를 들어, `legal` 라우트 근처에 배치.

**주의**: `/api/admin/` API 라우트는 기존 위치 그대로 유지 (변경 없음).

---

## 기존 코드 참조

| 참조 | 파일 | 용도 |
|------|------|------|
| `requireAdmin` | `app/features/admin/lib/guards.server.ts` | 어드민 인증 가드 |
| `getAdminInfo` | `app/features/admin/lib/guards.server.ts` | 어드민 정보 조회 |
| stats API | `app/features/admin/api/stats.tsx` | 대시보드 통계 데이터 |
| dashboard.layout 패턴 | `app/features/users/layouts/dashboard.layout.tsx` | Outlet context 패턴 참고 |
| `getUserProfileWithCounts` | `app/features/users/lib/queries.server.ts` | 프로필 조회 |
| Avatar 컴포넌트 | `app/core/components/ui/avatar.tsx` | shadcn/ui Avatar |
| 로고 | `public/logo3.png` | NYANYANG 로고 이미지 |
| `makeServerClient` | `app/core/lib/supa-client.server.ts` | Supabase 클라이언트 |

---

## 검증

1. `npm run typecheck` 통과
2. `/admin` 접속 → 왼쪽 사이드바 + 오른쪽 대시보드 (GNB 없음)
3. 사이드바 아코디언: 메뉴 그룹 클릭 시 하위 항목 펼침/닫힘 (한 번에 하나만)
4. 하위 메뉴 클릭 → 해당 페이지 이동, 활성 메뉴 하이라이트
5. 기존 `/admin/users`, `/admin/characters` 정상 작동
6. 플레이스홀더 페이지: "이 페이지는 준비 중입니다." 표시
7. 대시보드: KPI 3카드 + 서비스 상태 + 긴급 알림 + 퀵 액션
8. 비어드민 유저 접속 → 403
9. 하단 프로필: 어드민 이름 + "admin setting" + 로그아웃 아이콘
