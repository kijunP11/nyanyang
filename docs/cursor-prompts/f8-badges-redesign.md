# Section 4: 냥젤리 "무료로 받기" 탭 업데이트 + 뱃지 페이지 리디자인

## 개요
F8 Figma 업데이트 기반으로:
1. `/points` "무료로 받기" 탭: 주간 출석 카드 제거, 뱃지 프로모션 배너 추가
2. `/badges` 페이지: 카테고리 그룹핑 → 플랫 "도전 과제" 리스트 (진행도 바 + 보상 포인트)
3. DB: `badge_definitions`에 `reward_points` 컬럼 추가, claim 시 포인트 지급

## 수정/생성 파일 목록

| # | 파일 | 유형 |
|---|------|------|
| 1 | `sql/migrations/0014_add_badge_reward_points.sql` | **신규** (수동 마이그레이션) |
| 2 | `features/badges/schema.ts` | 수정 |
| 3 | `features/badges/types.ts` | 수정 |
| 4 | `features/badges/lib/badge-checker.server.ts` | 수정 |
| 5 | `features/badges/lib/queries.server.ts` | 수정 |
| 6 | `features/badges/api/claim.tsx` | 수정 |
| 7 | `features/badges/screens/badges.tsx` | **전면 리디자인** |
| 8 | `features/badges/components/badge-card.tsx` | **전면 리디자인** |
| 9 | `features/badges/components/representative-badge-card.tsx` | 수정 |
| 10 | `features/points/screens/points.tsx` | 수정 |

수정하지 않는 파일: `badge-claim-modal.tsx`, `badge-representative-modal.tsx`, `badge-category-group.tsx`, `recent-badge-cards.tsx`, `badge-icon.tsx`, `badge-definitions.ts`

---

## 1. `sql/migrations/0014_add_badge_reward_points.sql` (신규)

수동 마이그레이션 — Supabase SQL Editor에서 실행.

```sql
-- 0014: badge_definitions에 reward_points 컬럼 추가
-- 수동 마이그레이션: Supabase SQL Editor 또는 psql로 실행

ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS reward_points integer NOT NULL DEFAULT 0;

-- 카테고리별 기본 보상값 설정
-- onboarding 뱃지: 낮은 보상
UPDATE badge_definitions SET reward_points = 100 WHERE category = 'onboarding';
-- followers 뱃지: 레벨별 차등
UPDATE badge_definitions SET reward_points = 200 WHERE category = 'followers' AND (threshold IS NULL OR threshold <= 10);
UPDATE badge_definitions SET reward_points = 500 WHERE category = 'followers' AND threshold > 10 AND threshold <= 50;
UPDATE badge_definitions SET reward_points = 1000 WHERE category = 'followers' AND threshold > 50;
-- likes 뱃지: 레벨별 차등
UPDATE badge_definitions SET reward_points = 200 WHERE category = 'likes' AND (threshold IS NULL OR threshold <= 10);
UPDATE badge_definitions SET reward_points = 500 WHERE category = 'likes' AND threshold > 10 AND threshold <= 50;
UPDATE badge_definitions SET reward_points = 1000 WHERE category = 'likes' AND threshold > 50;
-- conversations 뱃지
UPDATE badge_definitions SET reward_points = 200 WHERE category = 'conversations' AND (threshold IS NULL OR threshold <= 10);
UPDATE badge_definitions SET reward_points = 500 WHERE category = 'conversations' AND threshold > 10;
-- engagement 뱃지
UPDATE badge_definitions SET reward_points = 300 WHERE category = 'engagement';
-- hidden 뱃지: 높은 보상
UPDATE badge_definitions SET reward_points = 500 WHERE category = 'hidden';
```

---

## 2. `features/badges/schema.ts` (수정)

`badgeDefinitions` 테이블의 `is_hidden` 필드 뒤에 `reward_points` 추가:

```ts
/** 뱃지 정의 테이블 */
export const badgeDefinitions = pgTable(
  "badge_definitions",
  {
    badge_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    category: text().notNull(),
    name: text().notNull(),
    level: text(),
    description: text().notNull(),
    metric_type: text().notNull(),
    threshold: integer(),
    icon_url: text(),
    sort_order: integer().notNull().default(0),
    is_hidden: boolean().notNull().default(false),
    reward_points: integer().notNull().default(0),  // ← 추가
    ...timestamps,
  },
  // ... 기존 정책 유지
);
```

