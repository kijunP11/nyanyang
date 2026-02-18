# 뱃지 피처 Phase 2: API + 조건 체커

## 전제 조건
Phase 1 완료 (schema.ts, types.ts, badge-definitions.ts, SQL 마이그레이션 실행됨)

## 생성 파일 (4개) + 수정 파일 (1개)

---

### 1. `app/features/badges/lib/queries.server.ts`

DB 쿼리 함수들. `import drizzle from "~/core/db/drizzle-client.server"` 사용.

```typescript
import { eq, and, sql } from "drizzle-orm";
import drizzle from "~/core/db/drizzle-client.server";
import { badgeDefinitions, userBadges } from "../schema";

// 모든 뱃지 정의 조회 (sort_order 순)
export async function getAllBadgeDefinitions() {
  return drizzle
    .select()
    .from(badgeDefinitions)
    .orderBy(badgeDefinitions.sort_order);
}

// 유저가 수령한 뱃지 목록 (claimed_at 역순)
export async function getUserBadges(userId: string) {
  return drizzle
    .select()
    .from(userBadges)
    .where(eq(userBadges.user_id, userId))
    .orderBy(sql`${userBadges.claimed_at} DESC`);
}

// 뱃지 수령
export async function claimBadge(userId: string, badgeId: number) {
  return drizzle
    .insert(userBadges)
    .values({ user_id: userId, badge_id: badgeId })
    .onConflictDoNothing()
    .returning();
}

// 대표 뱃지 설정 (트랜잭션: 기존 해제 → 새로 설정)
export async function setRepresentativeBadge(userId: string, badgeId: number) {
  return drizzle.transaction(async (tx) => {
    // 기존 대표 뱃지 모두 해제
    await tx
      .update(userBadges)
      .set({ is_representative: false, updated_at: new Date() })
      .where(and(eq(userBadges.user_id, userId), eq(userBadges.is_representative, true)));
    // 새 대표 뱃지 설정
    await tx
      .update(userBadges)
      .set({ is_representative: true, updated_at: new Date() })
      .where(and(eq(userBadges.user_id, userId), eq(userBadges.badge_id, badgeId)));
  });
}

// 대표 뱃지 해제
export async function unsetRepresentativeBadge(userId: string, badgeId: number) {
  return drizzle
    .update(userBadges)
    .set({ is_representative: false, updated_at: new Date() })
    .where(and(eq(userBadges.user_id, userId), eq(userBadges.badge_id, badgeId)));
}
```

---

### 2. `app/features/badges/lib/badge-checker.server.ts`

뱃지 조건을 서버사이드에서 평가하는 함수. 모든 메트릭을 병렬로 조회하여 성능 최적화.

**메트릭별 데이터 소스:**

| metric_type | 소스 테이블/컬럼 | 쿼리 |
|---|---|---|
| `follower_count` | `profiles.follower_count` | 직접 읽기 |
| `total_likes_received` | `characters.like_count` | SUM (유저의 캐릭터들) |
| `total_conversations` | `chat_rooms` | COUNT (유저의 채팅방) |
| `first_login` | - | 항상 true (유저 존재 = 로그인) |
| `profile_setup` | `profiles.name` | name이 null이 아니고 빈 문자열이 아닌지 |
| `first_character` | `characters` | COUNT > 0 |
| `attendance_7days` | `attendance_records` | max(consecutive_days) >= 7 또는 총 출석일수 >= 7 |
| `conversation_10turns` | `chat_rooms.message_count` | 아무 방이든 message_count >= 10 |
| `single_character_100` | `chat_rooms.message_count` | 아무 방이든 message_count >= 100 |
| `consecutive_3days` | `attendance_records` | 연속 출석일 >= 3 |
| `daily_50messages` | `messages` | 오늘 유저가 보낸 메시지 (role='user') COUNT >= 50 |
| `likes_given_10` | `character_likes` | COUNT >= 10 |
| `memories_10` | `room_memories` + `chat_rooms` | 유저의 방에 속한 메모리 COUNT >= 10 |
| `dawn_access` | 현재 시간 | KST 02:00~04:59 여부 체크 |
| `long_message` | `messages` | 유저 메시지 중 LENGTH(content) >= 500인 것 존재 |
| `search_used` | - | MVP에서는 항상 false 반환 (추후 구현) |
| `anniversary_1year` | `profiles.created_at` | created_at <= NOW() - 1년 |

