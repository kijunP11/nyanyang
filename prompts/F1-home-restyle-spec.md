# F1. 메인(추천) 페이지 리스타일 — 구현 명세서

## 개요

Figma F1 "메인(추천)" 페이지 기준으로 홈 화면을 리스타일합니다.

**주요 변경:**
- 다크 테마(`#111111`) → 라이트 테마(white)
- 로그인 사용자에게 왼쪽 채팅 사이드바 표시
- AI 추천 검색 바 리스타일
- 태그 필터 리스타일
- 캐릭터 섹션 제목 변경 + 카드에 좋아요 수 표시
- 인라인 공지/출석체크 배너 제거 → 프로모션 배너 추가
- 모든 컴포넌트 라이트 테마 통일

## 수정 파일 요약

| # | 파일 | 작업 |
|---|------|------|
| 1 | `home/screens/home.tsx` | **대규모 리스타일** — 다크→라이트, 사이드바, 섹션 재구성 |
| 2 | `home/components/hero-carousel.tsx` | 라이트 테마 적용 |
| 3 | `home/components/scroll-section.tsx` | 라이트 테마 + badge prop 추가 |
| 4 | `home/components/vertical-character-card.tsx` | 라이트 테마 + 좋아요 수 표시 |
| 5 | `core/layouts/navigation.layout.tsx` | 콘텐츠 래퍼 수정 (홈 풀블리드 지원) |

---

## 공통 디자인 토큰 (라이트 테마)

| 항목 | 값 |
|------|-----|
| 배경 (메인) | `bg-white` |
| 카드 이미지 fallback 배경 | `bg-[#F5F5F5]` |
| 섹션 제목 | `text-xl font-bold text-[#181D27]` |
| 서브 텍스트 / 창작자명 | `text-[#535862]` |
| 보조 텍스트 | `text-[#A4A7AE]` |
| 프라이머리 컬러 | `#41C7BD` |
| 검색 입력 필드 | `h-12 bg-white border border-[#E9EAEB] rounded-xl` |
| 검색 포커스 | `focus:border-[#41C7BD]` |
| 태그 필터 (활성) | `bg-[#41C7BD] text-white` |
| 태그 필터 (비활성) | `bg-[#F5F5F5] text-[#535862] hover:bg-[#E9EAEB]` |
| 스크롤 화살표 | `bg-white border border-[#E9EAEB] text-[#535862] hover:border-[#41C7BD] hover:text-[#41C7BD]` |
| "전체보기" 링크 | `text-[#A4A7AE] hover:text-[#535862]` |
| HOT 배지 | `bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full` |

---

## 1. `app/features/home/screens/home.tsx`

### 변경 요약
- `bg-[#111111]` → `bg-white`
- 인라인 공지 배너 (section 2) **제거**
- 인라인 출석체크 배너 (section 3) **제거**
- 검색 바 + 태그 필터 라이트 테마 리스타일
- 캐릭터 섹션 제목 변경:
  - "추천 캐릭터" → "떠오르는 신예 창작자들"
  - "🔥 실시간 인기" → "실시간 인기" (HOT 배지 포함)
  - "크리에이터 신작!" → "크리에이터 신작"
- 로그인 시 `ChatSidebar` 왼쪽에 표시
- 하단 프로모션 배너 추가
- `user` 데이터를 loader에서 반환 (사이드바용)

### import 변경

```tsx
// 추가:
import { ChevronRight, Search } from "lucide-react";
import { ChatSidebar, type ChatSidebarUser } from "~/core/components/chat-sidebar";

// 삭제 (더 이상 사용하지 않음):
import type { NoticeData } from "../components/notice-banner";
```

### LoaderData 인터페이스 변경

```tsx
interface LoaderData {
  title: string;
  subtitle: string;
  featuredCharacters: CharacterWithCreator[];
  popularCharacters: CharacterWithCreator[];
  newestCharacters: CharacterWithCreator[];
  isLoggedIn: boolean;
  user: ChatSidebarUser | null;  // ← 추가
  // attendanceRecord, consecutiveDays, notices 제거
}
```

