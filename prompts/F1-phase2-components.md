# F1 Phase 2: 하위 컴포넌트 라이트 테마

## 목표
히어로 캐러셀, 스크롤 섹션, 캐릭터 카드 컴포넌트를 라이트 테마로 전환합니다.

## 수정 파일 (3개)
1. `app/features/home/components/hero-carousel.tsx`
2. `app/features/home/components/scroll-section.tsx`
3. `app/features/home/components/vertical-character-card.tsx`

---

## 1. `hero-carousel.tsx` — 대규모 변경

Figma 디자인에 맞춰 하단 컨트롤을 전면 교체합니다:
- 기존: 점(dot) 인디케이터만
- 변경: **"01/12" 페이지 카운터 + 재생/일시정지 + 좌우 화살표**

### import 추가

```tsx
// 추가:
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
```

### 배지 색상 (73행)

```tsx
// 현재:
className="mb-2 inline-block rounded-full bg-[#14b8a6] px-3 py-1 text-xs font-medium text-white"

// 변경:
className="mb-2 inline-block rounded-full bg-[#41C7BD] px-3 py-1 text-xs font-medium text-white"
```

### 자동재생 토글 state 추가

```tsx
// 기존 state 옆에 추가:
const [isPlaying, setIsPlaying] = useState(true);
```

### useEffect 수정 — isPlaying 조건 추가

```tsx
// 현재:
useEffect(() => {
  if (slides.length <= 1) return;
  const timer = setInterval(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, autoPlayInterval);
  return () => clearInterval(timer);
}, [slides.length, autoPlayInterval]);

// 변경:
useEffect(() => {
  if (slides.length <= 1 || !isPlaying) return;
  const timer = setInterval(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, autoPlayInterval);
  return () => clearInterval(timer);
}, [slides.length, autoPlayInterval, isPlaying]);
```

### 좌우 이동 핸들러 추가

```tsx
// getSlideStyle 함수 뒤에 추가:
const goToPrev = () => {
  setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
};

const goToNext = () => {
  setCurrentSlide((prev) => (prev + 1) % slides.length);
};
```

### 하단 컨트롤 전체 교체 (115~129행)

기존 dot 인디케이터를 삭제하고, Figma 디자인의 컨트롤 바로 교체:

```tsx
// 삭제 (기존 인디케이터):
<div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2">
  {slides.map((_, index) => (
    <button
      key={index}
      onClick={() => setCurrentSlide(index)}
      className={`h-2 rounded-full transition-all ${
        index === currentSlide
          ? "w-6 bg-[#14b8a6]"
          : "w-2 bg-white/50 hover:bg-white/70"
      }`}
    />
  ))}
</div>

// 추가 (새 컨트롤 바):
{/* 하단 좌측: 페이지 카운터 + 재생/일시정지 */}
<div className="absolute bottom-4 left-8 z-30 flex items-center gap-2">
  <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur">
    {String(currentSlide + 1).padStart(2, "0")}/{String(slides.length).padStart(2, "0")}
  </span>
  <button
    onClick={() => setIsPlaying(!isPlaying)}
    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
  >
    {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
  </button>
</div>

{/* 하단 우측: 좌우 화살표 */}
<div className="absolute bottom-4 right-8 z-30 flex items-center gap-1">
  <button
    onClick={goToPrev}
    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
  >
    <ChevronLeft className="h-4 w-4" />
  </button>
  <button
    onClick={goToNext}
    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
  >
    <ChevronRight className="h-4 w-4" />
  </button>
</div>
```

### 변경하지 않는 것
- 그라데이션 오버레이 (`from-black/80 via-black/30 to-transparent`) — 이미지 위 텍스트 가독성 유지
- 슬라이드 레이아웃/크기 — 동일
- 3-peek 구조 — 동일

---

## 2. `scroll-section.tsx`

### 변경 1: `badge` prop 추가 (interface + 함수 시그니처)

```tsx
// 현재 (11~15행):
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

```tsx
// 현재 (17~21행):
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

### 변경 2: 헤더 라이트 테마 + 배지 표시 (58~70행)

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
      <span className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${
        badge === "HOT" ? "bg-red-500" : "bg-[#41C7BD]"
      }`}>
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

### 변경 3: 화살표 버튼 색상 (84~89행)

```tsx
// 현재:
className="absolute -right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#3f3f46] bg-[#232323]/80 text-white backdrop-blur transition-colors hover:border-[#14b8a6] hover:text-[#14b8a6]"

// 변경:
className="absolute -right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#E9EAEB] bg-white/90 text-[#535862] shadow-sm backdrop-blur transition-colors hover:border-[#41C7BD] hover:text-[#41C7BD]"
```

---

## 3. `vertical-character-card.tsx`

### 변경 1: import 추가 (7행)

```tsx
// 현재:
import { User } from "lucide-react";

// 변경:
import { Heart, User } from "lucide-react";
```

### 변경 2: interface에 like_count + tags 추가 (12~19행)

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
    tags?: string[] | null;
  };
  creatorName?: string | null;
}
```

### 변경 3: 이미지 fallback 배경 (32행)

```tsx
// 현재:
<div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#2f3032]">

// 변경:
<div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#F5F5F5]">
```

### 변경 4: fallback 아이콘 색상 (41행)

```tsx
// 현재:
<User className="h-10 w-10 text-[#6b7280]" />

// 변경:
<User className="h-10 w-10 text-[#A4A7AE]" />
```

### 변경 5: 캐릭터 이름 색상 (55행)

```tsx
// 현재:
<h3 className="mt-2 truncate text-sm font-semibold text-white group-hover:text-[#14b8a6]">

// 변경:
<h3 className="mt-2 truncate text-sm font-semibold text-[#181D27] group-hover:text-[#41C7BD]">
```

### 변경 6: 창작자 이름 색상 (60행)

```tsx
// 현재:
<p className="truncate text-xs text-[#9ca3af]">{creatorName}</p>

// 변경:
<p className="truncate text-xs text-[#535862]">{creatorName}</p>
```

### 변경 7: 태그 표시 + 좋아요 수 추가 (61행 뒤, `</Link>` 닫는 태그 전)

```tsx
{/* 창작자 이름 뒤에 추가: */}
{/* 태그 표시 */}
{character.tags && character.tags.length > 0 && (
  <div className="mt-1 flex gap-1">
    {character.tags.slice(0, 2).map((tag) => (
      <span
        key={tag}
        className="rounded bg-[#F5F5F5] px-1.5 py-0.5 text-[10px] text-[#535862]"
      >
        {tag}
      </span>
    ))}
  </div>
)}
{/* 좋아요 수 */}
{character.like_count != null && character.like_count > 0 && (
  <div className="mt-1 flex items-center gap-1 text-xs text-[#A4A7AE]">
    <Heart className="h-3 w-3" />
    <span>{character.like_count.toLocaleString()}</span>
  </div>
)}
```

> `tags` 필드는 characters 테이블에 이미 존재하면 바로 사용. 없으면 빈 배열로 처리되어 태그가 표시되지 않음 (graceful fallback).

---

## 검증

```bash
npm run typecheck
```

- [ ] 히어로 캐러셀: "01/03" 카운터 + ▶/⏸ 버튼 (좌하단), < > 화살표 (우하단)
- [ ] 스크롤 섹션: 제목 검정색, "전체보기" 회색, 화살표 흰 배경
- [ ] 캐릭터 카드: 검정 이름, 회색 창작자, 좋아요 수 표시
- [ ] 캐릭터 카드 fallback: 밝은 회색 배경
