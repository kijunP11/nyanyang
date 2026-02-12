# F1 Phase 1: 홈 라이트 테마 기반 전환

## 목표
home.tsx의 다크 테마를 라이트로 전환하고, 사용하지 않는 인라인 배너를 제거합니다.
**이 Phase에서는 레이아웃 구조와 섹션 내용은 변경하지 않습니다.** 색상 전환만 합니다.

## 수정 파일: `app/features/home/screens/home.tsx` (1개만)

---

### 1. import 정리

**삭제:**
```tsx
// 삭제 (15행):
import type { NoticeData } from "../components/notice-banner";
```

### 2. LoaderData 인터페이스 변경

```tsx
// 삭제할 필드:
attendanceRecord: AttendanceRecord | null;
consecutiveDays: number;
notices: NoticeData[];

// 유지할 필드:
title: string;
subtitle: string;
featuredCharacters: CharacterWithCreator[];
popularCharacters: CharacterWithCreator[];
newestCharacters: CharacterWithCreator[];
isLoggedIn: boolean;
```

### 3. loader 함수 변경

**defaultData에서 삭제:**
```tsx
// 삭제:
attendanceRecord: null,
consecutiveDays: 0,
notices: [],
```

**Promise.all에서 4번째 쿼리 삭제:**
```tsx
// 삭제 (110~118행 전체 — 출석 기록 쿼리):
// 4. 오늘 출석 기록 (로그인한 경우만)
user
  ? client
      .from("attendance_records")
      .select("*")
      .eq("user_id", user.id)
      .eq("attendance_date", today)
      .maybeSingle()
  : Promise.resolve({ data: null }),
```

동시에 Promise.all 결과에서도 `attendanceResult` 제거:
```tsx
// 현재:
const [featuredResult, popularResult, newestResult, attendanceResult] = await Promise.all([...]);

// 변경:
const [featuredResult, popularResult, newestResult] = await Promise.all([...]);
```

**삭제할 코드 (출석/공지 관련):**
```tsx
// 삭제:
const today = new Date().toISOString().split("T")[0];

// 삭제 (149~163행):
const attendanceRecord = attendanceResult.data as AttendanceRecord | null;
const consecutiveDays = attendanceRecord?.consecutive_days || 0;
const notices: NoticeData[] = [
  {
    id: "1",
    type: "event",
    title: "신규 캐릭터 이벤트",
    content: "새로운 캐릭터를 만들고 보상을 받아보세요!",
    date: "2024-01-15",
    link: "/characters/create",
  },
];

// return data 객체에서도 삭제:
attendanceRecord,
consecutiveDays,
notices,
```

### 4. 컴포넌트 destructuring 변경

```tsx
// 현재:
const {
  featuredCharacters,
  popularCharacters,
  newestCharacters,
  attendanceRecord,
  consecutiveDays,
  notices,
  isLoggedIn,
} = loaderData;

// 변경:
const {
  featuredCharacters,
  popularCharacters,
  newestCharacters,
  isLoggedIn,
} = loaderData;
```

```tsx
// 삭제:
const isCheckedIn = !!attendanceRecord;
```

### 5. JSX 라이트 테마 전환 + 배너 제거

**루트 div 변경 (221행):**
```tsx
// 현재:
<div className="min-h-screen bg-[#111111]">
  <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">

// 변경:
<div className="-mx-5 -my-16 min-h-[calc(100vh-57px)] bg-white md:-my-32">
  <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
```

> `-mx-5 -my-16 md:-my-32`는 부모 `navigation.layout.tsx` 래퍼의 마진/패딩을 상쇄하여 풀블리드 효과를 냅니다.

**공지 배너 섹션 전체 삭제 (227~244행):**
```tsx
// 삭제:
{/* 2. 공지 배너 */}
{notices.length > 0 && (
  <section className="flex items-center gap-3 rounded-lg bg-[#232323] px-4 py-3">
    ...
  </section>
)}
```

**출석체크 배너 섹션 전체 삭제 (246~279행):**
```tsx
// 삭제:
{/* 3. 출석체크 배너 */}
{isLoggedIn && (
  <Link
    to="/attendance"
    className={`flex items-center justify-between ...`}
  >
    ...
  </Link>
)}
```

