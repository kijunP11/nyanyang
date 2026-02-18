# F4-3-1. 이미지 생성 — 로그인 전 제한 화면 구현 명세

## 목표
`/image-generation` 라우트의 placeholder("준비 중입니다")를 Figma 디자인에 맞는 이미지 생성 페이지로 교체한다.
비로그인 사용자에게는 blur 처리된 배경 위에 로그인 모달을 보여주고, 로그인 사용자에게는 빈 이미지 생성 페이지를 보여준다.

---

## 1. 디렉토리 구조 (새로 생성)

```
app/features/image-generation/
├── screens/
│   └── image-generation.tsx          # 메인 페이지
└── components/
    ├── image-generation-sidebar.tsx   # 좌측 사이드바
    └── login-required-overlay.tsx     # blur 배경 + 로그인 모달
```

---

## 2. 라우트 변경

**파일: `app/routes.ts` (line 154)**

```diff
- route("/image-generation", "features/placeholder/screens/image-generation.tsx"),
+ route("/image-generation", "features/image-generation/screens/image-generation.tsx"),
```

---

## 3. 메인 화면: `image-generation.tsx`

### loader

```typescript
import type { Route } from "./+types/image-generation";
import { data } from "react-router";
import makeServerClient from "~/core/lib/supa-client.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();

  return data(
    {
      isLoggedIn: !!user,
      user: user
        ? {
            name: user.user_metadata?.nickname || user.user_metadata?.name || "Anonymous",
            email: user.email,
            avatarUrl: user.user_metadata?.avatar_url || null,
          }
        : null,
    },
    { headers }
  );
}
```

### 컴포넌트 (레이아웃은 home.tsx 패턴 따름)

```tsx
export default function ImageGeneration({ loaderData }: Route.ComponentProps) {
  const { isLoggedIn, user } = loaderData;

  return (
    <div className="-mx-5 -my-16 flex min-h-[calc(100vh-57px)] bg-white dark:bg-[#0C111D] md:-my-32">
      {/* 좌측 사이드바 (md 이상만 표시) */}
      <div className="sticky top-[57px] hidden h-[calc(100vh-57px)] md:block">
        <ImageGenerationSidebar user={isLoggedIn ? user : null} />
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="relative min-w-0 flex-1">
        {isLoggedIn ? (
          {/* 로그인 상태: 빈 상태 화면 (추후 3-2, 3-3에서 구현) */}
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-semibold text-[#181D27] dark:text-white">
                이미지 생성
              </p>
              <p className="mt-2 text-sm text-[#535862] dark:text-[#94969C]">
                이미지 생성 기능이 곧 추가됩니다
              </p>
            </div>
          </div>
        ) : (
          {/* 비로그인 상태: blur 배경 + 로그인 모달 */}
          <LoginRequiredOverlay />
        )}
      </div>
    </div>
  );
}
```

---

## 4. 사이드바: `image-generation-sidebar.tsx`

ChatSidebar(`app/core/components/chat-sidebar.tsx`)의 패턴을 그대로 따르되, 헤더만 "생성된 이미지"로 변경한다.

### 구조

```tsx
interface ImageGenerationSidebarProps {
  user?: { name: string; email?: string; avatarUrl?: string | null } | null;
}

export function ImageGenerationSidebar({ user }: ImageGenerationSidebarProps) {
  const isLoggedIn = !!user;

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-[#E9EAEB] bg-white dark:border-[#333741] dark:bg-[#181D27]">
      {/* 헤더 */}
      <div className="flex h-[57px] items-center px-4">
        <h2 className="text-base font-bold text-[#181D27] dark:text-white">
          생성된 이미지
        </h2>
      </div>

      {/* 콘텐츠 */}
      {!isLoggedIn ? (
        <LoggedOutCTA />   {/* 아래 참고 */}
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <p className="text-sm text-[#535862] dark:text-[#94969C]">
            아직 생성된 이미지가 없어요
          </p>
        </div>
      )}
    </aside>
  );
}
```

### LoggedOutCTA (ChatSidebar에서 그대로 복사)

