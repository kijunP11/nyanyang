# F1 Phase 3: 검색 바 + 태그 필터 + 섹션 제목 변경

## 전제조건
Phase 1, 2 적용 완료 상태

## 목표
- 검색 바를 "AI 추천 검색" 스타일로 변경 (드롭다운+인풋+버튼 → 단일 검색 인풋)
- 태그 목록 업데이트
- 캐릭터 섹션 제목 변경
- "실시간 인기" 섹션에 HOT 배지 추가

## 수정 파일: `app/features/home/screens/home.tsx` (1개만)

---

### 1. import 추가

```tsx
// 추가:
import { Search } from "lucide-react";
```

### 2. 검색 바 섹션 전체 교체

Phase 1에서 색상만 바꿨던 검색 바 섹션(드롭다운 + 인풋 + 버튼)을 단일 인풋으로 교체합니다.

**현재 (Phase 1 적용 후 — "검색 바" 부분):**
```tsx
{/* 검색 바 */}
<div className="flex gap-2">
  <button className="flex h-11 items-center gap-1.5 rounded-lg border border-[#E9EAEB] bg-white px-4 text-sm text-[#181D27] hover:bg-[#F5F5F5]">
    <span>전체</span>
    <svg ...>...</svg>
  </button>
  <div className="relative flex-1">
    <input
      type="text"
      placeholder="캐릭터명, 태그로 검색"
      className="h-11 w-full rounded-lg border border-[#E9EAEB] bg-white px-4 text-sm text-[#181D27] placeholder:text-[#A4A7AE] focus:border-[#41C7BD] focus:outline-none"
      readOnly
    />
  </div>
  <button className="h-11 rounded-lg bg-[#41C7BD] px-6 text-sm font-medium text-white hover:bg-[#41C7BD]/90">
    검색
  </button>
</div>
```

**변경 (전체 교체) — "AI 추천 대화" 추천 바 스타일:**

Figma 디자인에서 검색 바는 단순 인풋이 아니라 **"AI 추천 대화" 배지 + 추천 텍스트 + 돋보기 아이콘** 형태입니다.

```tsx
{/* AI 추천 검색 */}
<div className="flex h-12 w-full items-center gap-3 rounded-xl border border-[#E9EAEB] bg-[#F5F5F5] px-4">
  <span className="flex-shrink-0 rounded-md bg-[#41C7BD] px-2 py-0.5 text-xs font-bold text-white">
    AI 추천 대화
  </span>
  <p className="min-w-0 flex-1 truncate text-sm text-[#535862]">
    올해의 &apos;달콤살벌 매력&apos;에 빠져볼까? 지금 바로 시작하세요
  </p>
  <Search className="h-5 w-5 flex-shrink-0 text-[#A4A7AE]" />
</div>
```

> 현재는 정적 UI. 추후 클릭 시 검색 페이지 이동 또는 추천 채팅방 연결.
> 추천 텍스트는 하드코딩 → 추후 API 연동 가능.

### 3. 검색+태그를 감싸는 `<section>` 분리

현재 검색 바와 태그가 하나의 `<section className="flex flex-col gap-4">`로 묶여 있습니다.
검색 바를 교체했으므로, 두 영역을 별도 요소로 분리합니다:

```tsx
{/* 현재 구조: */}
<section className="flex flex-col gap-4">
  {/* 검색 바 */}
  ...
  {/* 태그 필터 */}
  ...
</section>

{/* 변경: 각각 독립 요소로 */}
{/* AI 추천 검색 */}
<section>
  <div className="relative">
    <Search className="..." />
    <input ... />
  </div>
</section>

{/* 태그 필터 */}
<section>
  <div className="scrollbar-hide flex gap-2 overflow-x-auto">
    ...
  </div>
</section>
```

### 4. 태그 목록 변경

```tsx
// 현재:
{["전체", "추천", "남성", "여성", "로맨스", "순애", "구원", "추리", "집착", "미래", "소꿉친구", "가족", "유명인", "판타지"].map(...)}

// 변경 ("가족" 삭제, "일상" 추가, 순서 정리):
{["전체", "추천", "남성", "여성", "로맨스", "순애", "구원", "추리", "집착", "소꿉친구", "유명인", "판타지", "미래", "일상"].map(...)}
```

### 5. 캐릭터 섹션 제목 + badge 변경

```tsx
// 현재:
<ScrollSection title="추천 캐릭터" moreLink="/characters?sort=popular">

// 변경:
<ScrollSection title="떠오르는 신예 창작자들" moreLink="/characters?sort=featured">
```

```tsx
// 현재:
<ScrollSection title="🔥 실시간 인기" moreLink="/characters?sort=popular">

// 변경 (이모지 제거, badge prop 사용):
<ScrollSection title="실시간 인기" badge="HOT" moreLink="/characters?sort=popular">
```

```tsx
// 현재:
<ScrollSection title="크리에이터 신작!" moreLink="/characters?sort=newest">

// 변경 (느낌표 제거, NEW 배지 추가):
<ScrollSection title="크리에이터 신작" badge="NEW" moreLink="/characters?sort=newest">
```

---

## 검증

```bash
npm run typecheck
```

- [ ] 검색 바: 돋보기 아이콘 + 단일 인풋, 드롭다운/버튼 없음
- [ ] 태그: "일상" 추가됨, "가족" 없음
- [ ] 섹션 A: "떠오르는 신예 창작자들"
- [ ] 섹션 B: "실시간 인기" + 빨간 HOT 배지
- [ ] 섹션 C: "크리에이터 신작" + 민트색 NEW 배지
