# 마이페이지 + 팔로우 시스템 상세 구현 스펙

> Cursor 구현용 스펙 문서. 각 Phase를 순서대로 구현할 것.

---

## 사전 조건 (구현 시작 전 필수)

```bash
# 1. Supabase 로그인 (typegen에 필요)
supabase login

# 2. 타입 재생성 (0003 마이그레이션 반영)
npm run db:typegen

# 3. 타입체크 통과 확인
npm run typecheck
```

> 0003 마이그레이션은 이미 적용 완료. typegen만 수동 실행하면 Phase 1 진행 가능.

---

## 코드베이스 컨벤션 요약

- **DB 클라이언트**: `import drizzle from "~/core/db/drizzle-client.server"` → `const db = drizzle;`
- **인증 패턴**: `const [client, headers] = makeServerClient(request); await requireAuthentication(client);`
- **유저 가져오기**: `const { data: { user } } = await client.auth.getUser();`
- **응답 패턴**: `return data({ ... }, { status: xxx, headers });`
- **타임스탬프**: `import { timestamps } from "~/core/db/helpers";` → 스프레드 `...timestamps`
- **RLS 정책**: `import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";`
- **Route 타입**: `import type { Route } from "./+types/파일명";`
- **다크 테마 토큰**: 페이지 `bg-[#111111]`, 카드 `bg-[#232323]`, 보더 `border-[#3f3f46]`, 텍스트 `text-white`/`text-[#9ca3af]`, 액센트 `bg-[#14b8a6]`

---

## Phase 1: DB 스키마 + 마이그레이션

### 1-1. `app/features/users/schema.ts` 수정

기존 `profiles` 테이블에 2개 컬럼 추가, 새 `userFollows` 테이블 추가.