---

## 3. `features/badges/types.ts` (수정)

`BadgeDefinition` 인터페이스에 `reward_points` 필드 추가:

```ts
export interface BadgeDefinition {
  badge_id: number;
  category: BadgeCategory;
  name: string;
  level: string | null;
  description: string;
  metric_type: string;
  threshold: number | null;
  icon_url: string | null;
  sort_order: number;
  is_hidden: boolean;
  reward_points: number;  // ← 추가
}
```

---

## 4. `features/badges/lib/badge-checker.server.ts` (수정)

### 4-1. `BadgeMetrics` 인터페이스에 숫자 원본 필드 3개 추가

기존 boolean 필드(`daily50Messages`, `likesGiven10`, `memories10`)의 원본 숫자값을 진행도 표시에 사용하기 위해 추가:

```ts
export interface BadgeMetrics {
  // ... 기존 필드 모두 유지 ...
  // ↓ 추가 (boolean 원본 숫자값)
  dailyUserMessageCount: number;
  likesGivenCount: number;
  memoriesCount: number;
}
```

### 4-2. `fetchBadgeMetrics()` return에 3개 필드 추가

`fetchBadgeMetrics()` 함수의 return 객체에 추가. 이미 Promise.all에서 조회한 값들이므로 변수명만 매핑:

```ts
return {
  // ... 기존 필드 모두 유지 ...
  // ↓ 추가
  dailyUserMessageCount: daily50Messages,  // getDailyUserMessageCount 결과 (숫자)
  likesGivenCount: likesGivenCount,        // getLikesGivenCount 결과 (숫자)
  memoriesCount: memoriesCount,            // getMemoriesCount 결과 (숫자)
};
```

주의: `daily50Messages` 변수는 `getDailyUserMessageCount(userId)` 의 결과(숫자)이고, 기존 `daily50Messages: daily50Messages >= 50`은 boolean 변환이다. 이름이 혼동되므로 Promise.all 결과 destructuring 시 변수명을 변경해야 할 수 있다:

```ts
const [
  // ...
  dailyUserMsgCount,  // 기존: daily50Messages → 이름 변경
  likesGivenCount,
  memoriesCount,
  // ...
] = await Promise.all([...]);

return {
  // ...
  daily50Messages: dailyUserMsgCount >= 50,  // boolean (기존)
  likesGiven10: likesGivenCount >= 10,       // boolean (기존)
  memories10: memoriesCount >= 10,           // boolean (기존)
  dailyUserMessageCount: dailyUserMsgCount,  // 숫자 (신규)
  likesGivenCount,                           // 숫자 (신규)
  memoriesCount,                             // 숫자 (신규)
};
```

### 4-3. 신규: `BadgeProgress` 인터페이스 + `fetchBadgeProgress()` + `getMetricProgress()`

파일 하단(`evaluateAllBadges` 아래)에 추가:

