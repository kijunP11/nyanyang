# HOME_IMPL_SPEC.md — 홈/탐색 페이지 리빌드

## 개요

Figma "초안" 페이지 섹션 2 (홈/탐색) 디자인을 기반으로 홈 화면을 리빌드한다.
Figma에는 두 가지 버전이 있으며, **Version 2 (세로형 카드 + 가로 스크롤)** 을 기본으로 채택한다.

- Version 1 (node 27:270): 4열 가로형 카드 그리드 — 기존 `HorizontalCharacterCard` 활용
- **Version 2 (node 27:3404): 5열 세로형 카드 + 가로 스크롤** ← 채택

## 현재 구현 vs Figma 비교

| 영역 | 현재 (`home.tsx`) | Figma V2 | 변경 필요 |
|------|-------------------|----------|-----------|
| 배경색 | `#1a1a1a` | `#111111` | O |
| 히어로 캐러셀 | opacity 전환, 텍스트 오버레이 | 3장 peek (좌우 작은 이미지 + 중앙 큰 이미지), 이벤트 뱃지 | O (대폭) |
| 공지 배너 | 인라인 바 (📢 아이콘) | 동일 스타일 (📢 + 텍스트) | △ (미세 조정) |
| 출석체크 배너 | 민트 그라데이션 + 출석하기 버튼 | 민트 그라데이션 + 우측 NYANYANG 로고 | O |
| 검색 바 | 카테고리 드롭다운 + input + 검색 버튼 | 동일 구조 | X (유지) |
| 태그 필터 | pill 버튼, "전체" 활성 | 동일 구조 | X (유지) |
| 캐릭터 섹션 구조 | 내 캐릭터 / 최근 대화 / 실시간 인기 (3섹션) | 챌린지 당선작 / 실시간 인기 / 크리에이터 신작 (3섹션) | O (전면 교체) |
| 캐릭터 카드 | `HorizontalCharacterCard` (가로형) | 세로형 포트레이트 카드 (이미지 + 이름 + 창작자) | O (신규 컴포넌트) |
| 스크롤 방식 | 4열 고정 그리드 | 가로 스크롤 + 우측 화살표 버튼 | O |

## 파일 구조

```
수정 대상:
  app/features/home/screens/home.tsx           # 전면 리빌드

신규 생성:
  app/features/home/components/hero-carousel.tsx         # 히어로 캐러셀 (3장 peek)
  app/features/home/components/vertical-character-card.tsx  # 세로형 캐릭터 카드
  app/features/home/components/scroll-section.tsx        # 가로 스크롤 섹션 래퍼

기존 유지 (수정 없음):
  app/features/home/components/notice-banner.tsx         # NoticeData 타입만 import
  app/features/characters/components/horizontal-character-card.tsx  # 유지 (다른 곳에서 사용)
  app/core/components/navigation-bar.tsx                 # 변경 없음
```

## Phase 1: 신규 컴포넌트

### 1-1. `hero-carousel.tsx` — 히어로 캐러셀

**Figma 디자인:**
- 3장이 동시에 보이는 carousel: 좌측(작은 이미지, 어둡게) + 중앙(큰 이미지) + 우측(작은 이미지, 어둡게)
- 중앙 이미지 위에: 이벤트 뱃지(민트색 pill) + 타이틀 + 서브텍스트
- 하단 그라데이션 오버레이 (black → transparent)
- 전체 높이: ~240px (모바일) ~ 360px (데스크톱)
- 라운드: `rounded-2xl`
- 자동 슬라이드 5초

```typescript
interface HeroSlide {
  image: string;
  title: string;
  description: string;
  badge?: string;       // "이벤트" 등 (민트색 pill)
  link?: string;        // 클릭 시 이동
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  autoPlayInterval?: number;  // default 5000
}
```

**구현 포인트:**
- `overflow-hidden rounded-2xl` 컨테이너
- 3장 peek: CSS transform으로 좌/우 이미지 축소(scale-90) + 어둡게(opacity-60)
- 중앙 이미지에만 그라데이션 오버레이 + 텍스트
- 이벤트 뱃지: `bg-[#14b8a6] text-white text-xs px-3 py-1 rounded-full`
- 슬라이드 인디케이터: 현재 slide는 `w-6 bg-[#14b8a6]`, 나머지 `w-2 bg-white/50`
- 좌우 터치 스와이프 (optional, 없어도 됨)

