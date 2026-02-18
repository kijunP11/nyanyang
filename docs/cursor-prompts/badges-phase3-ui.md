# 뱃지 피처 Phase 3: UI + 모달

## 전제 조건
Phase 1 (스키마+시드) + Phase 2 (API) 완료. `/badges` 라우트 등록됨.

## Figma 디자인 요약

### 페이지 레이아웃
- 상단 탭: "리워드 미션" | "수집한 뱃지" (밑줄 active 스타일)
- 좌측 사이드바: 레벨, 오늘 출석, 유저 프로필 (기존 navigation layout이 처리)
- 메인 영역 3섹션:
  1. **대표 뱃지**: 빈 상태 = 냐냥 일러스트 + "나를 대표할 뱃지를 설정해보세요!" / 설정됨 = 뱃지 아이콘 + 이름 + 달성 문구
  2. **최근 달성 뱃지**: 빈 상태 = "아직 얻은 뱃지가 없어요" / 있음 = 민트 배경 카드 가로 스크롤
  3. **수집한 뱃지**: 카테고리별 섹션 헤더 (팔로워, 좋아요, 대화, 입문, 몰입, 히든) + 뱃지 행 목록

### 뱃지 카드 행 (각 뱃지)
- 좌: 뱃지 아이콘 (48x48, 비활성=grayscale+opacity-50)
- 중: 뱃지 이름 (볼드) + 획득 조건 설명 (서브텍스트)
- 우: [받기] 버튼 (조건 충족 시 민트 `bg-[#00c4af]`, 미충족 시 `bg-[#e9eaeb]` disabled) + [대표 뱃지로 설정] 버튼 (수령 완료 시 outline)
- 히든 뱃지: 조건 텍스트 → "비밀 조건이에요 🤫" (is_hidden=true인 경우)

### 모달 공통
- dim: `bg-[rgba(16,24,40,0.7)] backdrop-blur-[1px]` 전체 화면
- 모달 박스: `bg-white rounded-[12px] shadow p-[24px]` 중앙 정렬
- shadcn/ui `Dialog` 컴포넌트 사용

### 뱃지 획득 모달 (badge-claim-modal)
- 뱃지 이미지 (크게)
- 뱃지 이름 + 레벨
- 획득 조건 요약
- [확인] 단일 CTA 버튼 (full-width 민트)

### 대표 뱃지 설정 확인 모달 (badge-representative-modal, mode="set")
- 뱃지 이미지
- 뱃지 이름 + 레벨
- 획득 조건
- [대표 뱃지로 설정하기] (민트 primary) + [취소하기] (outline)

### 대표 뱃지 해제 모달 (badge-representative-modal, mode="unset")
- 뱃지 이미지
- 뱃지 이름 + 레벨
- "대표 뱃지를 해제하면 프로필에 표시되지 않아요."
- [대표 뱃지 해제하기] (민트 primary) + [취소하기] (outline)

---

## 생성/수정 파일

### 1. `app/features/badges/screens/badges.tsx` (수정 — Phase 2의 placeholder 교체)

**loader**:
```typescript
import type { Route } from "./+types/badges";
import { data } from "react-router";
import makeServerClient from "~/core/lib/supa-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import { getAllBadgeDefinitions, getUserBadges } from "../lib/queries.server";
import { evaluateAllBadges } from "../lib/badge-checker.server";

export const meta: Route.MetaFunction = () => [
  { title: `뱃지 컬렉션 | ${import.meta.env.VITE_APP_NAME}` },
];

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });

  const [definitions, claimedBadges, badgeStatuses] = await Promise.all([
    getAllBadgeDefinitions(),
    getUserBadges(user.id),
    evaluateAllBadges(user.id),
  ]);

  const representativeBadge = claimedBadges.find(b => b.is_representative) || null;

  return data({ definitions, claimedBadges, badgeStatuses, representativeBadge }, { headers });
}
```

**컴포넌트**: 탭 + 3섹션 렌더링. 상태 관리:
- `activeTab`: "mission" | "badges" (기본값 "badges")
- 모달 상태: `claimModalBadge`, `representativeModalBadge`, `representativeModalMode`
- `useFetcher`로 claim/representative API 호출 후 revalidation

### 2. `app/features/badges/components/badge-card.tsx`

