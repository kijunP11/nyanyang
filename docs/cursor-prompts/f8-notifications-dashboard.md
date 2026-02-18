# Section 5: 대시보드 UI 수정 + 알림 시스템 신규 개발

## 개요
F8 Figma 기반:
1. `/dashboard` "전체 작품" 테이블 라이트 테마 적용 + 페이지네이션 수정
2. `/notifications` 알림 페이지 신규 개발 — 5개 탭 (전체, 소식, 좋아요, 댓글, 팔로우)
3. 기존 API에 알림 INSERT 트리거 추가
4. Navigation Bar Bell 아이콘 → `/notifications` 링크 연결

## 수정/생성 파일 목록

| # | 파일 | 유형 |
|---|------|------|
| 1 | `sql/migrations/0017_create_notifications.sql` | **신규** (수동 마이그레이션) |
| 2 | `features/notifications/schema.ts` | **신규** |
| 3 | `features/notifications/lib/queries.server.ts` | **신규** |
| 4 | `features/notifications/lib/create-notification.server.ts` | **신규** |
| 5 | `features/notifications/screens/notifications.tsx` | **신규** |
| 6 | `features/notifications/components/notification-item.tsx` | **신규** |
| 7 | `app/routes.ts` | 수정 |
| 8 | `core/components/navigation-bar.tsx` | 수정 |
| 9 | `features/attendance/api/checkin.tsx` | 수정 |
| 10 | `features/characters/api/like.tsx` | 수정 |
| 11 | `features/comments/api/create.tsx` | 수정 |
| 12 | `features/comments/api/like.tsx` | 수정 |
| 13 | `features/users/api/follow.tsx` | 수정 |
| 14 | `features/users/screens/dashboard.tsx` | 수정 |

수정하지 않는 파일: `mypage-sidebar-card.tsx`, `dashboard.layout.tsx`, 기존 알림 관련 없는 파일들

---

## 1. `sql/migrations/0017_create_notifications.sql` (신규)

수동 마이그레이션 — Supabase SQL Editor에서 실행.

```sql
-- 0017: notifications 테이블 생성
-- 수동 마이그레이션: Supabase SQL Editor 또는 psql로 실행

CREATE TABLE IF NOT EXISTS notifications (
  notification_id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  subtitle text,
  metadata jsonb DEFAULT '{}',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_type ON notifications(user_id, type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_notifications" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "insert_notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);
```

---

## 2. `features/notifications/schema.ts` (신규)

```ts
/**
 * Notifications Schema
 * 알림 테이블 — 출석체크, 좋아요, 댓글, 팔로우 알림 저장
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers, authenticatedRole, authUid } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers";

export const notifications = pgTable(
  "notifications",
  {
    notification_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    type: text().notNull(),
    title: text().notNull(),
    body: text().notNull(),
    subtitle: text(),
    metadata: jsonb().default({}),
    is_read: boolean().notNull().default(false),
    ...timestamps,
  },
  (table) => [
    pgPolicy("select-own-notifications", {
      for: "select",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("insert-notifications", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`true`,
    }),
  ]
);
```

---

## 3. `features/notifications/lib/queries.server.ts` (신규)

```ts
import { and, desc, eq } from "drizzle-orm";
import drizzle from "~/core/db/drizzle-client.server";

import { notifications } from "../schema";

export type NotificationType = "checkin" | "like" | "comment" | "follow";

export async function getNotifications(
  userId: string,
  type?: NotificationType,
  limit = 50,
  offset = 0
) {
  const conditions = [eq(notifications.user_id, userId)];
  if (type) {
    conditions.push(eq(notifications.type, type));
  }

  return drizzle
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.created_at))
    .limit(limit)
    .offset(offset);
}
```

---

## 4. `features/notifications/lib/create-notification.server.ts` (신규)

다른 API에서 import하여 사용하는 헬퍼. **반드시 try-catch로 감싸서** 알림 실패가 원래 작업을 방해하지 않도록 한다.