**검색 바 + 태그 필터 색상 전환 (281~347행):**

검색 바:
```tsx
// 현재 (285행):
<button className="flex h-11 items-center gap-1.5 rounded-lg border border-[#3f3f46] bg-[#232323] px-4 text-sm text-white hover:bg-[#2f3032]">

// 변경:
<button className="flex h-11 items-center gap-1.5 rounded-lg border border-[#E9EAEB] bg-white px-4 text-sm text-[#181D27] hover:bg-[#F5F5F5]">
```

```tsx
// 현재 (303행 input):
className="h-11 w-full rounded-lg border border-[#3f3f46] bg-[#232323] px-4 text-sm text-white placeholder:text-[#9ca3af] focus:border-[#14b8a6] focus:outline-none"

// 변경:
className="h-11 w-full rounded-lg border border-[#E9EAEB] bg-white px-4 text-sm text-[#181D27] placeholder:text-[#A4A7AE] focus:border-[#41C7BD] focus:outline-none"
```

```tsx
// 현재 (309행 검색 버튼):
className="h-11 rounded-lg bg-[#14b8a6] px-6 text-sm font-medium text-white hover:bg-[#0d9488]"

// 변경:
className="h-11 rounded-lg bg-[#41C7BD] px-6 text-sm font-medium text-white hover:bg-[#41C7BD]/90"
```

태그 필터:
```tsx
// 현재 (333~337행):
index === 0
  ? "bg-[#14b8a6] text-white"
  : "bg-[#232323] text-[#9ca3af] hover:bg-[#3f3f46] hover:text-white"

// 변경:
index === 0
  ? "bg-[#41C7BD] text-white"
  : "bg-[#F5F5F5] text-[#535862] hover:bg-[#E9EAEB]"
```

```tsx
// 현재 (342행 "태그 더보기"):
className="flex flex-shrink-0 items-center gap-1 rounded-full border border-[#3f3f46] px-4 py-2 text-sm font-medium text-[#9ca3af] hover:bg-[#3f3f46] hover:text-white"

// 변경:
className="flex flex-shrink-0 items-center gap-1 rounded-full border border-[#E9EAEB] px-4 py-2 text-sm font-medium text-[#A4A7AE] hover:bg-[#F5F5F5]"
```

### 6. 사용하지 않는 type 정리

```tsx
// 삭제 (import 사용되지 않으면):
type AttendanceRecord = Database["public"]["Tables"]["attendance_records"]["Row"];
```

---

## 색상 치환 요약 (이 Phase에서)

| 현재 | 변경 |
|------|------|
| `bg-[#111111]` | `bg-white` |
| `bg-[#232323]` | `bg-white` 또는 `bg-[#F5F5F5]` |
| `border-[#3f3f46]` | `border-[#E9EAEB]` |
| `text-white` (일반 텍스트) | `text-[#181D27]` |
| `text-[#9ca3af]` | `text-[#A4A7AE]` 또는 `text-[#535862]` |
| `bg-[#14b8a6]` / `text-[#14b8a6]` | `bg-[#41C7BD]` / `text-[#41C7BD]` |
| `hover:bg-[#0d9488]` | `hover:bg-[#41C7BD]/90` |
| `hover:bg-[#3f3f46]` | `hover:bg-[#E9EAEB]` |
| `hover:text-white` | `hover:text-[#535862]` |

---

## 검증

```bash
npm run typecheck
```

- [ ] `/` 접근 → 흰 배경, 다크 요소 없음
- [ ] 공지/출석 배너 사라짐
- [ ] 히어로 캐러셀 표시 (아직 다크 오버레이 있을 수 있음 → Phase 2에서 수정)
- [ ] 검색 바 + 태그 필터 라이트 테마
- [ ] 3개 캐릭터 섹션 표시 (헤더 텍스트 아직 흰색 → Phase 2에서 수정)
- [ ] 다른 페이지 (`/login`, `/points`, `/characters`) 깨지지 않음