```typescript
// === 기존 import에 추가 ===
import {
  boolean,
  integer,        // ← 추가
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,         // ← 추가
  uuid,
} from "drizzle-orm/pg-core";

// === profiles 테이블에 컬럼 추가 (verified_at 뒤, ...timestamps 전) ===
    // 팔로워/팔로잉 카운터 (비정규화)
    follower_count: integer("follower_count").notNull().default(0),
    following_count: integer("following_count").notNull().default(0),

// === profiles RLS에 정책 추가 (기존 select-profile-policy 뒤에) ===
    // 다른 유저의 프로필도 조회 가능하게 (팔로워 수 표시 등)
    pgPolicy("select-any-profile-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`true`,
    }),

// === 파일 하단에 새 테이블 추가 ===

/**
 * User Follows Table
 *
 * Tracks follow relationships between users.
 * follower_id follows following_id.
 */
export const userFollows = pgTable(
  "user_follows",
  {
    follow_id: uuid().primaryKey().defaultRandom(),
    follower_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    following_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    // 중복 팔로우 방지
    unique("user_follows_unique").on(table.follower_id, table.following_id),
    // 자신의 팔로우 관리 (insert/update/delete)
    pgPolicy("manage_own_follows_policy", {
      for: "all",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${table.follower_id}`,
      withCheck: sql`(select auth.uid()) = ${table.follower_id}`,
    }),
    // 자신의 팔로워 조회
    pgPolicy("view_followers_policy", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${table.following_id}`,
    }),
  ],
);
```

**주의**: 기존 `select-profile-policy`는 `authUid = profile_id` 제한이 있어서, 다른 유저의 팔로워/팔로잉 카운트를 표시하려면 `select-any-profile-policy`가 필요하다. 기존 정책과 충돌하지 않도록 `as: "permissive"`로 설정 (OR 조건).

### 1-2. 마이그레이션 생성 & 적용

```bash
npm run db:generate   # 0004 마이그레이션 생성 (이미 0003까지 있으면 0004)
```

생성된 SQL 파일 (`sql/migrations/0004_xxx.sql`)을 확인하고:
- `CREATE TABLE user_follows` → `IF NOT EXISTS` 추가 없어도 됨 (첫 생성)
- `ALTER TABLE profiles ADD COLUMN` → 이미 존재할 수 있으므로 Drizzle이 처리

```bash
npm run db:migrate    # 적용 + postdb:migrate로 typegen 자동 실행
```

---

## Phase 2: API + 쿼리 함수

### 2-1. `app/features/users/api/follow.tsx` (신규 파일)

`app/features/characters/api/like.tsx` 패턴을 그대로 따름.

```typescript
/**
 * User Follow/Unfollow API Endpoint
 *
 * POST /api/users/follow   → 팔로우
 * DELETE /api/users/follow  → 언팔로우
 */

import type { Route } from "./+types/follow";

import { and, eq, sql } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { profiles, userFollows } from "../schema";

const bodySchema = z.object({
  user_id: z.string().uuid(),
});

export async function action({ request }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  if (request.method !== "POST" && request.method !== "DELETE") {
    return data({ error: "Method not allowed" }, { status: 405, headers });
  }

  try {
    const body = await request.json();
    const { success, data: validData, error } = bodySchema.safeParse(body);

    if (!success) {
      return data(
        { error: "Invalid request", details: error.flatten().fieldErrors },
        { status: 400, headers }
      );
    }

    // 자기 자신 팔로우 방지
    if (validData.user_id === user.id) {
      return data({ error: "Cannot follow yourself" }, { status: 400, headers });
    }

    const db = drizzle;

    if (request.method === "POST") {
      // 팔로우
      try {
        await db.insert(userFollows).values({
          follower_id: user.id,
          following_id: validData.user_id,
        });

        // follower_count++ (대상 유저)
        await db
          .update(profiles)
          .set({ follower_count: sql`${profiles.follower_count} + 1` })
          .where(eq(profiles.profile_id, validData.user_id));

        // following_count++ (나)
        await db
          .update(profiles)
          .set({ following_count: sql`${profiles.following_count} + 1` })
          .where(eq(profiles.profile_id, user.id));

        return data({ success: true, following: true }, { headers });
      } catch (err: any) {
        if (err.code === "23505") {
          return data({ error: "Already following" }, { status: 400, headers });
        }
        throw err;
      }
    } else {
      // 언팔로우 (DELETE)
      const [existing] = await db
        .select()
        .from(userFollows)
        .where(
          and(
            eq(userFollows.follower_id, user.id),
            eq(userFollows.following_id, validData.user_id)
          )
        )
        .limit(1);

      if (!existing) {
        return data({ error: "Not following" }, { status: 404, headers });
      }

      await db
        .delete(userFollows)
        .where(
          and(
            eq(userFollows.follower_id, user.id),
            eq(userFollows.following_id, validData.user_id)
          )
        );

      // follower_count-- (대상 유저, 최소 0)
      await db
        .update(profiles)
        .set({ follower_count: sql`GREATEST(${profiles.follower_count} - 1, 0)` })
        .where(eq(profiles.profile_id, validData.user_id));

      // following_count-- (나, 최소 0)
      await db
        .update(profiles)
        .set({ following_count: sql`GREATEST(${profiles.following_count} - 1, 0)` })
        .where(eq(profiles.profile_id, user.id));

      return data({ success: true, following: false }, { headers });
    }
  } catch (err) {
    console.error("Error processing follow/unfollow:", err);
    return data({ error: "Failed to process request" }, { status: 500, headers });
  }
}
```

### 2-2. `app/features/users/lib/queries.server.ts` (신규 파일)

```typescript
/**
 * User Queries (Server-side)
 *
 * Query functions for likes/following data used by mypage screens.
 */

import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";

import { characters, characterLikes } from "../../characters/schema";
import { profiles, userFollows } from "../schema";

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

/**
 * 좋아요한 캐릭터 조회
 */
export async function getLikedCharacters(
  userId: string,
  params: z.infer<typeof paginationSchema>
) {
  const db = drizzle;

  const results = await db
    .select({
      character_id: characters.character_id,
      name: characters.name,
      display_name: characters.display_name,
      description: characters.description,
      avatar_url: characters.avatar_url,
      tags: characters.tags,
      like_count: characters.like_count,
      chat_count: characters.chat_count,
      creator_id: characters.creator_id,
      gallery_urls: characters.gallery_urls,
      liked_at: characterLikes.created_at,
    })
    .from(characterLikes)
    .innerJoin(characters, eq(characterLikes.character_id, characters.character_id))
    .where(
      and(
        eq(characterLikes.user_id, userId),
        eq(characters.status, "approved"),
        eq(characters.is_public, true)
      )
    )
    .orderBy(desc(characterLikes.created_at))
    .limit(params.limit)
    .offset(params.offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(characterLikes)
    .innerJoin(characters, eq(characterLikes.character_id, characters.character_id))
    .where(
      and(
        eq(characterLikes.user_id, userId),
        eq(characters.status, "approved"),
        eq(characters.is_public, true)
      )
    );

  return {
    characters: results,
    pagination: {
      total: Number(count),
      limit: params.limit,
      offset: params.offset,
      hasMore: params.offset + params.limit < Number(count),
    },
  };
}

/**
 * 팔로잉 크리에이터의 캐릭터 조회
 */
export async function getFollowingCharacters(
  userId: string,
  params: z.infer<typeof paginationSchema>
) {
  const db = drizzle;

  const results = await db
    .select({
      character_id: characters.character_id,
      name: characters.name,
      display_name: characters.display_name,
      description: characters.description,
      avatar_url: characters.avatar_url,
      tags: characters.tags,
      like_count: characters.like_count,
      chat_count: characters.chat_count,
      creator_id: characters.creator_id,
      gallery_urls: characters.gallery_urls,
    })
    .from(userFollows)
    .innerJoin(characters, eq(characters.creator_id, userFollows.following_id))
    .where(
      and(
        eq(userFollows.follower_id, userId),
        eq(characters.is_public, true),
        eq(characters.status, "approved")
      )
    )
    .orderBy(desc(characters.created_at))
    .limit(params.limit)
    .offset(params.offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(userFollows)
    .innerJoin(characters, eq(characters.creator_id, userFollows.following_id))
    .where(
      and(
        eq(userFollows.follower_id, userId),
        eq(characters.is_public, true),
        eq(characters.status, "approved")
      )
    );

  return {
    characters: results,
    pagination: {
      total: Number(count),
      limit: params.limit,
      offset: params.offset,
      hasMore: params.offset + params.limit < Number(count),
    },
  };
}

/**
 * 팔로우 여부 확인
 */
export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const db = drizzle;

  const [result] = await db
    .select({ follow_id: userFollows.follow_id })
    .from(userFollows)
    .where(
      and(
        eq(userFollows.follower_id, followerId),
        eq(userFollows.following_id, followingId)
      )
    )
    .limit(1);

  return !!result;
}

/**
 * 유저 프로필 + 팔로워/팔로잉 카운트 조회
 */
export async function getUserProfileWithCounts(userId: string) {
  const db = drizzle;

  const [profile] = await db
    .select({
      profile_id: profiles.profile_id,
      name: profiles.name,
      avatar_url: profiles.avatar_url,
      follower_count: profiles.follower_count,
      following_count: profiles.following_count,
      verified_at: profiles.verified_at,
    })
    .from(profiles)
    .where(eq(profiles.profile_id, userId))
    .limit(1);

  return profile || null;
}
```

### 2-3. `app/routes.ts` 수정

```typescript
// === /api/users prefix 내부에 추가 ===
    ...prefix("/users", [
      index("features/users/api/delete-account.tsx"),
      route("/password", "features/users/api/change-password.tsx"),
      route("/email", "features/users/api/change-email.tsx"),
      route("/profile", "features/users/api/edit-profile.tsx"),
      route("/follow", "features/users/api/follow.tsx"),           // ← 추가
      route(
        "/referral-code/validate",
        "features/users/api/validate-referral-code.tsx",
      ),
      route("/providers", "features/users/api/connect-provider.tsx"),
      route(
        "/providers/:provider",
        "features/users/api/disconnect-provider.tsx",
      ),
    ]),

// === dashboard prefix 내부에 likes 라우트 추가 ===
    layout("features/users/layouts/dashboard.layout.tsx", [
      ...prefix("/dashboard", [
        index("features/users/screens/dashboard.tsx"),
        route("likes", "features/users/screens/likes.tsx"),          // ← 추가
        route("/my-content", "features/users/screens/my-content.tsx"),
        route("/payments", "features/payments/screens/payments.tsx"),
      ]),
      route("/account/edit", "features/users/screens/account.tsx"),
    ]),
```

---

## Phase 3: 레이아웃 변경

### 3-1. `app/features/users/layouts/dashboard.layout.tsx` 전체 교체

기존: SidebarProvider + DashboardSidebar + SidebarInset + 우측 Sidebar
변경: 단순 dark 컨테이너. 각 페이지가 자체 레이아웃 처리.

```typescript
import type { Route } from "./+types/dashboard.layout";

import { Outlet } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";

import { getUserProfileWithCounts } from "../lib/queries.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  // 프로필 데이터 (팔로워/팔로잉 카운트 포함)
  const profile = user ? await getUserProfileWithCounts(user.id) : null;

  // 출석 데이터
  const url = new URL(request.url);
  const apiUrl = new URL("/api/attendance/checkin", url.origin);
  const attendanceData = await fetch(apiUrl.toString(), {
    headers: request.headers,
  })
    .then((res) => (res.ok ? res.json() : { checkedInToday: false, currentStreak: 0 }))
    .catch(() => ({ checkedInToday: false, currentStreak: 0 }));

  return {
    user,
    profile,
    attendanceData,
  };
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-[#111111]">
      <Outlet context={loaderData} />
    </div>
  );
}
```

> **중요**: `loaderData`를 `Outlet context`로 전달해서, 하위 페이지에서 `useOutletContext()`로 공유 데이터(user, profile, attendanceData)에 접근할 수 있게 한다.

하위 페이지에서 사용:
```typescript
import { useOutletContext } from "react-router";

// 페이지 컴포넌트 내부에서:
const { user, profile, attendanceData } = useOutletContext<{
  user: any;
  profile: any;
  attendanceData: any;
}>();
```

---

## Phase 4: 공유 UI 컴포넌트

### 4-1. `app/features/users/components/mypage-sidebar-card.tsx` (신규)

우측 사이드바 카드. `dashboard.tsx`에서만 사용.

**Props:**
```typescript
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
```

**구조 (위에서 아래):**

1. **유저 프로필 영역**
   - 아바타 (48px 원형) + 이름 + 팔로워/팔로잉 숫자
   - 카드 배경: `bg-[#232323]`, 보더: `border-[#3f3f46]`, 둥근모서리: `rounded-xl`

2. **냥젤리 (포인트)**
   - 현재 잔액 표시: `{points.current_balance.toLocaleString()}` 냥젤리
   - "충전하기" 버튼 → `<Link to="/points">`
   - 액센트 컬러: `bg-[#14b8a6]`

3. **출석 배너**
   - "냥젤리 400개 받기" 텍스트
   - 체크인 버튼 (기존 `DailyAttendanceCard` 로직 재사용)
   - `useFetcher` → POST `/api/attendance/checkin`
   - 비활성 상태: `attendance.checkedInToday === true`

4. **활동 메뉴** (링크 목록)
   - 팔로잉 → `/dashboard/likes?tab=following`
   - 좋아요 → `/dashboard/likes?tab=likes`
   - 세이프티 → `/account/edit?tab=safety`
   - 캐릭터 생성 → `/characters/create`

5. **크리에이터 섹션**
   - "크리에이터 도전하기" 링크 → `/characters/create`

6. **혜택 섹션**
   - "출석체크" 링크 → `/attendance`

**스타일 참고:**
```
전체: w-[340px] flex flex-col gap-4
각 섹션: bg-[#232323] rounded-xl border border-[#3f3f46] p-4
텍스트: text-white (제목), text-[#9ca3af] (부제)
버튼: bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg
```

### 4-2. `app/features/users/components/character-grid-card.tsx` (신규)

좋아요/팔로잉 목록의 세로형 캐릭터 카드.

**Props:**
```typescript
interface CharacterGridCardProps {
  character: {
    character_id: number;
    name: string;
    display_name: string | null;
    description: string | null;
    avatar_url: string | null;
    tags: string[] | null;
    like_count: number;
  };
  onClick: (character: CharacterGridCardProps["character"]) => void;
}
```

**구조:**
```
<div onClick={() => onClick(character)} className="cursor-pointer group">
  {/* 이미지 (3:4 비율) */}
  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#2f3032]">
    {character.avatar_url ? (
      <img src={character.avatar_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-4xl">🎭</div>
    )}
  </div>
  {/* 캐릭터명 */}
  <h3 className="mt-2 text-sm font-semibold text-white truncate">
    {character.display_name || character.name}
  </h3>
  {/* 좋아요 수 */}
  <p className="text-xs text-[#9ca3af]">❤️ {character.like_count}</p>
  {/* 설명 (1줄) */}
  <p className="text-xs text-[#9ca3af] line-clamp-1 mt-1">
    {character.description || "설명 없음"}
  </p>
  {/* 태그 (최대 3개) */}
  <div className="flex flex-wrap gap-1 mt-2">
    {(character.tags || []).slice(0, 3).map(tag => (
      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#14b8a6]/10 text-[#14b8a6]">
        {tag}
      </span>
    ))}
  </div>
</div>
```

**그리드 사용:**
```
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
  {characters.map(c => <CharacterGridCard key={c.character_id} character={c} onClick={onSelect} />)}
</div>
```

### 4-3. `app/features/users/components/character-info-modal.tsx` (신규)

캐릭터 카드 클릭 시 표시되는 정보 모달.

**필요한 shadcn 컴포넌트**: `Dialog` (이미 `app/core/components/ui/dialog.tsx` 존재)

**Props:**
```typescript
interface CharacterInfoModalProps {
  character: {
    character_id: number;
    name: string;
    display_name: string | null;
    description: string | null;
    avatar_url: string | null;
    gallery_urls: string[] | any;
    tags: string[] | null;
    like_count: number;
    creator_id: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}
```

**구조:**
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/core/components/ui/dialog";
import { useState } from "react";
import { useFetcher, Link } from "react-router";

export default function CharacterInfoModal({ character, open, onOpenChange, currentUserId }: CharacterInfoModalProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const likeFetcher = useFetcher();
  const followFetcher = useFetcher();

  if (!character) return null;

  // gallery_urls 파싱 (jsonb이므로 string[]로 변환)
  const galleryUrls: string[] = Array.isArray(character.gallery_urls)
    ? character.gallery_urls
    : [];
  const allImages = character.avatar_url
    ? [character.avatar_url, ...galleryUrls]
    : galleryUrls;

  const handleLike = () => { /* POST/DELETE /api/characters/like */ };
  const handleFollow = () => { /* POST/DELETE /api/users/follow */ };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#232323] border-[#3f3f46] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>캐릭터 정보</DialogTitle>
        </DialogHeader>

        {/* 이미지 슬라이더 */}
        <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-[#1a1a1a]">
          {allImages.length > 0 ? (
            <img src={allImages[imageIndex]} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🎭</div>
          )}
          {/* 좌우 화살표 (allImages.length > 1일 때만) */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={() => setImageIndex(i => Math.max(0, i - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2 text-white"
                disabled={imageIndex === 0}
              >
                ←
              </button>
              <button
                onClick={() => setImageIndex(i => Math.min(allImages.length - 1, i + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2 text-white"
                disabled={imageIndex === allImages.length - 1}
              >
                →
              </button>
              {/* 인덱스 표시 */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 rounded-full px-3 py-1 text-xs text-white">
                {imageIndex + 1} / {allImages.length}
              </div>
            </>
          )}
          {/* 좋아요 수 */}
          <div className="absolute top-2 right-2 bg-black/50 rounded-full px-3 py-1 text-xs text-white">
            ❤️ {character.like_count}
          </div>
        </div>

        {/* 캐릭터 정보 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">{character.display_name || character.name}</h3>
              <p className="text-sm text-[#9ca3af]">@creator</p>
            </div>
            {/* 팔로잉 버튼 (자기 캐릭터가 아닐 때만) */}
            {currentUserId !== character.creator_id && (
              <button
                onClick={handleFollow}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                  isFollowing
                    ? "bg-[#3f3f46] text-white"
                    : "bg-[#14b8a6] text-white"
                }`}
              >
                {isFollowing ? "팔로잉" : "팔로우"}
              </button>
            )}
          </div>

          {/* 태그 */}
          {character.tags && character.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {character.tags.map((tag: string) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#14b8a6]/10 text-[#14b8a6]">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 설명 */}
          <p className="text-sm text-[#9ca3af]">{character.description}</p>
        </div>

        {/* 하단 액션 */}
        <div className="flex gap-3 pt-2">
          <button onClick={handleLike} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[#3f3f46] text-sm hover:bg-[#3f3f46]">
            {isLiked ? "❤️" : "🤍"} 좋아요
          </button>
          <Link
            to={`/chat/${character.character_id}`}
            className="flex-1 text-center px-4 py-2 rounded-lg bg-[#14b8a6] text-white text-sm font-medium hover:bg-[#0d9488]"
          >
            대화하기
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**좋아요 토글 로직** (`handleLike`):
```typescript
const handleLike = () => {
  const newState = !isLiked;
  setIsLiked(newState);
  likeFetcher.submit(
    { character_id: character.character_id },
    {
      method: newState ? "POST" : "DELETE",
      action: "/api/characters/like",
      encType: "application/json",
    }
  );
};
```

**팔로우 토글 로직** (`handleFollow`):
```typescript
const handleFollow = () => {
  const newState = !isFollowing;
  setIsFollowing(newState);
  followFetcher.submit(
    { user_id: character.creator_id },
    {
      method: newState ? "POST" : "DELETE",
      action: "/api/users/follow",
      encType: "application/json",
    }
  );
};
```

---

## Phase 5: 화면 구현

### 5-1. `app/features/users/screens/dashboard.tsx` 전체 리빌드

**2컬럼 레이아웃**: 좌측 메인(프로필+작품테이블) + 우측 사이드바카드

```typescript
import type { Route } from "./+types/dashboard";

import { and, eq, sql, desc } from "drizzle-orm";
import { Link, useLoaderData, useOutletContext, useSearchParams } from "react-router";
import { useState } from "react";
import { Edit, Trash2, MoreVertical } from "lucide-react";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "~/core/components/ui/table";
import { Button } from "~/core/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import { Badge } from "~/core/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/core/components/ui/avatar";
import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { characters } from "../../characters/schema";
import { userPoints } from "../../points/schema";
import { getMyCharacters, myCharactersQuerySchema } from "../../characters/lib/queries.server";
import MypageSidebarCard from "../components/mypage-sidebar-card";

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

  const db = drizzle;

  // 병렬 fetch
  const [charactersResult, pointsData] = await Promise.all([
    getMyCharacters(user.id, params || { limit: 20, offset: 0 }),
    db
      .select()
      .from(userPoints)
      .where(eq(userPoints.user_id, user.id))
      .limit(1)
      .then(([result]) => result || { current_balance: 0, total_earned: 0, total_spent: 0 })
      .catch(() => ({ current_balance: 0, total_earned: 0, total_spent: 0 })),
  ]);

  return {
    ...charactersResult,
    points: pointsData,
  };
}

export default function Dashboard() {
  const { characters, latestCharacter, pagination, points } = useLoaderData<typeof loader>();
  const { user, profile, attendanceData } = useOutletContext<any>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const currentPage = Math.floor((pagination.offset || 0) / (pagination.limit || 20)) + 1;
  const totalPages = Math.ceil((pagination.total || 0) / (pagination.limit || 20));

  // 페이지네이션 핸들러 (기존 my-content.tsx에서 가져옴)
  const handlePrevious = () => { /* ... 기존 코드 동일 ... */ };
  const handleNext = () => { /* ... 기존 코드 동일 ... */ };
  const handleDelete = async (characterId: number, displayName: string) => { /* ... 기존 코드 동일 ... */ };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* 좌측: 메인 콘텐츠 */}
        <div className="space-y-6">
          {/* 프로필 헤더 */}
          <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-[#3f3f46] text-white">
                  {profile?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {profile?.name || user?.user_metadata?.name || "사용자"}
                </h2>
                <div className="flex items-center gap-4 mt-1 text-sm text-[#9ca3af]">
                  <span>팔로워 {profile?.follower_count || 0}명</span>
                  <span>팔로잉 {profile?.following_count || 0}명</span>
                </div>
              </div>
            </div>
          </div>

          {/* 전체 작품 테이블 */}
          <div className="bg-[#232323] rounded-xl border border-[#3f3f46]">
            <div className="flex items-center justify-between p-6 border-b border-[#3f3f46]">
              <h3 className="text-lg font-semibold text-white">전체 작품</h3>
            </div>

            {characters.length === 0 ? (
              /* 빈 상태 */
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <p className="text-lg font-medium text-white mb-2">내 캐릭터가 없습니다</p>
                <p className="text-[#9ca3af] text-center mb-6">첫 번째 캐릭터를 만들어보세요!</p>
                <Button asChild className="bg-[#14b8a6] hover:bg-[#0d9488]">
                  <Link to="/characters/create">캐릭터 만들기</Link>
                </Button>
              </div>
            ) : (
              <>
                {/* 테이블: my-content.tsx와 동일한 구조, 다크 테마 적용 */}
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#3f3f46] hover:bg-transparent">
                      <TableHead className="text-[#9ca3af]">작품명</TableHead>
                      <TableHead className="text-[#9ca3af]">캐릭터명</TableHead>
                      <TableHead className="text-[#9ca3af]">상태</TableHead>
                      <TableHead className="text-[#9ca3af]">만든 일자</TableHead>
                      <TableHead className="text-right text-[#9ca3af]">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {characters.map((character: any) => (
                      <TableRow key={character.character_id} className="border-[#3f3f46] hover:bg-[#2f3032]">
                        <TableCell className="font-medium text-white">{character.display_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={character.avatar_url || undefined} />
                              <AvatarFallback className="bg-[#3f3f46] text-white text-xs">
                                {(character.display_name || "C")[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-white">{character.display_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={character.status} />
                        </TableCell>
                        <TableCell className="text-[#9ca3af]">{formatDate(character.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" asChild className="text-[#9ca3af] hover:text-white">
                              <Link to={`/characters/${character.character_id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => handleDelete(character.character_id, character.display_name)}
                              disabled={deletingId === character.character_id}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-[#3f3f46]">
                    <div className="text-sm text-[#9ca3af]">
                      페이지 {currentPage} / {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handlePrevious} disabled={currentPage === 1}
                        className="border-[#3f3f46] text-[#9ca3af] hover:bg-[#3f3f46] hover:text-white">
                        이전
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleNext} disabled={currentPage === totalPages}
                        className="border-[#3f3f46] text-[#9ca3af] hover:bg-[#3f3f46] hover:text-white">
                        다음
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 우측: 사이드바 카드 (lg 이상에서만 표시) */}
        <div className="hidden lg:block">
          <MypageSidebarCard
            user={{
              name: profile?.name || user?.user_metadata?.name || "사용자",
              avatarUrl: profile?.avatar_url || user?.user_metadata?.avatar_url || null,
              email: user?.email || "",
            }}
            profile={{
              follower_count: profile?.follower_count || 0,
              following_count: profile?.following_count || 0,
            }}
            points={{
              current_balance: points.current_balance || 0,
            }}
            attendance={attendanceData}
          />
        </div>
      </div>
    </div>
  );
}

// StatusBadge 컴포넌트 (my-content.tsx에서 그대로 복사, 다크테마 적용)
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
    approved: { label: "공개", className: "bg-green-500/10 text-green-400 border-green-500/20", dot: "bg-green-500" },
    pending: { label: "심사중", className: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-500" },
    pending_review: { label: "심사중", className: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-500" },
    rejected: { label: "심사불가", className: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-500" },
    draft: { label: "임시저장", className: "bg-gray-500/10 text-gray-400 border-gray-500/20", dot: "bg-gray-500" },
  };
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <Badge variant="outline" className={config.className}>
      <span className={`w-2 h-2 rounded-full mr-2 ${config.dot}`} />
      {config.label}
    </Badge>
  );
}
```

### 5-2. `app/features/users/screens/likes.tsx` (신규)

**단일 컬럼 + 탭 + 카드 그리드 + 모달**

```typescript
import type { Route } from "./+types/likes";

import { Link, useLoaderData, useOutletContext, useSearchParams } from "react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "~/core/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "~/core/components/ui/tabs";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getLikedCharacters, getFollowingCharacters, paginationSchema } from "../lib/queries.server";
import CharacterGridCard from "../components/character-grid-card";
import CharacterInfoModal from "../components/character-info-modal";

export const meta: Route.MetaFunction = () => {
  return [{ title: `좋아요 & 팔로잉 | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") || "likes";
  const paginationParams = paginationSchema.parse(Object.fromEntries(url.searchParams));

  const result = tab === "following"
    ? await getFollowingCharacters(user.id, paginationParams)
    : await getLikedCharacters(user.id, paginationParams);

  return {
    tab,
    ...result,
    userId: user.id,
  };
}

export default function LikesScreen() {
  const { tab, characters, pagination, userId } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams();
    params.set("tab", newTab);
    // offset 리셋
    setSearchParams(params);
  };

  const handlePrevious = () => {
    const params = new URLSearchParams(searchParams);
    params.set("offset", String(Math.max(0, pagination.offset - pagination.limit)));
    setSearchParams(params);
  };

  const handleNext = () => {
    const params = new URLSearchParams(searchParams);
    params.set("offset", String(pagination.offset + pagination.limit));
    setSearchParams(params);
  };

  const handleCardClick = (character: any) => {
    setSelectedCharacter(character);
    setModalOpen(true);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">좋아요 & 팔로잉</h1>
        <Button variant="ghost" asChild className="text-[#9ca3af] hover:text-white">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            이전 페이지로 돌아가기
          </Link>
        </Button>
      </div>

      {/* 탭 */}
      <Tabs value={tab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="bg-[#232323] border border-[#3f3f46]">
          <TabsTrigger value="likes" className="data-[state=active]:bg-[#14b8a6] data-[state=active]:text-white">
            좋아요 목록
          </TabsTrigger>
          <TabsTrigger value="following" className="data-[state=active]:bg-[#14b8a6] data-[state=active]:text-white">
            팔로잉 목록
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 카드 그리드 */}
      {characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg font-medium text-white mb-2">
            {tab === "likes" ? "좋아요한 캐릭터가 없습니다" : "팔로잉한 크리에이터의 캐릭터가 없습니다"}
          </p>
          <p className="text-[#9ca3af] mb-6">캐릭터를 탐색해보세요!</p>
          <Button asChild className="bg-[#14b8a6] hover:bg-[#0d9488]">
            <Link to="/characters">캐릭터 탐색</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {characters.map((character: any) => (
              <CharacterGridCard
                key={character.character_id}
                character={character}
                onClick={handleCardClick}
              />
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <Button variant="outline" onClick={handlePrevious} disabled={currentPage === 1}
                className="border-[#3f3f46] text-[#9ca3af] hover:bg-[#3f3f46] hover:text-white">
                이전
              </Button>
              <span className="text-sm text-[#9ca3af]">
                Page {currentPage} of {totalPages}
              </span>
              <Button variant="outline" onClick={handleNext} disabled={currentPage === totalPages}
                className="border-[#3f3f46] text-[#9ca3af] hover:bg-[#3f3f46] hover:text-white">
                다음
              </Button>
            </div>
          )}
        </>
      )}

      {/* 캐릭터 정보 모달 */}
      <CharacterInfoModal
        character={selectedCharacter}
        open={modalOpen}
        onOpenChange={setModalOpen}
        currentUserId={userId}
      />
    </div>
  );
}
```

### 5-3. `app/features/users/screens/account.tsx` 리빌드

**탭 2개**: 프로필 이미지 수정 | 세이프티 설정

```typescript
import type { Route } from "./+types/account";

import { Suspense, useState } from "react";
import { Await, Link, useSearchParams } from "react-router";
import { ArrowLeft, CheckCircle } from "lucide-react";

import { Button } from "~/core/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/core/components/ui/tabs";
import { Switch } from "~/core/components/ui/switch";
import { Label } from "~/core/components/ui/label";
import makeServerClient from "~/core/lib/supa-client.server";

import EditProfileForm from "../components/forms/edit-profile-form";
import { getUserProfile } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: `마이페이지 설정 | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  const profile = getUserProfile(client, { userId: user!.id });
  return { user, profile };
}

export default function Account({ loaderData }: Route.ComponentProps) {
  const { user, profile } = loaderData;
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">마이페이지</h1>
        <Button variant="ghost" asChild className="text-[#9ca3af] hover:text-white">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Link>
        </Button>
      </div>

      {/* 탭 */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="bg-[#232323] border border-[#3f3f46] mb-6">
          <TabsTrigger value="profile" className="data-[state=active]:bg-[#14b8a6] data-[state=active]:text-white">
            프로필 이미지 수정
          </TabsTrigger>
          <TabsTrigger value="safety" className="data-[state=active]:bg-[#14b8a6] data-[state=active]:text-white">
            세이프티 설정
          </TabsTrigger>
        </TabsList>

        {/* 프로필 탭 */}
        <TabsContent value="profile">
          <Suspense
            fallback={
              <div className="bg-[#232323] animate-pulse h-60 w-full rounded-xl border border-[#3f3f46]" />
            }
          >
            <Await resolve={profile}>
              {(profileData) => {
                if (!profileData) return null;
                return (
                  <EditProfileForm
                    name={profileData.name}
                    marketingConsent={profileData.marketing_consent}
                    avatarUrl={profileData.avatar_url}
                  />
                );
              }}
            </Await>
          </Suspense>
        </TabsContent>

        {/* 세이프티 탭 */}
        <TabsContent value="safety">
          <div className="space-y-6">
            {/* 본인인증 */}
            <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">본인인증</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">본인 인증</p>
                  <p className="text-sm text-[#9ca3af]">실명 확인 및 본인 인증</p>
                </div>
                {user?.user_metadata?.verified_at ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm">인증완료</span>
                  </div>
                ) : (
                  <Button className="bg-[#14b8a6] hover:bg-[#0d9488]">
                    인증하기
                  </Button>
                )}
              </div>
            </div>

            {/* 성인인증 */}
            <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">성인인증</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">성인 인증</p>
                  <p className="text-sm text-[#9ca3af]">만 19세 이상 확인</p>
                </div>
                <Button variant="outline" className="border-[#3f3f46] text-[#9ca3af]">
                  인증하기
                </Button>
              </div>
            </div>

            {/* 세이프티 토글 */}
            <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">세이프티</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">세이프티 모드</p>
                  <p className="text-sm text-[#9ca3af]">성인 콘텐츠 표시 여부를 설정합니다</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## 파일 생성/수정 체크리스트

| 작업 | 파일 | 유형 |
|------|------|------|
| 수정 | `app/features/users/schema.ts` | profiles 컬럼 추가 + userFollows 테이블 |
| 신규 | `app/features/users/api/follow.tsx` | 팔로우 API |
| 신규 | `app/features/users/lib/queries.server.ts` | 쿼리 함수 |
| 수정 | `app/routes.ts` | follow API + likes 라우트 추가 |
| 수정 | `app/features/users/layouts/dashboard.layout.tsx` | 사이드바 제거, 단순 컨테이너 |
| 신규 | `app/features/users/components/mypage-sidebar-card.tsx` | 우측 사이드바 카드 |
| 신규 | `app/features/users/components/character-grid-card.tsx` | 그리드 캐릭터 카드 |
| 신규 | `app/features/users/components/character-info-modal.tsx` | 캐릭터 정보 모달 |
| 수정 | `app/features/users/screens/dashboard.tsx` | 전체 리빌드 |
| 신규 | `app/features/users/screens/likes.tsx` | 좋아요/팔로잉 페이지 |
| 수정 | `app/features/users/screens/account.tsx` | 탭 기반 리빌드 |

## 사용 중인 shadcn/ui 컴포넌트 (모두 기존 설치됨)

- `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`
- `Button`, `Badge`, `Avatar`, `AvatarFallback`, `AvatarImage`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Switch`, `Label`, `Input`, `Checkbox`
- `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger`
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`, `CardFooter`

## 검증 순서

```bash
# 1. 스키마 + 마이그레이션
npm run db:generate && npm run db:migrate

# 2. 타입체크
npm run typecheck

# 3. 개발 서버에서 확인
npm run dev

# 4. 확인할 페이지
# - /dashboard → 프로필 + 작품 테이블 + 우측 사이드바 카드
# - /dashboard/likes → 좋아요/팔로잉 탭 전환 + 카드 그리드 + 모달
# - /account/edit → 프로필 수정 + 세이프티 설정 탭
# - POST/DELETE /api/users/follow → 팔로우/언팔로우 동작
```