**참고:** 현재 `home.tsx`의 heroSlides 데이터를 그대로 사용하되, badge 필드 추가

### 1-2. `vertical-character-card.tsx` — 세로형 캐릭터 카드

**Figma 디자인 (V2):**
- 세로형 포트레이트 이미지 (3:4 비율, ~150px 너비)
- 이미지 아래: 캐릭터 이름 (1줄, truncate)
- 그 아래: 창작자명 (작은 텍스트, 1줄)
- 라운드: `rounded-lg`
- 호버: 이미지 scale-105 + 밝기 변화
- 클릭 시: `/chat/{character_id}`로 이동

```typescript
interface VerticalCharacterCardProps {
  character: {
    character_id: number;
    name: string;
    avatar_url: string | null;
    is_nsfw?: boolean;
  };
  creatorName?: string;
}
```

**구현:**
```tsx
export function VerticalCharacterCard({ character, creatorName }: VerticalCharacterCardProps) {
  return (
    <Link
      to={`/chat/${character.character_id}`}
      className="group flex-shrink-0 w-[150px]"
    >
      {/* 이미지 (3:4 비율) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#2f3032]">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">🎭</div>
        )}
        {/* NSFW 배지 */}
        {character.is_nsfw && (
          <Badge variant="destructive" className="absolute left-1 top-1 px-1.5 py-0.5 text-[10px]">
            NSFW
          </Badge>
        )}
      </div>
      {/* 이름 */}
      <h3 className="mt-2 truncate text-sm font-semibold text-white group-hover:text-[#14b8a6]">
        {character.name}
      </h3>
      {/* 창작자 */}
      {creatorName && (
        <p className="truncate text-xs text-[#9ca3af]">
          {creatorName}
        </p>
      )}
    </Link>
  );
}
```

### 1-3. `scroll-section.tsx` — 가로 스크롤 섹션