```ts
/** 뱃지 진행도 */
export interface BadgeProgress {
  current: number;
  target: number;
  percentage: number;
}

function getMetricProgress(
  metricType: string,
  threshold: number | null,
  metrics: BadgeMetrics
): { current: number; target: number } {
  const t = threshold ?? 1;
  switch (metricType) {
    case "follower_count":
      return { current: metrics.followerCount, target: t };
    case "total_likes_received":
      return { current: metrics.totalLikesReceived, target: t };
    case "total_conversations":
      return { current: metrics.totalConversations, target: t };
    case "first_login":
      return { current: metrics.firstLogin ? 1 : 0, target: 1 };
    case "profile_setup":
      return { current: metrics.profileSetup ? 1 : 0, target: 1 };
    case "first_character":
      return { current: Math.min(metrics.characterCount, 1), target: 1 };
    case "attendance_7days":
      return {
        current: Math.max(metrics.maxConsecutiveDays, metrics.totalAttendanceDays),
        target: t,
      };
    case "conversation_10turns":
      return { current: metrics.maxRoomMessageCount, target: t };
    case "single_character_100":
      return { current: metrics.maxRoomMessageCount, target: t };
    case "consecutive_3days":
      return { current: metrics.maxConsecutiveDays, target: t };
    case "daily_50messages":
      return { current: metrics.dailyUserMessageCount, target: 50 };
    case "likes_given_10":
      return { current: metrics.likesGivenCount, target: 10 };
    case "memories_10":
      return { current: metrics.memoriesCount, target: 10 };
    case "dawn_access":
      return { current: metrics.dawnAccess ? 1 : 0, target: 1 };
    case "long_message":
      return { current: metrics.longMessage ? 1 : 0, target: 1 };
    case "search_used":
      return { current: metrics.searchUsed ? 1 : 0, target: 1 };
    case "anniversary_1year":
      return { current: metrics.anniversary1Year ? 1 : 0, target: 1 };
    default:
      return { current: 0, target: 1 };
  }
}

/** 모든 뱃지의 진행도 계산 */
export async function fetchBadgeProgress(
  userId: string
): Promise<Map<number, BadgeProgress>> {
  const [defs, metrics] = await Promise.all([
    drizzle
      .select()
      .from(badgeDefinitions)
      .orderBy(badgeDefinitions.sort_order),
    fetchBadgeMetrics(userId),
  ]);

  const result = new Map<number, BadgeProgress>();
  for (const def of defs) {
    const { current, target } = getMetricProgress(
      def.metric_type,
      def.threshold,
      metrics
    );
    const percentage =
      target > 0
        ? Math.min(100, Math.round((current / target) * 100))
        : current > 0
          ? 100
          : 0;
    result.set(def.badge_id, { current, target, percentage });
  }
  return result;
}
```

---

## 5. `features/badges/lib/queries.server.ts` (수정)

`claimBadge` 함수를 트랜잭션으로 변경하여 뱃지 수령 시 포인트도 지급:

```ts
import { and, eq, sql } from "drizzle-orm";
import drizzle from "~/core/db/drizzle-client.server";

import { badgeDefinitions, userBadges } from "../schema";
import { userPoints, pointTransactions } from "~/features/points/schema";

// ... getAllBadgeDefinitions, getUserBadges 유지 ...

/** 뱃지 수령 + 보상 포인트 지급 (트랜잭션) */
export async function claimBadge(userId: string, badgeId: number) {
  return drizzle.transaction(async (tx) => {
    // 1. 뱃지 insert
    const inserted = await tx
      .insert(userBadges)
      .values({ user_id: userId, badge_id: badgeId })
      .onConflictDoNothing({
        target: [userBadges.user_id, userBadges.badge_id],
      })
      .returning();

    if (inserted.length === 0) return inserted; // 이미 수령됨

    // 2. 보상 포인트 조회
    const [def] = await tx
      .select({ reward_points: badgeDefinitions.reward_points })
      .from(badgeDefinitions)
      .where(eq(badgeDefinitions.badge_id, badgeId))
      .limit(1);

    const reward = def?.reward_points ?? 0;
    if (reward <= 0) return inserted;

    // 3. 포인트 지급 (upsert user_points + insert point_transactions)
    const [updated] = await tx
      .insert(userPoints)
      .values({
        user_id: userId,
        current_balance: reward,
        total_earned: reward,
      })
      .onConflictDoUpdate({
        target: userPoints.user_id,
        set: {
          current_balance: sql`${userPoints.current_balance} + ${reward}`,
          total_earned: sql`${userPoints.total_earned} + ${reward}`,
          updated_at: new Date(),
        },
      })
      .returning({ balance_after: userPoints.current_balance });

    await tx.insert(pointTransactions).values({
      user_id: userId,
      amount: reward,
      balance_after: updated?.balance_after ?? reward,
      type: "reward",
      reason: `뱃지 보상: ${badgeId}`,
      reference_id: `badge:${badgeId}`,
    });

    return inserted;
  });
}

// ... setRepresentativeBadge, unsetRepresentativeBadge 유지 ...
```

---

## 6. `features/badges/api/claim.tsx` (수정)

응답에 `reward_points` 추가. 기존 코드에서 `badgeDef`는 이미 조회되어 있으므로:

변경 전:
```ts
return data(
  { success: true, badge: result[0] },
  { headers }
);
```