ChatSidebar의 `LoggedOutCTA` 함수(line 201~268)를 그대로 사용한다:
- 안내 문구: "로그인하고 개성 넘치는 캐릭터들과 더 깊은 대화를 즐겨보세요!"
- 소셜 로그인 버튼: 카카오(#FEE500), 구글(흰색+border)
- 이메일 로그인 버튼: "이메일로 시작하기"

**그대로 복사할 코드 (chat-sidebar.tsx:201-268)**:
```tsx
function LoggedOutCTA() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1" />
      <div className="px-4 pb-6">
        <div className="rounded-xl border border-[#E9EAEB] p-4 dark:border-[#333741]">
          <p className="mb-4 text-sm leading-relaxed text-[#535862] dark:text-[#94969C]">
            로그인하고 개성 넘치는 캐릭터들과 더 깊은 대화를 즐겨보세요!
          </p>
          {/* Social Login Buttons */}
          <div className="mb-3 flex items-center justify-center gap-3">
            {/* Kakao */}
            <Link
              to="/auth/social/start/kakao"
              viewTransition
              className="flex size-11 items-center justify-center rounded-full bg-[#FEE500] transition-opacity hover:opacity-90"
              aria-label="카카오톡으로 로그인"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="#000000">
                <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.72 1.788 5.108 4.488 6.467l-1.142 4.225a.35.35 0 0 0 .538.384l4.907-3.238c.39.037.787.062 1.209.062 5.523 0 10-3.463 10-7.691S17.523 3 12 3z" />
              </svg>
            </Link>
            {/* Google */}
            <Link
              to="/auth/social/start/google"
              viewTransition
              className="flex size-11 items-center justify-center rounded-full border border-[#D5D7DA] bg-white transition-opacity hover:opacity-90 dark:border-[#414651] dark:bg-[#1F242F]"
              aria-label="구글로 로그인"
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </Link>
          </div>
          {/* Email Login */}
          <Link
            to="/login"
            viewTransition
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#D5D7DA] px-4 py-2.5 text-sm font-medium text-[#414651] transition-colors hover:bg-[#F5F5F5] dark:border-[#414651] dark:text-[#D5D7DA] dark:hover:bg-[#1F242F]"
          >
            <Mail className="size-4" />
            이메일로 시작하기
          </Link>
        </div>
      </div>
    </div>
  );
}
```

**import 필요**: `Link` from `react-router`, `Mail` from `lucide-react`

---

## 5. 로그인 제한 오버레이: `login-required-overlay.tsx`

### 구조

전체 메인 영역을 커버하는 overlay. Dialog 컴포넌트를 사용하지 않고 직접 구현 (닫기 없이 항상 표시).

```tsx
import { Link } from "react-router";

export function LoginRequiredOverlay() {
  return (
    <div className="relative flex h-full min-h-[calc(100vh-57px)] items-center justify-center">
      {/* 배경: 이미지 생성 화면 미리보기 (blur 처리) */}
      <div className="absolute inset-0 overflow-hidden">
        <BlurredBackground />
      </div>

      {/* 반투명 오버레이 */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm dark:bg-[#0C111D]/60" />

      {/* 로그인 모달 */}
      <div className="relative z-10 mx-4 w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-xl dark:bg-[#181D27]">
        {/* 캐릭터 일러스트 (냐냥 거부 이모티콘) */}
        <div className="mb-6 flex justify-start">
          <img
            src="/냐냥-이모티콘-최종완성본/냐냥-거부.png"
            alt="로그인 필요"
            className="h-16 w-auto"
          />
        </div>

        {/* 제목 */}
        <h2 className="mb-2 text-xl font-bold text-[#181D27] dark:text-white">
          해당 페이지는 로그인 후 사용 가능합니다!
        </h2>

        {/* 설명 */}
        <p className="mb-6 text-sm leading-relaxed text-[#535862] dark:text-[#94969C]">
          로그인 후 캐릭터 생성이 가능합니다.{"\n"}
          지금 로그인하고 나만의 캐릭터를 시작해보세요.
        </p>

        {/* CTA 버튼 */}
        <Link
          to="/login"
          viewTransition
          className="flex w-full items-center justify-center rounded-lg bg-[#41C7BD] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#38b5ab]"
        >
          로그인하기
        </Link>
      </div>
    </div>
  );
}
```

### BlurredBackground 컴포넌트

이미지 생성 화면의 미리보기를 블러 처리해서 보여준다. 실제 이미지 생성 UI가 아직 없으므로, 가짜 카드 레이아웃을 보여준다:

```tsx
function BlurredBackground() {
  return (
    <div className="h-full w-full p-8 opacity-50 blur-[6px]">
      {/* 상단 탭/필터 영역 모킹 */}
      <div className="mb-6 flex gap-4">
        <div className="h-10 w-24 rounded-lg bg-[#E9EAEB]" />
        <div className="h-10 w-32 rounded-lg bg-[#E9EAEB]" />
        <div className="h-10 flex-1 rounded-lg bg-[#E9EAEB]" />
      </div>

      {/* 검색바 모킹 */}
      <div className="mb-8 h-12 w-full rounded-xl bg-[#F5F5F5]" />

      {/* 이미지 카드 그리드 모킹 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-xl bg-[#E9EAEB]" />
        ))}
      </div>
    </div>
  );
}
```

---

## 6. 색상 참고

| 용도 | Light | Dark |
|------|-------|------|
| 사이드바 배경 | `bg-white` | `dark:bg-[#181D27]` |
| 사이드바 border | `border-[#E9EAEB]` | `dark:border-[#333741]` |
| CTA 버튼 (민트) | `bg-[#41C7BD]` | 동일 |
| 본문 텍스트 | `text-[#535862]` | `dark:text-[#94969C]` |
| 제목 텍스트 | `text-[#181D27]` | `dark:text-white` |
| 카카오 버튼 | `bg-[#FEE500]` | 동일 |

---

## 7. import 규칙 (필수 준수)

```typescript
// DB client (이 화면에서는 사용 안함)
import drizzle from "~/core/db/drizzle-client.server";

// Supabase client
import makeServerClient from "~/core/lib/supa-client.server";

// 경로 alias는 항상 ~/로 시작
import { Something } from "~/core/components/ui/something";
```

---

## 8. 검증 방법

1. `npm run typecheck` — 타입 에러 없어야 함
2. `npm run dev` 실행 후:
   - 비로그인 상태로 `/image-generation` 접속 → blur 배경 + 로그인 모달 표시
   - 좌측 사이드바에 "생성된 이미지" 헤더 + 로그인 유도 CTA 표시
   - "로그인하기" 클릭 → `/login`으로 이동
   - 로그인 후 `/image-generation` 접속 → 빈 상태 화면 표시
3. 반응형: md 미만에서 사이드바 숨김 확인

---

## 참고 파일

- 레이아웃 패턴: `app/features/home/screens/home.tsx` (line 300~)
- 사이드바 패턴: `app/core/components/chat-sidebar.tsx`
- 라우트 설정: `app/routes.ts` (line 154)
- 네비게이션 레이아웃: `app/core/layouts/navigation.layout.tsx`
- 기존 placeholder: `app/features/placeholder/screens/image-generation.tsx`
