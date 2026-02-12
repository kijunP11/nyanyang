# F1 Phase 4: 채팅 사이드바 + 프로모션 배너

## 전제조건
Phase 1, 2, 3 적용 완료 상태

## 목표
- 로그인 사용자에게 왼쪽 채팅 사이드바 표시 (md 이상 화면)
- 하단 프로모션 배너 추가
- loader에서 user 데이터 반환 (사이드바용)

## 수정 파일: `app/features/home/screens/home.tsx` (1개만)

---

### 1. import 추가

```tsx
// 추가:
import { ChatSidebar, type ChatSidebarUser } from "~/core/components/chat-sidebar";
```

> `Search`는 Phase 3에서 이미 추가됨.

### 2. LoaderData에 user 필드 추가

```tsx
// 추가:
user: ChatSidebarUser | null;
```

전체 인터페이스:
```tsx
interface LoaderData {
  title: string;
  subtitle: string;
  featuredCharacters: CharacterWithCreator[];
  popularCharacters: CharacterWithCreator[];
  newestCharacters: CharacterWithCreator[];
  isLoggedIn: boolean;
  user: ChatSidebarUser | null;  // ← 추가
}
```

### 3. loader에서 user 데이터 반환

**defaultData에 추가:**
```tsx
user: null,
```

**return data 객체에 추가 (user 변수를 이미 가져오고 있으므로):**
```tsx
user: user
  ? {
      name:
        user.user_metadata?.nickname ||
        user.user_metadata?.name ||
        "Anonymous",
      email: user.email,
      avatarUrl: user.user_metadata?.avatar_url || null,
    }
  : null,
```

> 기존 코드에서 `const { data: { user } } = await client.auth.getUser();`로 이미 user를 가져오므로 추가 쿼리 불필요.

### 4. 컴포넌트 destructuring에 user 추가

```tsx
const {
  featuredCharacters,
  popularCharacters,
  newestCharacters,
  isLoggedIn,
  user,       // ← 추가
} = loaderData;
```

### 5. 루트 JSX를 flex 레이아웃으로 변경 + 사이드바 추가

**현재 루트 구조 (Phase 1~3 적용 후):**
```tsx
<div className="-mx-5 -my-16 min-h-[calc(100vh-57px)] bg-white md:-my-32">
  <div className="mx-auto flex max-w-screen-xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
    {/* 히어로, 검색, 태그, 섹션들 */}
  </div>
</div>
```

**변경:**
```tsx
<div className="-mx-5 -my-16 flex min-h-[calc(100vh-57px)] bg-white md:-my-32">
  {/* 채팅 사이드바 (로그인 시, md 이상) */}
  {isLoggedIn && user && (
    <div className="sticky top-[57px] hidden h-[calc(100vh-57px)] md:block">
      <ChatSidebar user={user} chats={[]} />
    </div>
  )}

  {/* 메인 콘텐츠 */}
  <div className="min-w-0 flex-1">
    <div className="mx-auto flex max-w-screen-xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* 히어로, 검색, 태그, 섹션들 (기존과 동일) */}

      {/* 프로모션 배너 — 다크 배경 + 캐릭터 이미지 (Figma 기준) */}
      <section>
        <Link
          to="/notices"
          className="group block overflow-hidden rounded-2xl transition-transform hover:scale-[1.01]"
        >
          <div className="relative flex h-[140px] items-center bg-gradient-to-r from-[#1a1a2e] to-[#16213e]">
            {/* 좌측: 텍스트 */}
            <div className="relative z-10 flex-1 px-8">
              <p className="text-lg font-bold text-white">
                나냥 기획전
              </p>
              <p className="mt-1 text-sm text-white/70">
                특별한 캐릭터를 만나보세요
              </p>
              <p className="mt-0.5 text-xs text-white/50">
                매력적인 캐릭터와 이벤트가 기다립니다
              </p>
            </div>
            {/* 우측: 캐릭터 이미지 */}
            <div className="absolute right-0 top-0 h-full w-[200px] overflow-hidden">
              <img
                src="/nft.jpg"
                alt="프로모션"
                className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e] to-transparent" />
            </div>
          </div>
        </Link>
      </section>
    </div>
  </div>
</div>
```

### 변경 요약 (루트 div)

| 항목 | 변경 |
|------|------|
| 루트 div | `flex` 추가 |
| 사이드바 wrapper | `sticky top-[57px] hidden h-[calc(100vh-57px)] md:block` 추가 |
| 메인 콘텐츠 | `<div className="min-w-0 flex-1">` 으로 감싸기 |
| 프로모션 배너 | 마지막 `ScrollSection` 뒤에 추가 |

---

### 6. 사이드바 설명

`ChatSidebar` 컴포넌트는 이미 `app/core/components/chat-sidebar.tsx`에 구현되어 있습니다.

- `user`: 로그인한 사용자 정보 (이름, 이메일, 아바타)
- `chats`: 빈 배열 `[]` — 실제 채팅 데이터 로딩은 후속 작업
- 비로그인 시: 사이드바 자체가 렌더링되지 않음 (조건부)
- 모바일: `hidden md:block`으로 숨김

**사이드바 레이아웃:**
- 너비: 260px (컴포넌트 내부 정의)
- 높이: `h-[calc(100vh-57px)]` (네비 바 57px 제외)
- 위치: `sticky top-[57px]` (스크롤 시 고정)
- 메인 콘텐츠가 스크롤되어도 사이드바는 고정

---

## 최종 home.tsx 구조 (Phase 1~4 모두 적용 후)

```
<div className="flex ...">           ← 루트 (flex)
  <ChatSidebar />                    ← 사이드바 (sticky, 조건부)
  <div className="flex-1">           ← 메인 래퍼
    <div className="mx-auto ...">    ← 콘텐츠 컨테이너
      <HeroCarousel />               ← 히어로
      <section>검색 바</section>      ← AI 추천 검색
      <section>태그 필터</section>     ← 카테고리 필터
      <ScrollSection A />            ← 떠오르는 신예 창작자들
      <ScrollSection B badge="HOT"/> ← 실시간 인기
      <ScrollSection C />            ← 크리에이터 신작
      <section>프로모션 배너</section> ← 기획전 배너
    </div>
  </div>
</div>
```

---

## 검증

```bash
npm run typecheck
```

### 비로그인 상태
- [ ] 사이드바 없음 (전체 너비 콘텐츠)
- [ ] 프로모션 배너 표시 (다크 배경 + 우측 캐릭터 이미지)
- [ ] 배너 클릭 시 `/notices`로 이동

### 로그인 상태
- [ ] 왼쪽 채팅 사이드바 표시 (md+ 화면)
- [ ] 사이드바 sticky: 메인 콘텐츠 스크롤해도 사이드바 고정
- [ ] 사이드바에 사용자 이름/이메일 표시
- [ ] 사이드바 "오늘 0개" 빈 상태 (chats=[] 이므로)
- [ ] 모바일(<768px): 사이드바 숨김, 콘텐츠 전체 너비

### 다른 페이지
- [ ] 다른 페이지에서 사이드바 보이지 않음 (home.tsx 전용)
- [ ] `/chat/:roomId` 정상 동작