변경 후:
```ts
return data(
  { success: true, badge: result[0], reward_points: badgeDef.reward_points ?? 0 },
  { headers }
);
```

---

## 7. `features/badges/screens/badges.tsx` (전면 리디자인)

### Loader

```ts
import type { Route } from "./+types/badges";

import { useState, useEffect } from "react";
import { data } from "react-router";
import { useFetcher, useRevalidator } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";

import { getAllBadgeDefinitions, getUserBadges } from "../lib/queries.server";
import {
  evaluateAllBadges,
  fetchBadgeProgress,
} from "../lib/badge-checker.server";
import type { BadgeProgress } from "../lib/badge-checker.server";

import type { BadgeDefinition, BadgeStatus } from "../types";
import { BadgeClaimModal } from "../components/badge-claim-modal";
import { BadgeRepresentativeModal } from "../components/badge-representative-modal";
import { RepresentativeBadgeCard } from "../components/representative-badge-card";
import { BadgeCard } from "../components/badge-card";

export const meta: Route.MetaFunction = () => [
  { title: `활동 배지 | ${import.meta.env.VITE_APP_NAME}` },
];

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const [definitions, claimedBadges, badgeStatusesMap, progressMap] =
    await Promise.all([
      getAllBadgeDefinitions(),
      getUserBadges(user.id),
      evaluateAllBadges(user.id),
      fetchBadgeProgress(user.id),
    ]);

  const representativeBadge =
    claimedBadges.find((b) => b.is_representative) ?? null;

  const badgeStatuses: Record<string, boolean> = Object.fromEntries(
    [...badgeStatusesMap.entries()].map(([k, v]) => [String(k), v])
  );

  const badgeProgress: Record<
    string,
    { current: number; target: number; percentage: number }
  > = Object.fromEntries(
    [...progressMap.entries()].map(([k, v]) => [String(k), v])
  );

  return data(
    {
      definitions: definitions as BadgeDefinition[],
      claimedBadges,
      badgeStatuses,
      badgeProgress,
      representativeBadge,
    },
    { headers }
  );
}
```

### getStatus 유지
```ts
function getStatus(
  def: BadgeDefinition,
  claimedBadges: Route.ComponentProps["loaderData"]["claimedBadges"],
  representativeBadge: Route.ComponentProps["loaderData"]["representativeBadge"],
  badgeStatuses: Record<string, boolean>
): BadgeStatus {
  const claimed = claimedBadges.find((b) => b.badge_id === def.badge_id);
  if (representativeBadge?.badge_id === def.badge_id) return "representative";
  if (claimed) return "earned";
  if (badgeStatuses[String(def.badge_id)]) return "claimable";
  return "locked";
}
```

### 컴포넌트 UI 전체