### loader 함수 변경

**삭제할 항목:**
- `attendanceRecord` 관련 코드 전부 (Promise.all의 4번째 쿼리, `today` 변수, `consecutiveDays` 계산)
- `notices` mock 데이터
- `defaultData`에서 `attendanceRecord`, `consecutiveDays`, `notices` 제거

**추가할 항목:**
```tsx
// 기본값에 추가:
user: null,

// user 정보를 return data에 추가:
user: user ? {
  name: user.user_metadata?.name || user.user_metadata?.nickname || "Anonymous",
  email: user.email,
  avatarUrl: user.user_metadata?.avatar_url || null,
} : null,
```

### 히어로 슬라이드 데이터 (유지, 텍스트만 정리)

기존 `heroSlides` 배열 유지. 변경 없음.

### 태그 목록 변경

```tsx
// 현재:
["전체", "추천", "남성", "여성", "로맨스", "순애", "구원", "추리", "집착", "미래", "소꿉친구", "가족", "유명인", "판타지"]

// 변경:
["전체", "추천", "남성", "여성", "로맨스", "순애", "구원", "추리", "집착", "소꿉친구", "유명인", "판타지", "미래", "일상"]
```

### 컴포넌트 JSX 전체 교체

```tsx
export default function Home({ loaderData }: Route.ComponentProps) {
  const {
    featuredCharacters,
    popularCharacters,
    newestCharacters,
    isLoggedIn,
    user,
  } = loaderData;

  const heroSlides: HeroSlide[] = [
    {
      image: "/nft.jpg",
      title: "나만의 AI 캐릭터와 대화하세요",
      description: "다양한 캐릭터들이 기다리고 있어요",
      badge: "이벤트",
      link: "/characters",
    },
    {
      image: "/nft-2.jpg",
      title: "캐릭터를 직접 만들어보세요",
      description: "나만의 특별한 캐릭터를 창작해보세요",
      link: "/characters/create",
    },
    {
      image: "/blog/hello-world.jpg",
      title: "매일 출석하고 포인트 받기",
      description: "꾸준히 방문하면 더 많은 혜택이!",
      link: "/attendance",
    },
  ];

  const tags = [
    "전체", "추천", "남성", "여성", "로맨스", "순애", "구원",
    "추리", "집착", "소꿉친구", "유명인", "판타지", "미래", "일상",
  ];

  return (
    <div className="flex min-h-[calc(100vh-57px)] bg-white">
      {/* 채팅 사이드바 (로그인 시, md 이상) */}
      {isLoggedIn && user && (
        <div className="sticky top-[57px] hidden h-[calc(100vh-57px)] md:block">
          <ChatSidebar user={user} chats={[]} />
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="min-w-0 flex-1">
        <div className="mx-auto flex max-w-screen-xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
          {/* 1. 히어로 캐러셀 */}
          <HeroCarousel slides={heroSlides} />

          {/* 2. AI 추천 검색 */}
          <section>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A4A7AE]" />
              <input
                type="text"
                placeholder="AI 추천 검색 — 캐릭터명, 태그로 검색해보세요"
                className="h-12 w-full rounded-xl border border-[#E9EAEB] bg-white pl-12 pr-4 text-sm text-[#181D27] placeholder:text-[#A4A7AE] focus:border-[#41C7BD] focus:outline-none"
                readOnly
              />
            </div>
          </section>

          {/* 3. 태그 필터 */}
          <section>
            <div className="scrollbar-hide flex gap-2 overflow-x-auto">
              {tags.map((tag, index) => (
                <button
                  key={tag}
                  className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    index === 0
                      ? "bg-[#41C7BD] text-white"
                      : "bg-[#F5F5F5] text-[#535862] hover:bg-[#E9EAEB]"
                  }`}
                >
                  {tag}
                </button>
              ))}
              <button className="flex flex-shrink-0 items-center gap-1 rounded-full border border-[#E9EAEB] px-4 py-2 text-sm font-medium text-[#A4A7AE] hover:bg-[#F5F5F5]">
                <span>#</span>
                <span>태그 더보기</span>
              </button>
            </div>
          </section>

          {/* 4. 섹션 A — 떠오르는 신예 창작자들 */}
          {featuredCharacters.length > 0 && (
            <ScrollSection title="떠오르는 신예 창작자들" moreLink="/characters?sort=featured">
              {featuredCharacters.map((character) => (
                <VerticalCharacterCard
                  key={character.character_id}
                  character={character}
                  creatorName={character.creator_name}
                />
              ))}
            </ScrollSection>
          )}

          {/* 5. 섹션 B — 실시간 인기 */}
          {popularCharacters.length > 0 && (
            <ScrollSection title="실시간 인기" badge="HOT" moreLink="/characters?sort=popular">
              {popularCharacters.map((character) => (
                <VerticalCharacterCard
                  key={character.character_id}
                  character={character}
                  creatorName={character.creator_name}
                />
              ))}
            </ScrollSection>
          )}

          {/* 6. 섹션 C — 크리에이터 신작 */}
          {newestCharacters.length > 0 && (
            <ScrollSection title="크리에이터 신작" moreLink="/characters?sort=newest">
              {newestCharacters.map((character) => (
                <VerticalCharacterCard
                  key={character.character_id}
                  character={character}
                  creatorName={character.creator_name}
                />
              ))}
            </ScrollSection>
          )}

          {/* 7. 프로모션 배너 */}
          <section>
            <Link
              to="/notices"
              className="block overflow-hidden rounded-2xl transition-transform hover:scale-[1.01]"
            >
              <div className="flex h-[120px] items-center justify-between bg-gradient-to-r from-[#41C7BD] to-[#2BA89F] px-8">
                <div>
                  <p className="text-lg font-bold text-white">나냥 기획전</p>
                  <p className="text-sm text-white/80">
                    특별한 캐릭터를 만나보세요
                  </p>
                </div>
                <ChevronRight className="h-6 w-6 text-white" />
              </div>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