**구현 패턴:**
```typescript
import drizzle from "~/core/db/drizzle-client.server";
import makeServerClient from "~/core/lib/supa-client.server";

export async function evaluateAllBadges(
  userId: string
): Promise<Map<number, boolean>> {
  // 1. 모든 메트릭을 Promise.all로 병렬 조회
  const [
    followerCount,
    totalLikesReceived,
    totalConversations,
    profileData,
    characterCount,
    // ... 기타 메트릭
  ] = await Promise.all([
    getFollowerCount(userId),
    getTotalLikesReceived(userId),
    // ...
  ]);

  // 2. 각 뱃지의 조건을 평가
  // 3. Map<badge_id, claimable> 반환
}

// 개별 메트릭 조회 함수들
async function getFollowerCount(userId: string): Promise<number> { ... }
async function getTotalLikesReceived(userId: string): Promise<number> { ... }
// ...
```

**중요**: 기존 스키마를 참조할 때 아래 import를 사용:
- `import { profiles } from "~/features/users/schema"`
- `import { characters } from "~/features/characters/schema"`
- `import { chatRooms, messages } from "~/features/chat/schema"`
- `import { attendanceRecords } from "~/features/attendance/schema"`
- `import { characterLikes } from "~/features/characters/schema"`
- `import { roomMemories } from "~/features/chat/schema"`

실제 테이블/컬럼명은 각 schema.ts 파일을 확인해서 사용할 것.

---

### 3. `app/features/badges/api/claim.tsx`

`app/features/attendance/api/checkin.tsx` 패턴을 따른다.

```typescript
import type { Route } from "./+types/claim";
import { data } from "react-router";
import { z } from "zod";
import makeServerClient from "~/core/lib/supa-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import { claimBadge, getAllBadgeDefinitions } from "../lib/queries.server";
import { evaluateSingleBadge } from "../lib/badge-checker.server";

const bodySchema = z.object({
  badge_id: z.number().int().positive(),
});

export async function action({ request }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);
  const { data: { user } } = await client.auth.getUser();
  if (!user) return data({ error: "Unauthorized" }, { status: 401, headers });

  // 1. body 파싱
  const parsed = bodySchema.parse(await request.json());

  // 2. 뱃지 정의 존재 확인
  // 3. 조건 충족 확인 (서버사이드 재검증)
  // 4. INSERT (unique constraint가 중복 방지)
  // 5. 성공 응답

  const result = await claimBadge(user.id, parsed.badge_id);
  if (result.length === 0) {
    return data({ error: "이미 수령한 뱃지입니다." }, { status: 400, headers });
  }
  return data({ success: true, badge: result[0] }, { headers });
}
```

---

### 4. `app/features/badges/api/representative.tsx`

```typescript
import type { Route } from "./+types/representative";
import { data } from "react-router";
import { z } from "zod";
import makeServerClient from "~/core/lib/supa-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import { setRepresentativeBadge, unsetRepresentativeBadge } from "../lib/queries.server";

const bodySchema = z.object({
  badge_id: z.number().int().positive(),
  action: z.enum(["set", "unset"]),
});

export async function action({ request }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);
  const { data: { user } } = await client.auth.getUser();
  if (!user) return data({ error: "Unauthorized" }, { status: 401, headers });

  const parsed = bodySchema.parse(await request.json());

  if (parsed.action === "set") {
    await setRepresentativeBadge(user.id, parsed.badge_id);
  } else {
    await unsetRepresentativeBadge(user.id, parsed.badge_id);
  }

  return data({ success: true }, { headers });
}
```

---

### 5. `app/routes.ts` (수정)

API 라우트 추가 (다른 API prefix 블록들 근처에):

```typescript
...prefix("/api/badges", [
  route("/claim", "features/badges/api/claim.tsx"),
  route("/representative", "features/badges/api/representative.tsx"),
]),
```

페이지 라우트 추가 (navigation layout 안, `/points` 라우트 근처에):

```typescript
layout("core/layouts/private.layout.tsx", { id: "private-badges" }, [
  route("/badges", "features/badges/screens/badges.tsx"),
]),
```

참고: `badges.tsx` 스크린은 Phase 3에서 생성. Phase 2에서는 빈 placeholder 파일이라도 만들어서 typecheck가 통과하게 해야 함.

**빈 placeholder 예시** (`app/features/badges/screens/badges.tsx`):
```typescript
export default function Badges() {
  return <div>뱃지 페이지 (Phase 3에서 구현)</div>;
}
```

---

## 검증
1. `npm run typecheck` 통과
2. `npm run dev` 후 `/badges` 접속 시 placeholder 표시
3. (선택) curl로 API 테스트:
   - `POST /api/badges/claim` with `{ "badge_id": 1 }` (로그인 상태에서)
   - `POST /api/badges/representative` with `{ "badge_id": 1, "action": "set" }`