```tsx
export default function Badges({ loaderData }: Route.ComponentProps) {
  const {
    definitions,
    claimedBadges,
    badgeStatuses,
    badgeProgress,
    representativeBadge,
  } = loaderData;

  const revalidator = useRevalidator();
  const claimFetcher = useFetcher<{
    success?: boolean;
    error?: string;
    reward_points?: number;
  }>();
  const representativeFetcher = useFetcher<{
    success?: boolean;
    error?: string;
  }>();

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimModalBadge, setClaimModalBadge] =
    useState<BadgeDefinition | null>(null);
  const [representativeModalOpen, setRepresentativeModalOpen] = useState(false);
  const [representativeModalBadge, setRepresentativeModalBadge] =
    useState<BadgeDefinition | null>(null);
  const [representativeModalMode, setRepresentativeModalMode] = useState<
    "set" | "unset"
  >("set");
  const [pendingClaimBadgeId, setPendingClaimBadgeId] = useState<
    number | null
  >(null);

  // claim 결과 처리 (기존 로직 유지)
  useEffect(() => {
    if (claimFetcher.state !== "idle" || !claimFetcher.data) return;
    if (claimFetcher.data.success && pendingClaimBadgeId != null) {
      const def = definitions.find((d) => d.badge_id === pendingClaimBadgeId);
      if (def) {
        setClaimModalBadge(def);
        setClaimModalOpen(true);
      }
      revalidator.revalidate();
    } else if (claimFetcher.data?.error) {
      alert(claimFetcher.data.error);
    }
    setPendingClaimBadgeId(null);
  }, [
    claimFetcher.state,
    claimFetcher.data,
    pendingClaimBadgeId,
    definitions,
    revalidator,
  ]);

  // representative 결과 처리 (기존 로직 유지)
  useEffect(() => {
    if (
      representativeFetcher.state === "idle" &&
      representativeFetcher.data?.success
    ) {
      setRepresentativeModalOpen(false);
      setRepresentativeModalBadge(null);
      revalidator.revalidate();
    }
  }, [representativeFetcher.state, representativeFetcher.data, revalidator]);

  const onClaim = (badgeId: number) => {
    setPendingClaimBadgeId(badgeId);
    claimFetcher.submit(
      { badge_id: badgeId },
      {
        method: "POST",
        action: "/api/badges/claim",
        encType: "application/json",
      }
    );
  };

  const onSetRepresentative = (badgeId: number) => {
    const def = definitions.find((d) => d.badge_id === badgeId);
    if (def) {
      setRepresentativeModalBadge(def);
      setRepresentativeModalMode("set");
      setRepresentativeModalOpen(true);
    }
  };

  const onRepresentativeModalConfirm = () => {
    if (!representativeModalBadge) return;
    representativeFetcher.submit(
      {
        badge_id: representativeModalBadge.badge_id,
        action: representativeModalMode,
      },
      {
        method: "POST",
        action: "/api/badges/representative",
        encType: "application/json",
      }
    );
  };

  const representativeDef = representativeBadge
    ? definitions.find((d) => d.badge_id === representativeBadge.badge_id)
    : null;

  // hidden 뱃지 제외한 전체 리스트 (sort_order 순)
  const visibleBadges = definitions.filter((d) => !d.is_hidden);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-md px-4 py-10 flex flex-col gap-6">
        <h1 className="text-xl font-semibold text-black">활동 배지</h1>

        {/* 대표 배지 */}
        <RepresentativeBadgeCard
          representativeBadge={
            representativeDef
              ? { definition: representativeDef }
              : null
          }
          onUnsetClick={() => {
            if (representativeDef) {
              setRepresentativeModalBadge(representativeDef);
              setRepresentativeModalMode("unset");
              setRepresentativeModalOpen(true);
            }
          }}
        />

        {/* 도전 과제 */}
        <h2 className="text-base font-semibold text-black">도전 과제</h2>

        <div className="flex flex-col gap-3">
          {visibleBadges.map((def) => {
            const status = getStatus(
              def,
              claimedBadges,
              representativeBadge,
              badgeStatuses
            );
            const progress = badgeProgress[String(def.badge_id)] ?? {
              current: 0,
              target: 1,
              percentage: 0,
            };
            return (
              <BadgeCard
                key={def.badge_id}
                definition={def}
                status={status}
                progress={progress}
                onClaim={onClaim}
                onSetRepresentative={onSetRepresentative}
                isClaiming={
                  claimFetcher.state !== "idle" &&
                  pendingClaimBadgeId === def.badge_id
                }
              />
            );
          })}
        </div>
      </div>

      {/* 모달 (기존 유지) */}
      <BadgeClaimModal
        open={claimModalOpen}
        onOpenChange={setClaimModalOpen}
        badge={claimModalBadge}
      />

      <BadgeRepresentativeModal
        open={representativeModalOpen}
        onOpenChange={setRepresentativeModalOpen}
        badge={representativeModalBadge}
        mode={representativeModalMode}
        onConfirm={onRepresentativeModalConfirm}
        isSubmitting={representativeFetcher.state !== "idle"}
      />
    </div>
  );
}
```

### 핵심 포인트

1. **탭 제거**: 기존 "리워드 미션 | 수집한 뱃지" 탭 → 단일 뷰
2. **카테고리 그룹핑 제거**: `BadgeCategoryGroup` 사용하지 않음, 플랫 리스트
3. **hidden 뱃지 필터링**: `definitions.filter(d => !d.is_hidden)` — hidden 뱃지는 도전 과제에 표시하지 않음
4. **loader에 `fetchBadgeProgress` 추가**: `badgeProgress` 객체로 직렬화하여 클라이언트 전달
5. **기존 모달/fetcher 로직 완전 유지**: claim, representative 동작 동일
6. **라이트 테마**: `bg-white`, `text-black`, dark 클래스 모두 제거

