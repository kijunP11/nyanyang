# F1 Phase 6: 태그 필터 인라인 확장

## 전제조건
Phase 1~5 적용 완료 상태

## 목표
- "태그 더보기" 클릭 시 전체 태그 목록을 인라인으로 확장 표시
- 축소 시 기존 가로 스크롤 상태로 복귀
- Figma "장르" 프레임의 전체 태그 목록 반영

## 수정 파일: `app/features/home/screens/home.tsx` (1개만)

---

### 1. import 추가

```tsx
// 추가:
import { useState } from "react";
```

### 2. 컴포넌트 내부에 state + 태그 목록 추가

`heroSlides` 배열 뒤에 추가:

```tsx
const [tagsExpanded, setTagsExpanded] = useState(false);

// 빠른 필터용 태그 (축소 시 표시)
const quickTags = [
  "전체", "추천", "남성", "여성", "로맨스", "순애", "구원",
  "추리", "집착", "소꿉친구", "유명인", "판타지", "일상",
];

// 전체 태그 목록 (Figma "장르" 프레임 기준)
const allTags = [
  "전체", "추천", "남성", "여성", "로맨스", "순애", "구원", "후회",
  "집착", "피폐", "소꿉친구", "가족", "유명인", "츤데레", "얀데레",
  "판타지", "천사", "요정", "악마", "엘프", "빌런", "현대판타지",
  "동양판타지", "대체역사", "무협", "TS물", "BL", "페티쉬", "BDSM",
  "퍼리", "근육", "버튜버", "애니메이션", "뱀파이어", "밀리터리",
  "아포칼립스", "무인도", "SF", "로봇", "오피스", "자캐", "신화",
  "영화드라마", "괴물", "동물", "수인", "동화", "책", "메이드&집사",
  "수녀", "외계인", "이세계", "마법", "공포", "게임 캐릭터", "히어로",
  "히로인", "도미넌트", "서큐버스", "NTR", "NTL", "고어", "하렘",
  "조난", "재난", "일상", "청춘", "드라마", "학생", "힐링", "개그",
  "새드엔딩", "교육", "생산성", "게임", "스포츠", "시뮬", "추리",
  "던전", "감옥", "방탈출",
];

const displayTags = tagsExpanded ? allTags : quickTags;
```

> `quickTags`에서 "미래"를 제거했습니다 (Figma 마스터 목록에 없음).

### 3. 태그 필터 섹션 전체 교체

```tsx
// 현재 (212~247행):
{/* 3. 태그 필터 */}
<section>
  <div className="scrollbar-hide flex gap-2 overflow-x-auto">
    {[
      "전체",
      "추천",
      ...
      "일상",
    ].map((tag, index) => (
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

// 변경:
{/* 3. 태그 필터 */}
<section>
  <div className={tagsExpanded
    ? "flex flex-wrap gap-2"
    : "scrollbar-hide flex gap-2 overflow-x-auto"
  }>
    {displayTags.map((tag, index) => (
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
    <button
      onClick={() => setTagsExpanded(!tagsExpanded)}
      className="flex flex-shrink-0 items-center gap-1 rounded-full border border-[#E9EAEB] px-4 py-2 text-sm font-medium text-[#A4A7AE] hover:bg-[#F5F5F5]"
    >
      <span>#</span>
      <span>{tagsExpanded ? "접기" : "태그 더보기"}</span>
    </button>
  </div>
</section>
```

### 변경 포인트 요약

| 항목 | 축소 (기본) | 확장 |
|------|------------|------|
| 태그 목록 | `quickTags` (13개) | `allTags` (81개) |
| 레이아웃 | `overflow-x-auto` 가로 스크롤 | `flex-wrap` 줄바꿈 |
| 버튼 텍스트 | "태그 더보기" | "접기" |

---

## 검증

```bash
npm run typecheck
```

- [ ] 기본 상태: 13개 태그 가로 스크롤 + "태그 더보기" 버튼
- [ ] "태그 더보기" 클릭: 81개 전체 태그 줄바꿈 표시 + "접기" 버튼
- [ ] "접기" 클릭: 13개로 복귀, 가로 스크롤 모드
- [ ] "전체" 태그 민트색 활성 상태 유지
- [ ] 확장 시 태그 정렬: Figma 순서 (전체, 추천, 남성, 여성, 로맨스, ...)
