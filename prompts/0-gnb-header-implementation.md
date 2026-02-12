# GNB(헤더) Figma 디자인 구현 프롬프트

## 목표
`app/core/components/navigation-bar.tsx` 파일을 Figma 디자인에 맞게 전면 수정하고, 새 라우트를 추가한다.

---

## 현재 코드 컨텍스트

### 수정 대상 파일
- `app/core/components/navigation-bar.tsx` (메인 수정)
- `app/routes.ts` (placeholder 라우트 추가)

### 기술 스택
- React Router v7 (SSR)
- Tailwind CSS v4 (dark mode: `@custom-variant dark (&:is(.dark *))`)
- `remix-themes` (Theme.DARK / Theme.LIGHT)
- Pretendard Variable 폰트 (이미 기본 font-sans로 설정됨)
- lucide-react 아이콘
- shadcn/ui 컴포넌트 (`Sheet`, `Avatar`, `DropdownMenu` 등)

### 현재 구조
```
NavigationBar 컴포넌트:
├── 배경: #232323 (항상 다크 고정) → ❌ 변경 필요
├── 높이: 60px → ❌ 변경 필요
├── 메뉴: 스토리, 내 작품, 포인트, 이용 가이드 → ❌ 변경 필요
├── 우측(비로그인): 로그인 텍스트 + 구분선 + 회원가입 버튼 → ❌ 변경 필요
├── 우측(로그인): 검색창 + 테마토글 + 아바타 → ❌ 변경 필요
└── 모바일: Sheet 드로어 메뉴 → 업데이트 필요
```

---

## Figma 디자인 스펙

### 전체 레이아웃
```
[NYANYANG 로고]  ---- gap: 82px ----  [추천] [캐릭터] [내 컨텐츠] [이미지 생성] [뱃지/리워드]  ···  [우측 영역]
```
- **높이**: 57px
- **너비**: full width (max-w-screen-2xl 유지)
- **좌우 패딩**: 20px (`px-5`)
- **배경 (라이트)**: `white` → `bg-white`
- **배경 (다크)**: `#181D27` → `dark:bg-[#181D27]`
- **하단 보더**: `border-b border-black/20 dark:border-white/20`

### 로고
- 기존 `logo3.png` 사용
- 높이: 30px
- 로고 ↔ 메뉴 간격: 82px

### 메뉴 항목 (5개)
| 메뉴 | 라우트 | 비고 |
|------|--------|------|
| 추천 | `/` | 홈 페이지 |
| 캐릭터 | `/characters` | 기존 라우트 |
| 내 컨텐츠 | `/my-content` | 새 placeholder |
| 이미지 생성 | `/image-generation` | 새 placeholder |
| 뱃지/리워드 | `/points` | 기존 라우트 |

#### 메뉴 스타일
- **폰트**: `text-sm font-bold` (14px, Bold)
- **비활성 색상**: `text-[#A4A7AE]` (라이트/다크 동일)
- **활성 색상 (라이트)**: `text-[#181D27]` (Gray/900)
- **활성 색상 (다크)**: `text-white`
- **활성 하단 보더**: `border-b-4 border-[#00C4AF]` (민트색, 4px 두께, 네비바 하단에 붙게)
- **메뉴 간 간격**: `gap-1` (4px)
- **각 메뉴 아이템 패딩**: `px-[10px]`
- **메뉴 아이템은 h-full로 네비바 전체 높이 차지** (활성 보더가 네비바 하단에 붙도록)

### 우측 영역 — 비로그인 상태
```
[로그인 텍스트] | [🌙 테마토글] [🔔 알림]
```
1. **"로그인"** 텍스트 링크 → `/login`
   - 폰트: `text-base font-medium` (16px, Medium)
   - 색상 (라이트): `text-black/70`
   - 색상 (다크): `text-[#D5D7DA]`
2. **구분선**: 높이 20px, 1px
   - 색상 (라이트): `bg-black/20`
   - 색상 (다크): `bg-white/20`
3. **테마 토글**: 40px 영역, 아이콘 24px
   - 라이트: `Moon` 아이콘
   - 다크: `Sun` 아이콘
   - 배경 없음 (현재 원형 배경 제거)
4. **알림 벨**: 40px 영역, `Bell` 아이콘 24px

### 우측 영역 — 로그인 상태
```
[🐾 발바닥] [☀️ 테마토글] [🔔 알림] [👤 아바타]
```
1. **발바닥 아이콘**: 40px 영역, `PawPrint` 아이콘 24px → 대시보드 링크 (`/dashboard`)
2. **테마 토글**: 위와 동일
3. **알림 벨**: 위와 동일
4. **아바타**: 24px 원형
   - 보더: `border-[1.667px] border-white`
   - 그림자: `shadow-[0px_5px_6.667px_-4px_rgba(10,13,18,0.08),0px_1.667px_2.5px_-2px_rgba(10,13,18,0.03)]`
   - `rounded-full`
   - 클릭 시 드롭다운 메뉴 (기존 UserMenu 유지하되 스타일 업데이트)

### 아이콘 임포트
```tsx
import { Bell, Menu, Moon, Sun, PawPrint } from "lucide-react";
```
- 아이콘 크기: `size-6` (24px)
- 아이콘 색상: `text-black/70 dark:text-[#D5D7DA]`

---

## 구현 지시사항

### 1. `navigation-bar.tsx` 전면 수정

#### SearchInput 제거
- Figma 디자인에 검색창이 없으므로 `SearchInput` 컴포넌트 및 관련 코드 삭제