---

## 8. `features/badges/components/badge-card.tsx` (전면 리디자인)

```tsx
/**
 * 뱃지 도전 과제 카드: 아이콘 + 이름/설명 + 진행도 바 + 보상 + 버튼
 */
import { PawPrint, Check } from "lucide-react";
import type { BadgeDefinition, BadgeStatus } from "../types";
import type { BadgeProgress } from "../lib/badge-checker.server";
import { BadgeIcon } from "./badge-icon";

interface BadgeCardProps {
  definition: BadgeDefinition;
  status: BadgeStatus;
  progress: BadgeProgress;
  onClaim: (badgeId: number) => void;
  onSetRepresentative: (badgeId: number) => void;
  isClaiming?: boolean;
}

export function BadgeCard({
  definition,
  status,
  progress,
  onClaim,
  onSetRepresentative,
  isClaiming = false,
}: BadgeCardProps) {
  const isLocked = status === "locked";
  const isClaimable = status === "claimable";
  const isEarned = status === "earned" || status === "representative";

  const description = definition.is_hidden
    ? "비밀 조건이에요"
    : definition.description;

  return (
    <div className="flex gap-3 rounded-lg border border-[#E9EAEB] p-4">
      {/* 뱃지 아이콘 */}
      <BadgeIcon
        iconUrl={definition.icon_url}
        category={definition.category}
        name={definition.name}
        size={48}
        inactive={isLocked}
      />

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        {/* 상단: 이름 + 보상 포인트 */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-semibold text-black">
              {definition.name}
              {definition.level && (
                <span className="ml-1 text-sm font-normal text-[#717680]">
                  {definition.level}
                </span>
              )}
            </p>
          </div>
          {definition.reward_points > 0 && (
            <span className="flex items-center gap-0.5 shrink-0 text-sm font-semibold text-[#F5A3C7]">
              +{definition.reward_points.toLocaleString()}
              <PawPrint className="size-3.5" />
            </span>
          )}
        </div>

        {/* 설명 */}
        <p className="text-sm text-[#717680] mt-0.5">{description}</p>

        {/* 진행도 바 (달성 완료가 아닌 경우만) */}
        {!isEarned && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-[#E9EAEB] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#00C4AF] transition-all"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <span className="text-xs text-[#717680] shrink-0">
              {progress.current}/{progress.target}
            </span>
          </div>
        )}

        {/* 버튼 */}
        <div className="mt-2 flex items-center gap-2">
          {isClaimable && (
            <button
              type="button"
              onClick={() => onClaim(definition.badge_id)}
              disabled={isClaiming}
              className="rounded-lg bg-[#00C4AF] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#00b39e] disabled:opacity-50"
            >
              {isClaiming ? "받는 중..." : "받기"}
            </button>
          )}
          {isEarned && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-sm font-semibold text-[#00C4AF]">
                <Check className="size-4" />
                달성 완료
              </span>
              <button
                type="button"
                onClick={() => onSetRepresentative(definition.badge_id)}
                className="rounded-lg border border-[#D5D7DA] bg-white px-3 py-1.5 text-xs font-semibold text-[#414651] transition-colors hover:bg-[#F5F5F5]"
              >
                {status === "representative"
                  ? "대표 뱃지"
                  : "대표로 설정"}
              </button>
            </div>
          )}
          {isLocked && !isClaimable && (
            <span className="text-xs text-[#A4A7AE]">미달성</span>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 핵심 포인트

1. **진행도 바**: `h-2 rounded-full bg-[#E9EAEB]` + 내부 fill `bg-[#00C4AF]`, width를 `percentage%`로
2. **진행도 텍스트**: `{current}/{target}` 표시 (earned가 아닌 경우만)
3. **보상 포인트**: 우측 상단 `+{reward_points}` + PawPrint 아이콘 (핑크)
4. **달성 완료**: Check 아이콘 + "달성 완료" 텍스트 + "대표로 설정" 버튼
5. **dark 클래스 모두 제거**: 라이트 테마만
6. **`BadgeProgress` 타입 import**: `badge-checker.server.ts`에서 import

---

## 9. `features/badges/components/representative-badge-card.tsx` (수정)

dark 테마 클래스 제거, 라이트 테마 적용:

변경 포인트:
- `dark:` 접두사 클래스 모두 제거
- 배경: `bg-[#F5F5F5]` (기존 유지), border `border-[#D5D7DA]`
- 텍스트: `text-black`, `text-[#717680]`
- 기존 로직/props 유지

---

## 10. `features/points/screens/points.tsx` (수정)

"무료로 받기" 탭에서:

### 제거 (주간 출석 카드 + 하단 주의사항)

다음 부분 전체 삭제 (현재 코드 약 L310~L348):
```tsx
{/* 주간 출석 카드 — 삭제 */}
<div className="rounded-lg border border-[#00C4AF] bg-[#FFEEF8] p-5">
  ...
</div>
<p className="text-xs text-[#717680] pb-10">
  ...
</p>
```

### 추가 (뱃지 프로모션 배너)

매일 출석 카드 + 주의사항 아래에 추가:

```tsx
import { Link } from "react-router";
import { ChevronRight, PawPrint } from "lucide-react";  // ChevronRight 추가
```

```tsx
{/* 뱃지 프로모션 배너 */}
<Link
  to="/badges"
  className="flex items-center justify-between rounded-lg border border-[#00C4AF] bg-[#FFF5FB] p-5"
>
  <div className="flex flex-col gap-[5px]">
    <span
      className="inline-flex w-fit items-center rounded px-2 py-1 text-sm text-[#535862]"
      style={{
        background: "linear-gradient(90deg, #FFC3E5 0%, #FFC3E5 100%)",
      }}
    >
      달성 뱃지
    </span>
    <p className="text-sm text-black">
      달성 뱃지 획득하고 냥젤리 받기
    </p>
  </div>
  <ChevronRight className="size-5 text-[#717680] shrink-0" />
</Link>
```

최종 "무료로 받기" 탭 구조:
```
매일 출석 카드 (bg-[#FFF5FB])
주의사항 텍스트
뱃지 프로모션 배너 (bg-[#FFF5FB]) → /badges 링크
```

하단 `pb-10`은 뱃지 배너의 마지막 요소에 적용하거나 전체 컨테이너에 패딩 추가.

---

## 컬러 시스템 (뱃지 페이지)

| 용도 | 컬러 |
|------|------|
| 페이지 배경 | `bg-white` |
| 대표 배지 카드 bg | `bg-[#F5F5F5]` |
| 카드 테두리 | `border-[#E9EAEB]` |
| 진행도 바 bg | `bg-[#E9EAEB]` |
| 진행도 바 fill | `bg-[#00C4AF]` |
| 보상 포인트 텍스트 | `text-[#F5A3C7]` |
| CTA (받기) | `bg-[#00C4AF] text-white` |
| 달성 완료 텍스트 | `text-[#00C4AF]` |
| 설명/보조 텍스트 | `text-[#717680]` |
| 미달성 텍스트 | `text-[#A4A7AE]` |
| 타이틀 | `text-black` |
| 뱃지 배너 bg | `bg-[#FFF5FB]` |
| 뱃지 배너 border | `border-[#00C4AF]` |
| 뱃지 라벨 bg | `#FFC3E5` |

---

## 검증

1. `npm run typecheck` 통과 확인
2. SQL 마이그레이션 실행 후 `badge_definitions`에 `reward_points` 컬럼 존재 확인
3. `/badges` 접속 → 라이트 테마, "활동 배지" 타이틀, 대표 배지 섹션
4. 도전 과제 리스트: 각 카드에 진행도 바 + N/M 텍스트 + 보상 포인트
5. claimable 뱃지 "받기" 클릭 → 뱃지 수령 + 포인트 지급 (user_points, point_transactions)
6. earned 뱃지: "달성 완료" 체크 + "대표로 설정" 버튼
7. `/points` "무료로 받기" 탭 → 주간 출석 카드 없음, 뱃지 프로모션 배너 있음
8. 뱃지 프로모션 배너 클릭 → `/badges`로 이동
9. 기존 대표 뱃지 설정/해제 기능 정상 동작
10. 기존 뱃지 claim 모달 정상 동작