**Figma 디자인:**
- 섹션 헤더: 타이틀(볼드 흰색) + 우측 ">" 화살표 버튼
- 카드 컨테이너: 가로 스크롤 (scrollbar-hide), gap-4
- 우측 끝에 ">" 원형 스크롤 버튼 (border-[#3f3f46], 클릭 시 한 뷰포트만큼 스크롤)
- 끝까지 스크롤하면 화살표 숨김

```typescript
interface ScrollSectionProps {
  title: string;
  children: React.ReactNode;
  moreLink?: string;        // "전체보기" 링크 (optional)
}
```

**구현 포인트:**
- `useRef`로 scroll container 참조
- 우측 화살표 클릭 → `scrollBy({ left: containerWidth * 0.8, behavior: 'smooth' })`
- `onScroll` 이벤트로 끝 도달 감지 → 화살표 숨김
- 화살표 스타일: `absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-[#3f3f46] bg-[#232323]/80 backdrop-blur flex items-center justify-center text-white hover:border-[#14b8a6] hover:text-[#14b8a6]`

```tsx
export function ScrollSection({ title, children, moreLink }: ScrollSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showArrow, setShowArrow] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowArrow(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: scrollRef.current.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section>
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {moreLink && (
          <Link to={moreLink} className="text-sm text-[#9ca3af] hover:text-white">전체보기</Link>
        )}
      </div>
      {/* 스크롤 컨테이너 */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="scrollbar-hide flex gap-4 overflow-x-auto pb-2"
        >
          {children}
        </div>
        {/* 우측 화살표 */}
        {showArrow && (
          <button onClick={scrollRight} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 ...">
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </section>
  );
}
```

## Phase 2: `home.tsx` 리빌드

### 2-1. Loader 수정

**변경 사항:**
- `myCharacters` 쿼리 제거 (홈에서 사용 안 함)
- `recentChats` 쿼리 제거 (홈에서 사용 안 함)
- 대신 3개 섹션 데이터 추가:
  1. `featuredCharacters` — 추천/이벤트 캐릭터 (like_count 기반 top 10)
  2. `popularCharacters` — 실시간 인기 (view_count 기반 top 10) ← 기존 유지
  3. `newestCharacters` — 크리에이터 신작 (created_at 기반 최신 10개)
- creator_name을 함께 조회하기 위해 `profiles` JOIN 필요

```typescript
interface LoaderData {
  title: string;
  subtitle: string;
  featuredCharacters: CharacterWithCreator[];
  popularCharacters: CharacterWithCreator[];
  newestCharacters: CharacterWithCreator[];
  attendanceRecord: AttendanceRecord | null;
  consecutiveDays: number;
  notices: NoticeData[];
  isLoggedIn: boolean;
}

type CharacterWithCreator = Character & { creator_name: string };
```

**쿼리 변경:**

```typescript
const [
  featuredResult,
  popularResult,
  newestResult,
  attendanceResult,
] = await Promise.all([
  // 1. 추천 캐릭터 (좋아요 순)
  client
    .from("characters")
    .select("*, profiles!characters_creator_id_fkey(username)")
    .eq("is_public", true)
    .eq("status", "approved")
    .order("like_count", { ascending: false })
    .limit(10),

  // 2. 실시간 인기 (조회수 순)
  client
    .from("characters")
    .select("*, profiles!characters_creator_id_fkey(username)")
    .eq("is_public", true)
    .eq("status", "approved")
    .order("view_count", { ascending: false })
    .limit(10),

  // 3. 크리에이터 신작 (최신순)
  client
    .from("characters")
    .select("*, profiles!characters_creator_id_fkey(username)")
    .eq("is_public", true)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(10),

  // 4. 출석 기록
  user
    ? client
        .from("attendance_records")
        .select("*")
        .eq("user_id", user.id)
        .eq("attendance_date", today)
        .maybeSingle()
    : Promise.resolve({ data: null }),
]);
```

**creator_name 추출:**
- Supabase JOIN 결과에서 `profiles.username` 추출
- `result.data?.map(c => ({ ...c, creator_name: c.profiles?.username || "unknown" }))` 형태로 변환

> **주의:** `profiles` FK 관계가 없으면 별도 쿼리로 creator_id → username 매핑 필요.
> 현재 `characters` 테이블에 `creator_id`가 있고, `profiles` 테이블에 `user_id` + `username`이 있으므로, Supabase foreign key 관계 설정 여부 확인 필요.
>
> **대안:** Supabase JOIN이 안 되면, characters를 먼저 fetch → creator_id 목록 추출 → profiles 일괄 조회 → merge

### 2-2. 컴포넌트 구조 (JSX)

```
<div className="min-h-screen bg-[#111111]">                          ← 배경색 변경
  <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">

    {/* 1. 히어로 캐러셀 */}
    <HeroCarousel slides={heroSlides} />

    {/* 2. 공지 배너 (기존과 동일) */}
    {notices.length > 0 && (
      <section className="flex items-center gap-3 rounded-lg bg-[#232323] px-4 py-3">
        ...기존 코드 유지...
      </section>
    )}

    {/* 3. 출석체크 배너 — NYANYANG 로고 추가 */}
    {isLoggedIn && !isCheckedIn && (
      <section className="flex items-center justify-between rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0d9488] px-6 py-4">
        <div className="flex items-center gap-4">
          ...기존 아이콘+텍스트...
          <div>
            <p className="font-semibold text-white">매일매일 출석체크</p>
            <p className="text-sm text-white/80">일일/누적보상 한번에 수령하세요!</p>
          </div>
        </div>
        {/* 우측: NYANYANG 로고 */}
        <div className="flex items-center gap-2">
          <img src="/logo3.png" alt="NYANYANG" className="h-8 opacity-80" />
        </div>
      </section>
    )}

    {/* 4. 검색 바 + 태그 필터 (기존과 동일, 유지) */}
    <section className="flex flex-col gap-4">
      ...기존 검색 + 태그 코드 유지...
    </section>

    {/* 5. 섹션 1: 챌린지 당선작 / 추천 캐릭터 */}
    <ScrollSection title="추천 캐릭터" moreLink="/characters?sort=popular">
      {featuredCharacters.map((character) => (
        <VerticalCharacterCard
          key={character.character_id}
          character={character}
          creatorName={character.creator_name}
        />
      ))}
    </ScrollSection>

    {/* 6. 섹션 2: 실시간 인기 */}
    <ScrollSection title="실시간 인기" moreLink="/characters?sort=popular">
      {popularCharacters.map((character) => (
        <VerticalCharacterCard
          key={character.character_id}
          character={character}
          creatorName={character.creator_name}
        />
      ))}
    </ScrollSection>

    {/* 7. 섹션 3: 크리에이터 신작 */}
    <ScrollSection title="크리에이터 신작!" moreLink="/characters?sort=newest">
      {newestCharacters.map((character) => (
        <VerticalCharacterCard
          key={character.character_id}
          character={character}
          creatorName={character.creator_name}
        />
      ))}
    </ScrollSection>

  </div>
</div>
```

### 2-3. 제거 대상

현재 `home.tsx`에서 **삭제**할 코드:
- `myCharacters` 관련 전체 (쿼리, 타입, 섹션 JSX)
- `recentChats` 관련 전체 (쿼리, 타입, 섹션 JSX, `ChatRoomWithCharacter` 타입)
- 하단 "첫 캐릭터 만들기" CTA 섹션
- 기존 히어로 캐러셀 코드 (HeroCarousel 컴포넌트로 대체)

**유지할 코드:**
- `action` (출석체크) — 변경 없음
- `meta` — 변경 없음
- 공지 배너 인라인 JSX
- 검색 바 + 태그 필터 JSX
- `heroSlides` 데이터 (badge 필드 추가)
- 출석 완료 배너 (isCheckedIn 상태)

### 2-4. 출석체크 배너 (Figma 반영)

**Figma V2 디자인:**
- 좌측: "매일매일 출석체크" (볼드 흰색) + "일일/누적보상 한번에 수령하세요!" (작은 텍스트)
- 우측: NYANYANG 로고 (🐱 아이콘 + "NYANYANG" 텍스트, 흰색)
- 배경: `bg-gradient-to-r from-[#14b8a6] to-[#0d9488]`
- 클릭 시: `/attendance` 페이지로 이동 (버튼 대신 전체 영역 Link)

```tsx
{isLoggedIn && (
  <Link
    to="/attendance"
    className="flex items-center justify-between rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0d9488] px-6 py-5 transition-transform hover:scale-[1.01]"
  >
    <div>
      <p className="text-lg font-bold text-white">매일매일 출석체크</p>
      <p className="text-sm text-white/80">일일/누적보상 한번에 수령하세요!</p>
    </div>
    <div className="flex items-center gap-2 text-white">
      <span className="text-2xl">🐱</span>
      <span className="text-lg font-bold">NYANYANG</span>
    </div>
  </Link>
)}
```

> 기존 출석 버튼 인라인 action (fetcher.submit)은 제거. 출석은 `/attendance` 페이지에서 처리.
> 출석 완료 여부에 관계없이 항상 배너 표시 (로그인 시).

## Phase 3: 히어로 캐러셀 상세 구현

### Figma 레이아웃

```
┌──────────────────────────────────────────────┐
│  [작은이미지]  [   큰 이미지 (중앙)   ]  [작은이미지]  │
│               ┌─────────────────┐             │
│               │   이벤트 뱃지     │             │
│               │                 │             │
│               │  총 상금 5억!    │             │
│               │  캐릭터 콘테스트  │             │
│               │  역대급 상금의... │             │
│               └─────────────────┘             │
│            ● ● ●  (인디케이터)                  │
└──────────────────────────────────────────────┘
```

### 구현 방식

**CSS Transform 기반 (라이브러리 없음):**

```tsx
// 3장이 보이도록 transform + transition
const getSlideStyle = (index: number, current: number, total: number) => {
  const diff = ((index - current) % total + total) % total;
  const normalizedDiff = diff > total / 2 ? diff - total : diff;

  if (normalizedDiff === 0) {
    // 중앙 (현재 슬라이드)
    return "translate-x-0 scale-100 opacity-100 z-20";
  } else if (normalizedDiff === -1 || (normalizedDiff === total - 1)) {
    // 왼쪽
    return "-translate-x-[75%] scale-[0.85] opacity-60 z-10";
  } else if (normalizedDiff === 1 || (normalizedDiff === -(total - 1))) {
    // 오른쪽
    return "translate-x-[75%] scale-[0.85] opacity-60 z-10";
  }
  return "opacity-0 scale-75 z-0";  // 숨김
};
```

- 모든 슬라이드를 `absolute inset-0`으로 겹침
- `transition-all duration-500`으로 부드러운 전환
- 중앙 이미지에만 그라데이션 + 텍스트 오버레이 표시

## 다크 테마 토큰

기존 프로젝트 전체에서 사용하는 다크 테마 토큰:

```
페이지 배경: bg-[#111111]
카드 배경:   bg-[#232323]
보더:       border-[#3f3f46]
텍스트 1차: text-white
텍스트 2차: text-[#9ca3af]
액센트:     bg-[#14b8a6]  (hover: bg-[#0d9488])
입력 배경:  bg-[#2f3032]
```

## 구현 순서

1. **Phase 1**: 3개 컴포넌트 생성
   - `hero-carousel.tsx`
   - `vertical-character-card.tsx`
   - `scroll-section.tsx`

2. **Phase 2**: `home.tsx` 리빌드
   - Loader 수정 (3섹션 데이터)
   - JSX 교체 (히어로 → 공지 → 출석 → 검색/태그 → 3개 스크롤 섹션)
   - 불필요한 코드 삭제

3. **검증**: `npm run typecheck` — 0 errors

## 주의 사항

### Supabase JOIN 관련

`characters` → `profiles` JOIN 시 FK 관계 확인:
- `characters.creator_id` → `auth.users.id` FK 존재
- `profiles.user_id` → `auth.users.id` FK 존재
- 직접 FK가 없으면: `.select("*, profiles!inner(username)")` 대신 별도 쿼리

**안전한 대안 (FK 없을 때):**
```typescript
// 1. 캐릭터 fetch
const { data: characters } = await client.from("characters").select("*")...

// 2. creator_id 목록 추출
const creatorIds = [...new Set(characters.map(c => c.creator_id))];

// 3. profiles 일괄 조회
const { data: profiles } = await client.from("profiles").select("user_id, username").in("user_id", creatorIds);

// 4. merge
const profileMap = new Map(profiles.map(p => [p.user_id, p.username]));
const withCreator = characters.map(c => ({
  ...c,
  creator_name: profileMap.get(c.creator_id) || "unknown",
}));
```

### 기존 import 정리

`home.tsx`에서 제거할 import:
- `HorizontalCharacterCard` (더 이상 홈에서 사용 안 함)
- `Database` 타입 중 `ChatRoom` 관련 (사용 안 함)

추가할 import:
- `HeroCarousel` from `~/features/home/components/hero-carousel`
- `VerticalCharacterCard` from `~/features/home/components/vertical-character-card`
- `ScrollSection` from `~/features/home/components/scroll-section`

### 반응형 고려

- **모바일** (< 640px): 카드 너비 `w-[120px]`, 히어로 높이 `h-[240px]`
- **태블릿** (640~1024px): 카드 너비 `w-[140px]`, 히어로 높이 `h-[300px]`
- **데스크톱** (> 1024px): 카드 너비 `w-[150px]`, 히어로 높이 `h-[360px]`

## 참조 파일

| 파일 | 참조 목적 |
|------|----------|
| `app/features/home/screens/home.tsx` | 리빌드 대상, loader/action 구조 |
| `app/features/characters/components/horizontal-character-card.tsx` | 카드 디자인 패턴 참고 |
| `app/features/home/components/notice-banner.tsx` | NoticeData 타입 |
| `app/features/attendance/components/daily-attendance-card.tsx` | 출석 fetcher 패턴 참고 |
| `app/core/components/navigation-bar.tsx` | SearchInput 스타일 참고 |
| `app/routes.ts` | 라우트 구조 확인 (변경 불필요) |