```ts
import drizzle from "~/core/db/drizzle-client.server";
import { notifications } from "../schema";

interface CreateNotificationParams {
  user_id: string;
  type: "checkin" | "like" | "comment" | "follow";
  title: string;
  body: string;
  subtitle?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    await drizzle.insert(notifications).values({
      user_id: params.user_id,
      type: params.type,
      title: params.title,
      body: params.body,
      subtitle: params.subtitle ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}
```

---

## 5. `features/notifications/screens/notifications.tsx` (신규)

```ts
import type { Route } from "./+types/notifications";

import { CircleCheckBig, Heart, MessageCircle, UserPlus } from "lucide-react";
import { useState } from "react";
import { data, useLoaderData, useSearchParams } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";

import { getNotifications } from "../lib/queries.server";
import type { NotificationType } from "../lib/queries.server";
import { NotificationItem } from "../components/notification-item";

export const meta: Route.MetaFunction = () => [
  { title: `알림 | ${import.meta.env.VITE_APP_NAME}` },
];

const TABS = [
  { id: "all", label: "전체" },
  { id: "checkin", label: "소식" },
  { id: "like", label: "좋아요" },
  { id: "comment", label: "댓글" },
  { id: "follow", label: "팔로우" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") as TabId | null;
  const type: NotificationType | undefined =
    tab && tab !== "all" ? (tab as NotificationType) : undefined;

  const items = await getNotifications(user.id, type);

  return data({ items }, { headers });
}

export default function Notifications() {
  const { items } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (searchParams.get("tab") as TabId) || "all";

  const handleTabChange = (tabId: TabId) => {
    const params = new URLSearchParams(searchParams);
    if (tabId === "all") {
      params.delete("tab");
    } else {
      params.set("tab", tabId);
    }
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-md px-4 py-10 flex flex-col gap-6">
        <h1 className="text-xl font-semibold text-black">알림</h1>

        {/* 탭 */}
        <div className="flex border-b border-[#E9EAEB]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 pb-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-black text-black"
                  : "text-[#717680] hover:text-black"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 알림 리스트 */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="flex size-16 items-center justify-center rounded-full bg-[#F5F5F5]">
              <MessageCircle className="size-8 text-[#A4A7AE]" />
            </div>
            <p className="text-sm font-medium text-[#535862]">
              받은 알림이 없습니다.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {items.map((item) => (
              <NotificationItem
                key={item.notification_id}
                notification={item}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 핵심 포인트

1. **탭 필터**: `searchParams.tab`으로 관리 → loader에서 type 필터 적용
2. **`setSearchParams`**: 탭 변경 시 URL 업데이트 → loader 재실행
3. **빈 상태**: `MessageCircle` 아이콘 + "받은 알림이 없습니다."
4. **라이트 테마**: `bg-white`, `text-black`, dark 클래스 없음

---

## 6. `features/notifications/components/notification-item.tsx` (신규)

```tsx
import {
  CircleCheckBig,
  Heart,
  MessageCircle,
  UserPlus,
} from "lucide-react";

interface Notification {
  notification_id: number;
  type: string;
  title: string;
  body: string;
  subtitle: string | null;
  created_at: string;
}

interface NotificationItemProps {
  notification: Notification;
}

const ICON_CONFIG: Record<
  string,
  { icon: typeof Heart; className: string }