#### nav 태그 스타일 변경
```tsx
// Before
<nav className="h-[60px] w-full border-b border-white/10 bg-[#232323]">

// After
<nav className="h-[57px] w-full border-b border-black/20 bg-white dark:border-white/20 dark:bg-[#181D27]">
```

#### 메뉴 항목 변경
NavLink 헬퍼 함수 업데이트:
```tsx
const getNavLinkClass = (isActive: boolean) =>
  isActive
    ? "relative h-full flex items-center px-[10px] text-sm font-bold text-[#181D27] dark:text-white border-b-4 border-[#00C4AF] transition-colors"
    : "relative h-full flex items-center px-[10px] text-sm font-bold text-[#A4A7AE] hover:text-[#181D27] dark:hover:text-white transition-colors";
```

5개 메뉴 NavLink:
```tsx
<NavLink to="/" end viewTransition className={({isActive}) => getNavLinkClass(isActive)}>추천</NavLink>
<NavLink to="/characters" viewTransition className={({isActive}) => getNavLinkClass(isActive)}>캐릭터</NavLink>
<NavLink to="/my-content" viewTransition className={({isActive}) => getNavLinkClass(isActive)}>내 컨텐츠</NavLink>
<NavLink to="/image-generation" viewTransition className={({isActive}) => getNavLinkClass(isActive)}>이미지 생성</NavLink>
<NavLink to="/points" viewTransition className={({isActive}) => getNavLinkClass(isActive)}>뱃지/리워드</NavLink>
```
> **주의**: 홈(`/`) 라우트에는 `end` prop 필수 (다른 라우트에서도 활성되는 것 방지)

#### ThemeToggle 스타일 업데이트
```tsx
function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const toggleTheme = () => {
    setTheme(theme === Theme.DARK ? Theme.LIGHT : Theme.DARK);
  };
  return (
    <button
      onClick={toggleTheme}
      className="flex size-10 items-center justify-center transition-colors"
      aria-label="Toggle theme"
    >
      {theme === Theme.DARK ? (
        <Sun className="size-6 text-[#D5D7DA]" />
      ) : (
        <Moon className="size-6 text-black/70" />
      )}
    </button>
  );
}
```

#### AuthButtons (비로그인) 재구성
```tsx
function AuthButtons() {
  return (
    <div className="flex items-center gap-3">
      <Link to="/login" viewTransition className="text-base font-medium text-black/70 dark:text-[#D5D7DA] hover:text-black dark:hover:text-white transition-colors whitespace-nowrap">
        로그인
      </Link>
      <div className="h-5 w-px bg-black/20 dark:bg-white/20" />
      <ThemeToggle />
      <button className="flex size-10 items-center justify-center">
        <Bell className="size-6 text-black/70 dark:text-[#D5D7DA]" />
      </button>
    </div>
  );
}
```

#### 로그인 상태 우측 영역
```tsx
{name && (
  <div className="flex items-center">
    <Link to="/dashboard" className="flex size-10 items-center justify-center">
      <PawPrint className="size-6 text-black/70 dark:text-[#D5D7DA]" />
    </Link>
    <ThemeToggle />
    <button className="flex size-10 items-center justify-center">
      <Bell className="size-6 text-black/70 dark:text-[#D5D7DA]" />
    </button>
    <UserMenu name={name} email={email} avatarUrl={avatarUrl} />
  </div>
)}
```

#### UserMenu 아바타 스타일 변경
```tsx
<Avatar className="size-6 cursor-pointer rounded-full border-[1.667px] border-white shadow-[0px_5px_6.667px_-4px_rgba(10,13,18,0.08),0px_1.667px_2.5px_-2px_rgba(10,13,18,0.03)]">
```

#### DropdownMenu 스타일 (라이트/다크 대응)
기존의 하드코딩된 다크 스타일 → Tailwind 테마 변수 사용:
```tsx
<DropdownMenuContent className="w-56">
  {/* shadcn/ui 기본 테마 스타일 활용 */}
</DropdownMenuContent>
```

#### 모바일 메뉴
- `SheetContent` 배경: `bg-white dark:bg-[#181D27]`
- 메뉴 항목 5개로 동일하게 변경
- 모바일 하단에 ThemeToggle + Bell 아이콘 배치

### 2. `routes.ts`에 placeholder 라우트 추가

navigation layout 안에 추가:
```tsx
// Placeholder routes for upcoming features
route("/my-content", "features/placeholder/screens/coming-soon.tsx"),
route("/image-generation", "features/placeholder/screens/coming-soon.tsx"),
```

### 3. Placeholder 스크린 생성
`app/features/placeholder/screens/coming-soon.tsx`:
```tsx
export default function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <h1 className="text-2xl font-bold">준비 중입니다</h1>
      <p className="mt-2 text-muted-foreground">곧 만나보실 수 있어요!</p>
    </div>
  );
}
```

---

## 검증 체크리스트
- [ ] 라이트 모드에서 흰색 배경, 다크 모드에서 `#181D27` 배경 확인
- [ ] 5개 메뉴 텍스트 및 라우트 연결 확인
- [ ] 활성 메뉴: 민트(`#00C4AF`) 하단 보더 표시 확인
- [ ] 비활성 메뉴: `#A4A7AE` 회색 텍스트 확인
- [ ] 비로그인: 로그인 텍스트 + 구분선 + 테마토글 + 벨 아이콘 확인
- [ ] 로그인: 발바닥 + 테마토글 + 벨 + 아바타 확인
- [ ] 테마 토글 작동 확인
- [ ] 모바일 반응형 메뉴 확인
- [ ] `npm run typecheck` 통과
