# F2-2. 메인 노출 크리에이터 뱃지

## 목표
크리에이터 프로필에 `badge_type` 필드를 추가하고, 캐릭터 카드에서 크리에이터 이름 옆에 뱃지 아이콘을 표시한다.

## 뱃지 타입
| badge_type | 라벨 | 아이콘 | 색상 |
|------------|------|--------|------|
| `none` | (없음) | 표시 안 함 | — |
| `popular` | 인기 크리에이터 | 별(star) 아이콘 | `#41C7BD` (민트) |
| `official` | 공식 크리에이터 | 체크마크 뱃지 아이콘 | `#41C7BD` (민트) |

> 초기에는 Supabase 대시보드에서 수동으로 badge_type 값을 관리한다.

---

## 수정 파일 (5개)

### 1. NEW: `sql/migrations/0006_add_badge_type.sql` — 수동 마이그레이션

```sql
-- 0006: Add badge_type to profiles
-- Manual migration (not tracked in Drizzle journal)
-- Run via Supabase SQL Editor or psql

ALTER TABLE profiles
  ADD COLUMN badge_type text NOT NULL DEFAULT 'none';

COMMENT ON COLUMN profiles.badge_type IS 'Creator badge type: none, popular, official';
```

> Drizzle journal에 추가하지 않는다 (db:generate 인터랙티브 프롬프트 이슈).
> SQL Editor에서 직접 실행한다.

---

### 2. NEW: `app/core/components/creator-badge.tsx` — 뱃지 아이콘 컴포넌트

```tsx
/**
 * Creator Badge Icon
 *
 * 크리에이터 뱃지 타입에 따라 인라인 아이콘을 렌더링한다.
 * - popular: 별(star) 아이콘
 * - official: 체크마크 뱃지 아이콘
 * - none: 렌더링하지 않음
 */

type BadgeType = "none" | "popular" | "official";

interface CreatorBadgeProps {
  badgeType?: BadgeType | null;
  className?: string;
}

export function CreatorBadge({ badgeType, className }: CreatorBadgeProps) {
  if (!badgeType || badgeType === "none") return null;

  if (badgeType === "popular") {
    return (
      <svg
        className={className ?? "size-3.5 shrink-0"}
        viewBox="0 0 16 16"
        fill="none"
        aria-label="인기 크리에이터"
      >
        <circle cx="8" cy="8" r="8" fill="#41C7BD" />
        <path
          d="M8 4l1.1 2.2 2.4.4-1.7 1.7.4 2.4L8 9.6l-2.2 1.1.4-2.4L4.5 6.6l2.4-.4L8 4z"
          fill="white"
        />
      </svg>
    );
  }

  if (badgeType === "official") {
    return (
      <svg
        className={className ?? "size-3.5 shrink-0"}
        viewBox="0 0 16 16"
        fill="none"
        aria-label="공식 크리에이터"
      >
        <path
          d="M8 0l2.2 1.5H13l.5 2.8L15.3 6.5 14 8.8l.3 2.9-2.7 1.1L9.8 15 8 13.2 6.2 15l-1.8-2.2-2.7-1.1.3-2.9L.7 6.5 2.5 4.3 3 1.5h2.8L8 0z"
          fill="#41C7BD"
        />
        <path
          d="M6.5 8.5l1 1 2.5-2.5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }

  return null;
}
```

---

### 3. 수정: `app/features/home/screens/home.tsx` — loader에서 badge_type 조회

#### 3-A. `CharacterWithCreator` 타입에 `creator_badge_type` 추가

```tsx
// 현재 (23~24행):
type CharacterWithCreator = Character & { creator_name: string | null };

// 변경:
type CharacterWithCreator = Character & {
  creator_name: string | null;
  creator_badge_type: string | null;
};
```

#### 3-B. profiles 조회 시 badge_type 포함

```tsx
// 현재 (108~113행):
const { data: profiles } = creatorIds.length > 0
  ? await client
      .from("profiles")
      .select("profile_id, name")
      .in("profile_id", creatorIds)
  : { data: [] };

// 변경:
const { data: profiles } = creatorIds.length > 0
  ? await client
      .from("profiles")
      .select("profile_id, name, badge_type")
      .in("profile_id", creatorIds)
  : { data: [] };
```

#### 3-C. profileMap에 badge_type 포함

```tsx
// 현재 (116~118행):
const profileMap = new Map(
  (profiles || []).map((p) => [p.profile_id, p.name])
);

// 변경:
const profileMap = new Map(
  (profiles || []).map((p) => [p.profile_id, { name: p.name, badge_type: p.badge_type }])
);
```

#### 3-D. addCreatorName 함수에 badge_type 추가