> = {
  checkin: { icon: CircleCheckBig, className: "text-[#00C4AF]" },
  like: { icon: Heart, className: "text-[#F87171]" },
  comment: { icon: MessageCircle, className: "text-[#3B82F6]" },
  follow: { icon: UserPlus, className: "text-[#F97316]" },
};

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const config = ICON_CONFIG[notification.type] ?? ICON_CONFIG.checkin;
  const Icon = config.icon;

  return (
    <div className="flex gap-3 border-b border-[#E9EAEB] py-4 last:border-b-0">
      <div className="flex size-10 shrink-0 items-center justify-center">
        <Icon className={`size-6 ${config.className}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-black">
            {notification.title}
          </p>
          <span className="shrink-0 text-xs text-[#717680]">
            {formatDate(notification.created_at)}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-black">{notification.body}</p>
        {notification.subtitle && (
          <p className="mt-0.5 text-sm text-[#717680]">
            {notification.subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
```

### 핵심 포인트

1. **타입별 아이콘/색상**: `ICON_CONFIG` 맵으로 관리
2. **날짜 포맷**: `yyyy.mm.dd`
3. **구분선**: `border-b border-[#E9EAEB]`, 마지막 항목은 `last:border-b-0`
4. **subtitle**: 존재할 때만 렌더링 (gray 텍스트)

---

## 7. `app/routes.ts` (수정)

### 알림 페이지 라우트 추가

`private-badges` 레이아웃 아래에 추가:

```ts
layout("core/layouts/private.layout.tsx", { id: "private-notifications" }, [
  route("/notifications", "features/notifications/screens/notifications.tsx"),
]),
```

위치: L176-178 `private-badges` 블록 다음.

---

## 8. `core/components/navigation-bar.tsx` (수정)

Bell 아이콘 `<button>`을 `<Link to="/notifications">`로 변경. **3곳** 수정 필요.

### 8-1. 로그인 상태 데스크톱 (L216-222)

변경 전:
```tsx
<button
  type="button"
  className="flex size-10 items-center justify-center"
  aria-label="알림"
>
  <Bell className="size-6 text-black/70 dark:text-[#D5D7DA]" />
</button>
```

변경 후:
```tsx
<Link
  to="/notifications"
  className="flex size-10 items-center justify-center"
  aria-label="알림"
>
  <Bell className="size-6 text-black/70 dark:text-[#D5D7DA]" />
</Link>
```

### 8-2. 비로그인 상태 데스크톱 — AuthButtons 함수 (L124-131)

동일 패턴으로 `<button>` → `<Link to="/notifications">` 변경.

### 8-3. 모바일 Sheet (L316-322)

동일 패턴으로 변경. `SheetClose`로 감싸야 클릭 시 시트가 닫힘:

```tsx
<SheetClose asChild>
  <Link
    to="/notifications"
    className="flex size-10 items-center justify-center"
    aria-label="알림"
  >
    <Bell className="size-6 text-black/70 dark:text-[#D5D7DA]" />
  </Link>
</SheetClose>
```

---

## 9. `features/attendance/api/checkin.tsx` (수정)

### import 추가

```ts
import { createNotification } from "~/features/notifications/lib/create-notification.server";
```

### 알림 생성 (POST action 내, return 직전 — 현재 L301 부근)

기존:
```ts
return data(
  {
    success: true,
    pointsAwarded,
    consecutiveDays,
    newBalance,
  },
  { headers }
);
```

변경 (return 직전에 추가):
```ts
// 출석 알림 생성
await createNotification({
  user_id: user.id,
  type: "checkin",
  title: "출석체크",
  body: `나냥 젤리 ${pointsAwarded}개가 도착했어요.💜`,
  subtitle: "출석체크하고 젤리 받아가세요!",
  metadata: { points_awarded: pointsAwarded, consecutive_days: consecutiveDays },
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
```

---

## 10. `features/characters/api/like.tsx` (수정)

### import 추가

```ts
import { createNotification } from "~/features/notifications/lib/create-notification.server";
```

### character select에 creator_id, display_name, name 추가

현재 (L107-111):
```ts
const [character] = await db
  .select({ character_id: characters.character_id, like_count: characters.like_count })
  .from(characters)
  .where(eq(characters.character_id, validData.character_id))
  .limit(1);
```

변경:
```ts
const [character] = await db
  .select({
    character_id: characters.character_id,
    like_count: characters.like_count,
    creator_id: characters.creator_id,
    display_name: characters.display_name,
    name: characters.name,
  })
  .from(characters)
  .where(eq(characters.character_id, validData.character_id))
  .limit(1);
```

### POST 성공 후 알림 (L131 `return data(...)` 직전)

```ts
// 자신의 캐릭터가 아닌 경우에만 알림
if (character.creator_id !== user.id) {
  await createNotification({
    user_id: character.creator_id,
    type: "like",
    title: "좋아요",
    body: "누군가 내 스토리에 좋아요를 눌렀어요!",
    subtitle: character.display_name || character.name,
    metadata: { character_id: character.character_id },
  });
}

return data({ success: true, liked: true }, { headers });
```

---

## 11. `features/comments/api/create.tsx` (수정)

### import 추가

```ts
import { createNotification } from "~/features/notifications/lib/create-notification.server";
import { eq } from "drizzle-orm";
import drizzle from "~/core/db/drizzle-client.server";
import { characters } from "~/features/characters/schema";
```

### 성공 후 알림 (L63 `return data(...)` 직전)

```ts
// 캐릭터 creator에게 댓글 알림
const [char] = await drizzle
  .select({
    creator_id: characters.creator_id,
    display_name: characters.display_name,
    name: characters.name,
  })
  .from(characters)
  .where(eq(characters.character_id, validData.character_id))
  .limit(1);

if (char && char.creator_id !== user.id) {
  await createNotification({
    user_id: char.creator_id,
    type: "comment",
    title: "댓글",
    body: "누군가 댓글을 남겼어요!",
    subtitle: validData.content.slice(0, 50),
    metadata: {
      character_id: validData.character_id,
      comment_id: comment.comment_id,
    },
  });
}

return data({ success: true, comment }, { headers });
```

---

## 12. `features/comments/api/like.tsx` (수정)

### import 추가

```ts
import { createNotification } from "~/features/notifications/lib/create-notification.server";
import { eq } from "drizzle-orm";
import drizzle from "~/core/db/drizzle-client.server";
import { comments } from "../schema";
```

### POST 성공 후 알림 (L49 `return data(...)` 직전)

```ts
// 댓글 작성자에게 좋아요 알림 (POST만, DELETE는 알림 안 함)
if (liked) {
  const [commentRow] = await drizzle
    .select({ user_id: comments.user_id, content: comments.content })
    .from(comments)
    .where(eq(comments.comment_id, parsed.data.comment_id))
    .limit(1);

  if (commentRow && commentRow.user_id !== user.id) {
    await createNotification({
      user_id: commentRow.user_id,
      type: "like",
      title: "좋아요",
      body: "누군가 내 댓글에 좋아요를 눌렀어요!",
      subtitle: commentRow.content?.slice(0, 50),
      metadata: { comment_id: parsed.data.comment_id },
    });
  }
}

return data({ success: true, liked }, { headers });
```

---

## 13. `features/users/api/follow.tsx` (수정)

### import 추가

```ts
import { createNotification } from "~/features/notifications/lib/create-notification.server";
```

### POST 성공 후 알림 (L78 `return data(...)` 직전)

```ts
// 대상 유저에게 팔로우 알림
await createNotification({
  user_id: validData.user_id,
  type: "follow",
  title: "팔로우 알림",
  body: "누군가 내 작품을 팔로우했어요!",
  metadata: { follower_id: user.id },
});

return data({ success: true, following: true }, { headers });
```

---

## 14. `features/users/screens/dashboard.tsx` (수정)

### 변경 사항

1. **모든 `dark:` 클래스 제거** — 파일 전체에서 `dark:` 접두사 클래스를 모두 삭제
2. **페이지네이션 스타일 변경** — "이전/1/2/3/다음" → "Page N of M" + 이전/다음

### 페이지네이션 변경

현재 (L291-327):
```tsx
{totalPages > 1 && (
  <div className="flex items-center justify-center gap-1 border-t border-[#E9EAEB] p-4 dark:border-[#333741]">
    <Button variant="ghost" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} ...>
      이전
    </Button>
    {getPageNumbers().map((page) => (
      <Button key={page} variant="ghost" size="sm" onClick={() => goToPage(page)} ...>
        {page}
      </Button>
    ))}
    <Button variant="ghost" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} ...>
      다음
    </Button>
  </div>
)}
```

변경:
```tsx
<div className="flex items-center justify-between border-t border-[#E9EAEB] p-4">
  <button
    type="button"
    onClick={() => goToPage(currentPage - 1)}
    disabled={currentPage <= 1}
    className="text-sm font-medium text-[#535862] hover:text-[#181D27] disabled:text-[#D5D7DA]"
  >
    이전
  </button>
  <span className="text-sm text-[#535862]">
    Page {currentPage} of {Math.max(totalPages, 1)}
  </span>
  <button
    type="button"
    onClick={() => goToPage(currentPage + 1)}
    disabled={currentPage >= totalPages}
    className="text-sm font-medium text-[#535862] hover:text-[#181D27] disabled:text-[#D5D7DA]"
  >
    다음
  </button>
</div>
```

**주의**: 페이지네이션은 `totalPages > 1`일 때만 아니라 항상 표시 (Figma: "Page 1 of 1" 항상 보임). 단, characters.length === 0 (빈 상태)일 때는 테이블 대신 빈 상태 UI를 보여주므로, characters가 있을 때만 표시하는 것은 유지.

### dark 클래스 제거 범위

파일 전체에서 다음 패턴 삭제:
- `dark:border-[#333741]`
- `dark:bg-[#1F242F]`
- `dark:text-white`
- `dark:text-[#94969C]`
- `dark:text-[#717680]`
- `dark:bg-[#333741]`
- `dark:hover:bg-[#333741]`
- `dark:hover:text-white`
- `dark:disabled:text-[#414651]`
- `dark:bg-green-500/10`, `dark:text-green-400`, `dark:border-green-500/20` 등 StatusBadge 내
- `dark:bg-orange-500/10`, `dark:text-orange-400`, etc.
- `dark:bg-red-500/10`, `dark:text-red-400`, etc.
- `dark:bg-gray-500/10`, `dark:text-gray-400`, etc.
- `dark:hover:bg-[#262B36]`

`getPageNumbers()` 함수는 더 이상 사용하지 않으므로 삭제 가능.

---

## 컬러 시스템 (알림 페이지)

| 용도 | 컬러 |
|------|------|
| 페이지 배경 | `bg-white` |
| 활성 탭 | `text-black font-semibold` + `border-b-2 border-black` |
| 비활성 탭 | `text-[#717680]` |
| 알림 구분선 | `border-[#E9EAEB]` |
| 날짜 텍스트 | `text-[#717680]` |
| 부제 텍스트 | `text-[#717680]` |
| 빈 상태 아이콘 bg | `bg-[#F5F5F5]` |
| 빈 상태 아이콘 | `text-[#A4A7AE]` |
| 빈 상태 텍스트 | `text-[#535862]` |
| 출석체크 아이콘 | `text-[#00C4AF]` |
| 좋아요 아이콘 | `text-[#F87171]` |
| 댓글 아이콘 | `text-[#3B82F6]` |
| 팔로우 아이콘 | `text-[#F97316]` |

---

## 검증

1. `npm run typecheck` 통과 확인
2. SQL 마이그레이션 실행 후 `notifications` 테이블 생성 확인
3. `/notifications` 접속 → 라이트 테마, "알림" 타이틀, 5개 탭
4. 빈 상태: 말풍선 아이콘 + "받은 알림이 없습니다."
5. 탭 전환 시 URL 변경 (`?tab=checkin`, `?tab=like` 등)
6. 출석체크 후 → `/notifications` 소식 탭에 출석 알림 표시
7. 캐릭터 좋아요 → creator에게 좋아요 알림
8. 댓글 작성 → creator에게 댓글 알림
9. 댓글 좋아요 → 댓글 작성자에게 좋아요 알림
10. 팔로우 → 대상에게 팔로우 알림
11. GNB Bell 아이콘 클릭 → `/notifications` 이동 (데스크톱 + 모바일)
12. `/dashboard` → dark 클래스 없음, 라이트 테마, 페이지네이션 "Page N of M"