Props:
```typescript
interface BadgeCardProps {
  definition: BadgeDefinition;
  status: BadgeStatus; // 'locked' | 'claimable' | 'earned' | 'representative'
  onClaim: (badgeId: number) => void;
  onSetRepresentative: (badgeId: number) => void;
}
```

레이아웃: flex row, items-center, gap-4, p-4, rounded-lg, border

### 3. `app/features/badges/components/badge-category-group.tsx`

Props:
```typescript
interface BadgeCategoryGroupProps {
  categoryLabel: string;
  badges: Array<{ definition: BadgeDefinition; status: BadgeStatus }>;
  onClaim: (badgeId: number) => void;
  onSetRepresentative: (badgeId: number) => void;
}
```

헤더: `text-lg font-bold mb-3` + 구분선

### 4. `app/features/badges/components/badge-claim-modal.tsx`

`Dialog` from `~/core/components/ui/dialog` 사용.
`useFetcher`로 `POST /api/badges/claim` 호출.
성공 시 모달 닫힘 + fetcher revalidation으로 목록 갱신.

### 5. `app/features/badges/components/badge-representative-modal.tsx`

mode: "set" | "unset" prop으로 두 가지 모드 지원.
`useFetcher`로 `POST /api/badges/representative` 호출.

### 6. `app/features/badges/components/representative-badge-card.tsx`

대표 뱃지 설정됨: 뱃지 아이콘 + 이름 + 설명 (클릭 시 해제 모달 오픈)
빈 상태: 냐냥 캐릭터 일러스트 + "나를 대표할 뱃지를 설정해보세요!" 텍스트
- 냐냥 일러스트는 `/public` 폴더에 있는 기존 에셋 사용 가능, 없으면 이모지나 Lucide 아이콘으로 대체

### 7. `app/features/badges/components/recent-badge-cards.tsx`

가로 스크롤: `flex overflow-x-auto gap-4 pb-2`
각 카드: 민트 그라데이션 배경 `bg-gradient-to-br from-[#00c4af]/10 to-[#00c4af]/5`, rounded-xl, p-4
빈 상태: 냐냥 캐릭터 + "아직 얻은 뱃지가 없어요"

### 8. `app/core/components/navigation-bar.tsx` (수정)

`/points` → `/badges` 링크 변경:
- 데스크톱 NavLink (line ~190 부근)
- 모바일 Sheet NavLink (line ~300 부근)

두 곳 모두 `to="/points"` → `to="/badges"` 변경.

---

## 색상/스타일 토큰

| 요소 | 값 |
|------|-----|
| 민트 primary | `#00c4af` |
| 민트 ring | `#41C7BD` |
| 비활성 버튼 bg | `#e9eaeb` |
| 비활성 버튼 border | `#e9eaeb` |
| 활성 outline 버튼 | `border-[#d5d7da] bg-white` |
| 모달 dim | `rgba(16,24,40,0.7)` + `backdrop-blur-[1px]` |
| 모달 박스 | `bg-white rounded-[12px] shadow-lg p-6` |
| 비활성 뱃지 아이콘 | `grayscale opacity-50` |
| 카테고리 헤더 | `text-lg font-bold text-[#181D27] dark:text-white` |
| 서브텍스트 | `text-sm text-[#535862] dark:text-[#94969C]` |

## 뱃지 아이콘 처리

12개 (팔로워/좋아요/대화)는 Figma에서 에셋 추출하여 Supabase Storage `badges/` 버킷에 업로드 (별도 작업).
14개 (입문/몰입/히든)는 icon_url이 null → 카테고리별 이모지 fallback 렌더링:
- onboarding: 🥚🏷️🐱📅💬
- engagement: 💕🌻📝💘🐟
- hidden: 🌙⌨️🔍👴

`icon_url`이 있으면 `<img>`, 없으면 이모지를 원형 컨테이너에 표시.

---

## 검증
1. `npm run typecheck` 통과
2. `npm run dev` → `/badges` 접속
3. 수집한 뱃지 탭에서 카테고리별 뱃지 목록 표시 확인
4. [받기] 클릭 → 획득 모달 → 확인 → 뱃지 수령 완료
5. [대표 뱃지로 설정] → 확인 모달 → 설정하기 → 상단 대표 뱃지 반영
6. 대표 뱃지 클릭 → 해제 모달 → 해제하기 → 빈 상태로 복귀