```

### 핵심 변경 요약
- `bg-[#111111]` → `bg-white`
- 인라인 공지/출석 배너 삭제 → 프로모션 배너로 교체
- 검색 바: 드롭다운+인풋+버튼 → 단일 검색 인풋 (아이콘 포함)
- 태그: 다크 테마 colors → 라이트 테마 colors
- 섹션 제목 3개 변경
- 로그인 시 `ChatSidebar` sticky 사이드바 추가
- loader에서 `user` 데이터 반환 추가

---

## 2. `app/features/home/components/hero-carousel.tsx`

### 변경 요약
배경/오버레이 색상만 라이트 테마로 변경. 레이아웃 변경 없음.

### 변경 1: 인디케이터 색상 (116~128행)

```tsx
// 현재 (122행):
? "w-6 bg-[#14b8a6]"
: "w-2 bg-white/50 hover:bg-white/70"

// 변경:
? "w-6 bg-[#41C7BD]"
: "w-2 bg-[#A4A7AE] hover:bg-[#535862]"
```

### 변경 2: 배지 색상 (73행)

```tsx
// 현재:
className="mb-2 inline-block rounded-full bg-[#14b8a6] px-3 py-1 text-xs font-medium text-white"

// 변경:
className="mb-2 inline-block rounded-full bg-[#41C7BD] px-3 py-1 text-xs font-medium text-white"
```

### 변경 3: 그라데이션 오버레이 유지

70행의 그라데이션 `from-black/80 via-black/30 to-transparent`는 이미지 위 텍스트 가독성을 위해 **유지**.

---

## 3. `app/features/home/components/scroll-section.tsx`

### 변경 요약
- 텍스트/배경 색상 라이트 테마 전환
- `badge` prop 추가 (HOT 배지 지원)

### interface 변경 (11~15행)

```tsx
// 현재:
interface ScrollSectionProps {
  title: string;
  children: React.ReactNode;
  moreLink?: string;
}

// 변경:
interface ScrollSectionProps {
  title: string;
  children: React.ReactNode;
  moreLink?: string;
  badge?: string;
}
```

### 함수 시그니처 변경 (17~21행)

```tsx
// 현재:
export function ScrollSection({
  title,
  children,
  moreLink,
}: ScrollSectionProps) {

// 변경:
export function ScrollSection({
  title,
  children,
  moreLink,
  badge,
}: ScrollSectionProps) {
```

### 헤더 JSX 변경 (58~70행)

```tsx
// 현재:
<div className="mb-4 flex items-center justify-between">
  <h2 className="text-xl font-bold text-white">{title}</h2>
  {moreLink && (
    <Link
      to={moreLink}
      className="text-sm text-[#9ca3af] hover:text-white"
    >
      전체보기
    </Link>
  )}
</div>

// 변경:
<div className="mb-4 flex items-center justify-between">
  <div className="flex items-center gap-2">
    <h2 className="text-xl font-bold text-[#181D27]">{title}</h2>
    {badge && (
      <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
        {badge}
      </span>
    )}
  </div>
  {moreLink && (
    <Link
      to={moreLink}
      className="text-sm text-[#A4A7AE] hover:text-[#535862]"
    >
      전체보기
    </Link>
  )}
</div>
```

### 화살표 버튼 색상 변경 (84~89행)

```tsx
// 현재:
className="absolute -right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#3f3f46] bg-[#232323]/80 text-white backdrop-blur transition-colors hover:border-[#14b8a6] hover:text-[#14b8a6]"

// 변경:
className="absolute -right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#E9EAEB] bg-white/90 text-[#535862] shadow-sm backdrop-blur transition-colors hover:border-[#41C7BD] hover:text-[#41C7BD]"
```

---

## 4. `app/features/home/components/vertical-character-card.tsx`

### 변경 요약
- 색상 라이트 테마 전환
- 좋아요 수(`like_count`) 표시 추가

### import 추가 (7행)

```tsx
// 현재:
import { User } from "lucide-react";

// 변경:
import { Heart, User } from "lucide-react";
```

### interface 변경 (12~19행)

```tsx
// 현재:
interface VerticalCharacterCardProps {
  character: {
    character_id: number;
    name: string;
    avatar_url: string | null;
    is_nsfw?: boolean;
  };
  creatorName?: string | null;
}

// 변경:
interface VerticalCharacterCardProps {
  character: {
    character_id: number;
    name: string;
    avatar_url: string | null;
    is_nsfw?: boolean;
    like_count?: number;
  };
  creatorName?: string | null;
}
```

### JSX 변경 — 이미지 fallback 배경 (32행)

```tsx
// 현재:
<div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#2f3032]">

// 변경:
<div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#F5F5F5]">
```

### JSX 변경 — 캐릭터 이름 (55행)

```tsx
// 현재:
<h3 className="mt-2 truncate text-sm font-semibold text-white group-hover:text-[#14b8a6]">

// 변경:
<h3 className="mt-2 truncate text-sm font-semibold text-[#181D27] group-hover:text-[#41C7BD]">
```

### JSX 변경 — 창작자 이름 (60행)

```tsx
// 현재:
<p className="truncate text-xs text-[#9ca3af]">{creatorName}</p>

// 변경:
<p className="truncate text-xs text-[#535862]">{creatorName}</p>
```

### JSX 추가 — 좋아요 수 (61행 뒤에 추가)

```tsx
{/* 창작자 이름 닫는 태그 뒤, </Link> 닫는 태그 전에 추가: */}
{character.like_count != null && character.like_count > 0 && (
  <div className="mt-1 flex items-center gap-1 text-xs text-[#A4A7AE]">
    <Heart className="h-3 w-3" />
    <span>{character.like_count.toLocaleString()}</span>
  </div>
)}
```

### 최종 컴포넌트 전체 코드

```tsx
import { Heart, User } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "~/core/components/ui/badge";

interface VerticalCharacterCardProps {
  character: {
    character_id: number;
    name: string;
    avatar_url: string | null;
    is_nsfw?: boolean;
    like_count?: number;
  };
  creatorName?: string | null;
}

export function VerticalCharacterCard({
  character,
  creatorName,
}: VerticalCharacterCardProps) {
  return (
    <Link
      to={`/chat/${character.character_id}`}
      className="group w-[120px] flex-shrink-0 sm:w-[140px] lg:w-[150px]"
    >
      {/* 이미지 (3:4 비율) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#F5F5F5]">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User className="h-10 w-10 text-[#A4A7AE]" />
          </div>
        )}
        {character.is_nsfw && (
          <Badge
            variant="destructive"
            className="absolute left-1 top-1 px-1.5 py-0.5 text-[10px]"
          >
            NSFW
          </Badge>
        )}
      </div>
      {/* 이름 */}
      <h3 className="mt-2 truncate text-sm font-semibold text-[#181D27] group-hover:text-[#41C7BD]">
        {character.name}
      </h3>
      {/* 창작자 */}
      {creatorName && (
        <p className="truncate text-xs text-[#535862]">{creatorName}</p>
      )}
      {/* 좋아요 수 */}
      {character.like_count != null && character.like_count > 0 && (
        <div className="mt-1 flex items-center gap-1 text-xs text-[#A4A7AE]">
          <Heart className="h-3 w-3" />
          <span>{character.like_count.toLocaleString()}</span>
        </div>
      )}
    </Link>
  );
}
```

---

## 5. `app/core/layouts/navigation.layout.tsx`

### 변경 요약

홈 페이지가 풀블리드 레이아웃을 사용할 수 있도록, 콘텐츠 래퍼의 마진/패딩을 제거하고 각 자식 페이지가 자체 레이아웃을 관리하도록 변경합니다.

### 변경 방법

콘텐츠 래퍼 `<div>` 수정 — **2곳** (Suspense fallback + Await resolve 내부):

```tsx
// 현재 (33행, fallback 내부):
<div className="mx-auto my-16 w-full max-w-screen-2xl px-5 md:my-32">
  <Outlet context={...} />
</div>

// 변경:
<div className="flex-1">
  <Outlet context={...} />
</div>
```

```tsx
// 현재 (64행, Await resolve 내부):
<div className="mx-auto my-16 w-full max-w-screen-2xl px-5 md:my-32">
  <Outlet context={ctx} />
</div>

// 변경:
<div className="flex-1">
  <Outlet context={ctx} />
</div>
```

### 외부 래퍼도 수정

```tsx
// 현재 (28행):
<div className="flex min-h-screen flex-col justify-between">

// 변경:
<div className="flex min-h-screen flex-col">
```

`justify-between` 제거 — 각 페이지가 자체 min-height/spacing을 관리.

### 영향받는 다른 페이지 대응

레이아웃 래퍼에서 `mx-auto my-16 max-w-screen-2xl px-5 md:my-32`를 제거하므로, **기존 페이지들의 루트 요소에 동일한 래퍼 클래스를 추가**해야 할 수 있습니다.

**영향 없는 페이지** (자체 레이아웃 사용):
- 모든 auth 페이지 (`min-h-screen flex items-center justify-center`)
- 홈 페이지 (이번에 수정)
- 채팅 페이지

**확인 필요 페이지** — 아래 페이지들의 루트 요소에 래퍼 추가:
```tsx
// 필요 시 각 페이지의 return JSX를 아래처럼 감싸기:
<div className="mx-auto my-16 w-full max-w-screen-2xl px-5 md:my-32">
  {/* 기존 내용 */}
</div>
```

대상 페이지 목록:
- `features/contact/screens/contact-us.tsx`
- `features/points/screens/points.tsx`
- `features/guide/screens/guide.tsx`
- `features/attendance/screens/attendance.tsx`
- `features/placeholder/screens/my-content.tsx`
- `features/placeholder/screens/image-generation.tsx`
- `features/blog/screens/posts.tsx`
- `features/blog/screens/post.tsx`
- `features/notices/screens/notice-list.tsx`
- `features/notices/screens/notice-detail.tsx`
- `features/characters/screens/character-list.tsx`
- `features/characters/screens/character-create.tsx`
- `features/characters/screens/character-edit.tsx`
- `features/admin/screens/dashboard.tsx`
- `features/admin/screens/users.tsx`
- `features/admin/screens/characters.tsx`
- `core/screens/error.tsx`
- `features/auth/screens/confirm.tsx`

> **구현 참고**: 각 페이지를 열어서 이미 자체 레이아웃(min-h-screen, 자체 max-w 등)을 갖고 있는지 확인하세요. 이미 자체 레이아웃이 있으면 래퍼 추가 불필요합니다.

---

## 삭제하지 않는 파일

아래 컴포넌트들은 F1 홈 리스타일에서 사용하지 않지만, 다른 곳에서 재사용될 수 있으므로 **삭제하지 않습니다**:
- `attendance-check.tsx`
- `notice-banner.tsx`
- `search-filter.tsx`
- `section-header.tsx`
- `story-card.tsx`
- `story-grid.tsx`

---

## 검증

```bash
npm run typecheck
```

### 화면 확인 체크리스트

1. **비로그인 상태** (`/` 접근):
   - [ ] 사이드바 없음 (전체 너비 콘텐츠)
   - [ ] 라이트 테마 (흰 배경)
   - [ ] 히어로 캐러셀 정상 동작
   - [ ] AI 추천 검색 바 표시
   - [ ] 태그 필터 가로 스크롤
   - [ ] 3개 캐릭터 섹션 표시 (새 제목)
   - [ ] "실시간 인기" 옆 HOT 배지
   - [ ] 캐릭터 카드에 좋아요 수 표시
   - [ ] 프로모션 배너 표시
   - [ ] 푸터 정상 표시

2. **로그인 상태** (`/` 접근):
   - [ ] 왼쪽 채팅 사이드바 표시 (md+ 화면)
   - [ ] 사이드바 sticky (스크롤 시 고정)
   - [ ] 모바일에서 사이드바 숨김
   - [ ] 메인 콘텐츠 사이드바 옆에 정상 배치
   - [ ] 모든 섹션 동일하게 표시

3. **다른 페이지 깨짐 여부**:
   - [ ] `/login` — 정상
   - [ ] `/join` — 정상
   - [ ] `/points` — 정상 (래퍼 추가했으면)
   - [ ] `/characters` — 정상
   - [ ] `/blog` — 정상

---

## 참고: 현재 코드 → 변경 맵핑

| 현재 (다크) | 변경 (라이트) |
|-------------|--------------|
| `bg-[#111111]` | `bg-white` |
| `bg-[#232323]` | `bg-[#F5F5F5]` |
| `bg-[#2f3032]` | `bg-[#F5F5F5]` |
| `border-[#3f3f46]` | `border-[#E9EAEB]` |
| `text-white` (제목) | `text-[#181D27]` |
| `text-[#9ca3af]` | `text-[#535862]` 또는 `text-[#A4A7AE]` |
| `text-[#14b8a6]` / `bg-[#14b8a6]` | `text-[#41C7BD]` / `bg-[#41C7BD]` |
| `hover:bg-[#3f3f46]` | `hover:bg-[#E9EAEB]` |
| `hover:text-white` | `hover:text-[#535862]` |