```tsx
// 현재 (121~125행):
const addCreatorName = (chars: Character[]): CharacterWithCreator[] =>
  chars.map((c) => ({
    ...c,
    creator_name: profileMap.get(c.creator_id) || null,
  }));

// 변경:
const addCreatorName = (chars: Character[]): CharacterWithCreator[] =>
  chars.map((c) => {
    const profile = profileMap.get(c.creator_id);
    return {
      ...c,
      creator_name: profile?.name || null,
      creator_badge_type: profile?.badge_type || null,
    };
  });
```

---

### 4. 수정: `app/features/home/components/vertical-character-card.tsx` — 뱃지 표시

#### 4-A. import 추가

```tsx
// 추가:
import { CreatorBadge } from "~/core/components/creator-badge";
```

#### 4-B. interface에 `creatorBadgeType` prop 추가

```tsx
// 현재 (12~23행):
interface VerticalCharacterCardProps {
  character: {
    character_id: number;
    name: string;
    avatar_url: string | null;
    is_nsfw?: boolean;
    like_count?: number;
    tags?: string[] | null;
  };
  creatorName?: string | null;
  badge?: string;
}

// 변경:
interface VerticalCharacterCardProps {
  character: {
    character_id: number;
    name: string;
    avatar_url: string | null;
    is_nsfw?: boolean;
    like_count?: number;
    tags?: string[] | null;
  };
  creatorName?: string | null;
  creatorBadgeType?: string | null;
  badge?: string;
}
```

#### 4-C. props 디스트럭처링에 추가

```tsx
// 현재 (25~29행):
export function VerticalCharacterCard({
  character,
  creatorName,
  badge,
}: VerticalCharacterCardProps) {

// 변경:
export function VerticalCharacterCard({
  character,
  creatorName,
  creatorBadgeType,
  badge,
}: VerticalCharacterCardProps) {
```

#### 4-D. 창작자 이름 옆에 뱃지 아이콘 표시

```tsx
// 현재 (76~78행):
{creatorName && (
  <p className="truncate text-xs text-[#535862]">{creatorName}</p>
)}

// 변경:
{creatorName && (
  <div className="flex items-center gap-1">
    <p className="truncate text-xs text-[#535862]">{creatorName}</p>
    <CreatorBadge badgeType={creatorBadgeType as "none" | "popular" | "official" | undefined} />
  </div>
)}
```

---

### 5. 수정: `app/features/home/screens/home.tsx` — 카드에 prop 전달

세 곳의 `<VerticalCharacterCard>` 호출에 `creatorBadgeType` prop 추가:

```tsx
// 현재 (각 섹션별):
<VerticalCharacterCard
  key={character.character_id}
  character={character}
  creatorName={character.creator_name}
/>

// 변경 (세 곳 모두):
<VerticalCharacterCard
  key={character.character_id}
  character={character}
  creatorName={character.creator_name}
  creatorBadgeType={character.creator_badge_type}
/>
```

> "실시간 인기" 섹션은 `badge="HOT"` prop도 이미 있으므로 그것은 유지.

---

## database.types.ts 업데이트

SQL 마이그레이션 실행 후 `npm run db:typegen`으로 타입을 재생성하면 profiles Row에 `badge_type: string`이 자동 추가된다.

만약 typegen이 안 되면, 수동으로 `database.types.ts`의 profiles 섹션에 추가:

```ts
// profiles > Row에 추가:
badge_type: string

// profiles > Insert에 추가:
badge_type?: string

// profiles > Update에 추가:
badge_type?: string
```

---

## 검증

```bash
npm run typecheck
```

- [ ] `badge_type` 컬럼이 profiles 테이블에 존재 (SQL Editor에서 확인)
- [ ] 홈 화면: 크리에이터에 `badge_type=popular` 설정 → 이름 옆에 민트색 별 아이콘 표시
- [ ] 홈 화면: 크리에이터에 `badge_type=official` 설정 → 이름 옆에 민트색 체크마크 아이콘 표시
- [ ] 홈 화면: `badge_type=none` (기본값) → 아이콘 없음 (기존과 동일)
- [ ] 뱃지 아이콘이 이름 오른쪽에 인라인으로 표시되고 truncate에 영향 없음
- [ ] 비로그인 상태에서도 에러 없이 동작 (badge_type이 null이면 아이콘 미표시)

## 참고: RLS 제한 사항
현재 `profiles` 테이블은 `authenticatedRole`에만 select 정책이 있어, 비로그인 유저는 creator_name과 badge_type 모두 null로 표시된다. 이는 기존부터 있던 제한사항이며, 추후 anon role에 대한 select 정책 추가로 해결 가능.
