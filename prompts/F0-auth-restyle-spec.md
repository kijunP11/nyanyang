# F0. Auth UI Restyle — 구현 명세서

> 이 문서는 Cursor에게 넘기는 구현 명세서입니다.
> 각 파일별로 **현재 코드**, **변경 목표**, **구체적 변경 내용**을 기술합니다.

---

## 공통 디자인 토큰

모든 auth 화면에 공통 적용되는 스타일 토큰입니다. 기존 다크 테마(`#1a1a1a`, `#232323`, `#3f3f46`, `#14b8a6`)를 아래로 교체합니다.

```
배경:           bg-white
폼 컨테이너:    max-w-[350px] (A-1/A-2) 또는 max-w-[360px] (A-3/A-4), mx-auto
제목:           text-2xl font-bold text-black, text-center
부제목:         text-sm text-gray-500, text-center
라벨:           text-sm font-medium text-black
입력 필드:      h-12 bg-white border border-gray-300 rounded-md text-black placeholder:text-gray-400
포커스:         focus:border-[#41C7BD] focus:ring-0
헬퍼 텍스트:    text-xs text-gray-400
주요 버튼:      h-12 w-full bg-[#41C7BD] text-white rounded-md hover:bg-[#41C7BD]/90
비활성 버튼:    bg-gray-200 text-gray-400 cursor-not-allowed
보조 버튼:      h-12 w-full bg-white border border-gray-300 text-black rounded-md
링크 텍스트:    text-sm text-[#41C7BD] hover:underline
하단 텍스트:    text-sm text-gray-500 (링크 부분만 text-[#41C7BD])
밑줄 링크:      text-sm text-gray-400 underline
에러 텍스트:    text-sm text-red-500
체크박스 활성:  border-[#41C7BD] data-[state=checked]:bg-[#41C7BD]
구분선:         border-gray-200
```

---

## 파일 1: `app/features/auth/screens/login.tsx`

### 라우트: `/login` (기존 유지)
### 역할: A-1 소셜 로그인 (이메일 폼 제거)

### 삭제할 것
- `loginSchema` (Zod 스키마) — 전체 삭제
- `action` 함수 — 전체 삭제
- `<Form>` 블록 전체 (이메일/비밀번호 입력 + 로그인 버튼 + 에러 메시지) — 삭제
- 사용하지 않는 import: `z`, `AlertCircle`, `Loader2Icon`, `useRef`, `Form`, `data`, `redirect`, `useFetcher`, `FormButton`, `Alert`, `AlertDescription`, `AlertTitle`, `Input`, `Label`, `makeServerClient`, `FormErrors`
- `formRef`, `fetcher`, `onResendClick` 관련 코드 전부
- "아이디 또는 비밀번호를 잊어버리셨나요?" 링크

### 유지할 것
- `SignInButtons` import 및 사용
- `meta` 함수 (제목만 변경)

### 변경 사항

**import 정리:**
```tsx
import type { Route } from "./+types/login";
import { Link } from "react-router";
import { SignInButtons } from "../components/auth-login-buttons";
```

**meta 변경:**
```tsx
title: `로그인 또는 회원가입 | ${import.meta.env.VITE_APP_NAME}`,
```

**컴포넌트 전체 교체:**
```tsx
export default function Login() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-[350px]">
        {/* 타이틀 */}
        <h1 className="mb-8 text-center text-2xl font-bold text-black">
          로그인 또는 회원가입
        </h1>

        {/* 소셜 로그인 버튼 */}
        <SignInButtons />

        {/* 이메일 로그인 링크 */}
        <div className="mt-6 text-center">
          <Link
            to="/login/email"
            className="text-sm text-gray-400 underline"
            viewTransition
          >
            이메일 로그인
          </Link>
        </div>

        {/* 회원가입 링크 */}
        <p className="mt-6 text-center text-sm text-gray-500">
          소셜 계정이 없으신가요?{" "}
          <Link
            to="/join"
            viewTransition
            className="text-[#41C7BD] hover:underline"
          >
            이메일로 회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

## 파일 2: `app/features/auth/screens/login-email.tsx` (NEW)

### 라우트: `/login/email`
### 역할: A-2 이메일 로그인

이 파일을 **새로 생성**합니다. login.tsx에서 삭제한 action 로직을 여기로 이동합니다.

### 전체 코드

```tsx
import type { Route } from "./+types/login-email";

import { AlertCircle, Eye, EyeOff, Loader2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { Form, Link, data, redirect, useFetcher } from "react-router";
import { z } from "zod";

import FormButton from "~/core/components/form-button";
import FormErrors from "~/core/components/form-error";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/core/components/ui/alert";
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import makeServerClient from "~/core/lib/supa-client.server";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `이메일 로그인 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

const loginSchema = z.object({
  email: z.string().email({ message: "올바른 이메일 주소를 입력해주세요" }),
  password: z
    .string()
    .min(8, { message: "비밀번호는 8자 이상이어야 합니다" }),
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const {
    data: validData,
    success,
    error,
  } = loginSchema.safeParse(Object.fromEntries(formData));

  if (!success) {
    return data({ fieldErrors: error.flatten().fieldErrors }, { status: 400 });
  }

  const [client, headers] = makeServerClient(request);

  const { data: signInData, error: signInError } =
    await client.auth.signInWithPassword({
      ...validData,
    });

  if (signInError) {
    if (
      signInError.message.includes("Email not confirmed") ||
      signInError.message.includes("email_not_confirmed")
    ) {
      return data(
        {
          error: "Email not confirmed",
          email: validData.email,
        },
        { status: 400 },
      );
    }
    return data({ error: signInError.message }, { status: 400 });
  }

  if (!signInData?.session) {
    return data(
      {
        error: "세션을 생성하지 못했습니다. 다시 시도해주세요.",
      },
      { status: 500 },
    );
  }

  return redirect("/", { headers });
}

export default function LoginEmail({ actionData }: Route.ComponentProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const fetcher = useFetcher();
  const [showPassword, setShowPassword] = useState(false);

  const onResendClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    formData.delete("password");
    fetcher.submit(formData, {
      method: "post",
      action: "/auth/api/resend",
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-[350px]">
        {/* 타이틀 */}
        <h1 className="mb-8 text-center text-2xl font-bold text-black">
          이메일 로그인
        </h1>

        {/* 로그인 폼 */}
        <Form
          className="flex w-full flex-col gap-4"
          method="post"
          ref={formRef}
        >
          {/* 이메일 입력 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm font-medium text-black">
              이메일
            </Label>
            <Input
              id="email"
              name="email"
              required
              type="email"
              placeholder="이메일 입력"
              className="h-12 border-gray-300 bg-white text-black placeholder:text-gray-400 focus:border-[#41C7BD]"
            />
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors.email ? (
              <FormErrors errors={actionData.fieldErrors.email} />
            ) : null}
          </div>

          {/* 비밀번호 입력 */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-black"
            >
              비밀번호
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                required
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호 입력"
                className="h-12 border-gray-300 bg-white pr-10 text-black placeholder:text-gray-400 focus:border-[#41C7BD]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors.password ? (
              <FormErrors errors={actionData.fieldErrors.password} />
            ) : null}
          </div>

          {/* 로그인 버튼 */}
          <FormButton
            label="로그인"
            className="mt-2 h-12 w-full bg-[#41C7BD] text-white hover:bg-[#41C7BD]/90"
          />

          {/* 에러 메시지 */}
          {actionData && "error" in actionData ? (
            actionData.error === "Email not confirmed" ? (
              <Alert
                variant="destructive"
                className="border-red-500/50 bg-red-50"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>이메일 인증 필요</AlertTitle>
                <AlertDescription className="flex flex-col items-start gap-2">
                  로그인하기 전에 이메일을 인증해주세요.
                  <Button
                    variant="outline"
                    className="border-gray-300 bg-white text-black hover:bg-gray-50"
                    onClick={onResendClick}
                  >
                    인증 메일 재발송
                    {fetcher.state === "submitting" ? (
                      <Loader2Icon className="ml-2 size-4 animate-spin" />
                    ) : null}
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <FormErrors errors={[actionData.error]} />
            )
          ) : null}
        </Form>

        {/* 비밀번호 찾기 링크 */}
        <div className="mt-4 text-center">
          <Link
            to="/auth/account-recovery"
            className="text-sm text-gray-400 underline"
            viewTransition
          >
            이메일 / 비밀번호 찾기
          </Link>
        </div>

        {/* 회원가입 링크 */}
        <p className="mt-6 text-center text-sm text-gray-500">
          소셜 계정이 없으신가요?{" "}
          <Link
            to="/join"
            viewTransition
            className="text-[#41C7BD] hover:underline"
          >
            이메일로 회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

## 파일 3: `app/features/auth/components/auth-login-buttons.tsx`

### 역할: 소셜 로그인 버튼 스타일 변경

### 변경 사항

**AuthLoginButton 내부 텍스트 변경:**
```
현재: {label} 계정으로 로그인
변경: {label} 계정으로 계속하기
```
- 55행: `<span>{label} 계정으로 로그인</span>` → `<span>{label} 계정으로 계속하기</span>`

**SocialLoginButtons 버튼 순서 변경 (Figma 순서: 카카오 → 애플 → 네이버 → 구글):**

```tsx
function SocialLoginButtons() {
  return (
    <div className="flex flex-col gap-3">
      <AuthLoginButton
        logo={<KakaoLogo className="size-4 scale-125" />}
        label="카카오"
        href="/auth/social/start/kakao"
        className="border-0 bg-[#FEE500] text-[#191919] hover:bg-[#fdd800]"
      />
      <AuthLoginButton
        logo={<AppleLogo className="size-4 scale-150 text-white" />}
        label="애플"
        href="/auth/social/start/apple"
        className="border-0 bg-black text-white hover:bg-black/90"
      />
      <AuthLoginButton
        logo={<NaverLogo className="size-4" />}
        label="네이버"
        href="/auth/naver"
        className="border-0 bg-[#03C75A] text-white hover:bg-[#02b351]"
      />
      <AuthLoginButton
        logo={<GoogleLogo className="size-4" />}
        label="구글"
        href="/auth/social/start/google"
        className="border border-gray-300 bg-white text-black hover:bg-gray-50"
      />
    </div>
  );
}
```

**변경 요약:**
| 버튼 | 변경 전 | 변경 후 |
|------|--------|--------|
| 카카오 | (기존 유지) | (기존 유지) |
| 애플 | `bg-[#3f3f46]` | `bg-black hover:bg-black/90` |
| 네이버 | (기존 유지) | (기존 유지) |
| 구글 | `bg-[#3f3f46] text-white` | `bg-white border border-gray-300 text-black hover:bg-gray-50` |

---

## 파일 4: `app/features/auth/screens/join.tsx`

### 라우트: `/join` (기존 유지)
### 역할: A-3 이메일 회원가입

### 삭제할 것
- `SignUpButtons` import
- `<SignUpButtons />` 사용 부분 (소셜 로그인 섹션 전체)

### 변경 사항

**Zod 스키마에 `nickname` 추가:**
```tsx
const joinSchema = z
  .object({
    name: z.string().min(1, { message: "이름을 입력해주세요" }),
    email: z.string().email({ message: "올바른 이메일 주소를 입력해주세요" }),
    password: z
      .string()
      .min(8, { message: "비밀번호는 8자 이상이어야 합니다" }),
    confirmPassword: z
      .string()
      .min(8, { message: "비밀번호는 8자 이상이어야 합니다" }),
    nickname: z
      .string()
      .min(2, { message: "닉네임은 최소 2자 이상이어야 합니다" })
      .max(20, { message: "닉네임은 최대 20자까지 가능합니다" })
      .regex(/^[가-힣a-zA-Z0-9]+$/, {
        message: "닉네임은 한글, 영문, 숫자만 사용 가능합니다",
      }),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });
```

**action에서 nickname도 쿠키에 저장:**
```tsx
const cookieHeader = await createJoinSession({
  name: validData.name,
  email: validData.email,
  password: validData.password,
  referralCode: validData.referralCode,
  nickname: validData.nickname,  // 추가
});
```

**전체 UI 교체 (다크 → 라이트, 필드 순서: 이름→이메일→비밀번호→비밀번호확인→닉네임→추천인코드):**

```tsx
export default function Join({ actionData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-[360px]">
        {/* 타이틀 */}
        <h1 className="mb-8 text-center text-2xl font-bold text-black">
          회원가입
        </h1>

        {/* 회원가입 폼 */}
        <Form className="flex w-full flex-col gap-4" method="post">
          {/* 이름 입력 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-sm font-medium text-black">
              이름
            </Label>
            <Input
              id="name"
              name="name"
              required
              type="text"
              placeholder="이름 입력"
              className="h-12 border-gray-300 bg-white text-black placeholder:text-gray-400 focus:border-[#41C7BD]"
            />
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors?.name ? (
              <FormErrors errors={actionData.fieldErrors.name} />
            ) : null}
          </div>

          {/* 이메일 입력 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm font-medium text-black">
              이메일
            </Label>
            <Input
              id="email"
              name="email"
              required
              type="email"
              placeholder="이메일 입력"
              className="h-12 border-gray-300 bg-white text-black placeholder:text-gray-400 focus:border-[#41C7BD]"
            />
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors?.email ? (
              <FormErrors errors={actionData.fieldErrors.email} />
            ) : null}
          </div>

          {/* 비밀번호 입력 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-sm font-medium text-black">
              비밀번호
            </Label>
            <Input
              id="password"
              name="password"
              required
              type="password"
              placeholder="비밀번호 입력"
              className="h-12 border-gray-300 bg-white text-black placeholder:text-gray-400 focus:border-[#41C7BD]"
            />
            <p className="text-xs text-gray-400">
              영문, 숫자를 포함하여 8자 이상 입력해주세요.
            </p>
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors?.password ? (
              <FormErrors errors={actionData.fieldErrors.password} />
            ) : null}
          </div>

          {/* 비밀번호 확인 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-black">
              비밀번호 확인
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              required
              type="password"
              placeholder="비밀번호 입력"
              className="h-12 border-gray-300 bg-white text-black placeholder:text-gray-400 focus:border-[#41C7BD]"
            />
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors?.confirmPassword ? (
              <FormErrors errors={actionData.fieldErrors.confirmPassword} />
            ) : null}
          </div>

          {/* 닉네임 입력 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="nickname" className="text-sm font-medium text-black">
              닉네임
            </Label>
            <Input
              id="nickname"
              name="nickname"
              required
              type="text"
              placeholder="닉네임 입력"
              className="h-12 border-gray-300 bg-white text-black placeholder:text-gray-400 focus:border-[#41C7BD]"
            />
            <p className="text-xs text-gray-400">
              닉네임은 2~20자의 한글/영문/숫자만 가능합니다.
            </p>
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors?.nickname ? (
              <FormErrors errors={actionData.fieldErrors.nickname} />
            ) : null}
          </div>

          {/* 추천인 코드 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="referralCode" className="text-sm font-medium text-black">
              추천인 코드
            </Label>
            <Input
              id="referralCode"
              name="referralCode"
              type="text"
              placeholder="추천인 코드 입력"
              className="h-12 border-gray-300 bg-white text-black placeholder:text-gray-400 focus:border-[#41C7BD]"
            />
          </div>

          {/* 가입 완료 버튼 */}
          <FormButton
            label="가입 완료"
            className="mt-4 h-12 w-full bg-[#41C7BD] text-white hover:bg-[#41C7BD]/90"
          />

          {/* 에러 메시지 */}
          {actionData && "error" in actionData && actionData.error ? (
            <FormErrors errors={[actionData.error]} />
          ) : null}
        </Form>

        {/* 로그인 링크 */}
        <p className="mt-6 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link
            to="/login"
            viewTransition
            className="text-[#41C7BD] hover:underline"
          >
            로그인하기
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

## 파일 5: `app/features/auth/lib/join-session.server.ts`

### 역할: 세션 데이터에 `nickname` 추가

### 변경 사항

`JoinSessionData` 인터페이스에 `nickname` 추가:

```tsx
export interface JoinSessionData {
  name: string;
  email: string;
  password: string;
  referralCode?: string;
  nickname?: string;  // 추가
}
```

다른 코드는 변경 없음 (제네릭하게 data를 serialize하므로 자동으로 처리됨).

---

## 파일 6: `app/features/auth/screens/verify.tsx`

### 라우트: `/auth/verify` (기존 유지)
### 역할: 약관 동의 (전화인증 삭제)

### 삭제할 것
- 전화번호 관련 state 전부: `phone`, `countryCode`, `verificationCode`, `isCodeSent`, `isPhoneVerified`, `timer`, `timerActive`, `codeExpired`
- timer 관련 `useEffect` (타이머 카운트다운)
- fetcher 관련 `useEffect` (codeSent, verified 핸들링)
- `formatTimer` 함수
- `fetcherError`, `phoneError`, `codeError` 변수
- `fetcher` (useFetcher) — 더 이상 필요 없음
- JSX 내 전화번호 섹션 전체 (select + input + 인증요청 버튼)
- JSX 내 인증번호 섹션 전체 (code input + 인증 버튼 + 타이머)
- action 내 `intent === "request-code"` 블록 전체
- action 내 `intent === "verify-code"` 블록 전체
- action 내 signup에서 `phone`, `countryCode` 관련 코드
- import: `AlertCircle`, `useFetcher`

### 유지할 것
- 약관 체크박스 섹션 (전체 동의 + 개별 4개)
- action 내 `intent === "signup"` 블록 (수정 필요)
- loader (기존 유지)

### 변경 사항

**meta 제목 변경:**
```tsx
title: `서비스 약관 동의 | ${import.meta.env.VITE_APP_NAME}`,
```

**action "signup" intent 수정:**
- `phone`, `countryCode` formData 읽기 제거
- Supabase signUp의 `options.data`에서 `phone` 제거, `nickname` 추가:

```tsx
if (intent === "signup") {
  const joinData = await getJoinSession(request);

  if (!joinData) {
    return redirect("/join");
  }

  const agreeAge = formData.get("agreeAge") === "on";
  const agreeTerms = formData.get("agreeTerms") === "on";
  const agreePrivacy = formData.get("agreePrivacy") === "on";
  const agreeMarketing = formData.get("agreeMarketing") === "on";

  if (!agreeAge || !agreeTerms || !agreePrivacy) {
    return data({ error: "필수 약관에 동의해주세요." }, { status: 400 });
  }

  const [client, headers] = makeServerClient(request);
  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email: joinData.email,
    password: joinData.password,
    options: {
      data: {
        name: joinData.name,
        display_name: joinData.name,
        nickname: joinData.nickname || joinData.name,
        marketing_consent: agreeMarketing,
        referral_code: joinData.referralCode,
      },
      emailRedirectTo: `${import.meta.env.VITE_SITE_URL}/auth/confirm?type=email&next=/`,
    },
  });
  // ... 나머지는 기존과 동일
}
```

**canSubmit 조건 변경:**
```tsx
// 현재: isPhoneVerified && agreeAge && agreeTerms && agreePrivacy
// 변경:
const canSubmit = agreeAge && agreeTerms && agreePrivacy;
```

**컴포넌트 전체 교체 (라이트 테마, 전화인증 없이 약관만):**

```tsx
export default function Verify({ loaderData, actionData }: Route.ComponentProps) {
  const { email } = loaderData;

  // Agreement state
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const canSubmit = agreeAge && agreeTerms && agreePrivacy;

  // Handle "agree all" checkbox
  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeAge(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  };

  // Update "agree all" when individual checkboxes change
  useEffect(() => {
    if (agreeAge && agreeTerms && agreePrivacy && agreeMarketing) {
      setAgreeAll(true);
    } else {
      setAgreeAll(false);
    }
  }, [agreeAge, agreeTerms, agreePrivacy, agreeMarketing]);

  // Check for action errors
  const generalError =
    actionData && "error" in actionData ? actionData.error : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-[360px]">
        {/* 타이틀 */}
        <h1 className="mb-2 text-center text-2xl font-bold text-black">
          서비스 약관 동의
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          {email} 으로 가입을 진행합니다.
        </p>

        <Form method="post" className="flex flex-col gap-6">
          {/* 약관 동의 섹션 */}
          <div className="space-y-3">
            {/* 전체 동의 */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
              <Checkbox
                id="agreeAll"
                checked={agreeAll}
                onCheckedChange={(checked) =>
                  handleAgreeAll(checked as boolean)
                }
                className="border-gray-300 data-[state=checked]:border-[#41C7BD] data-[state=checked]:bg-[#41C7BD]"
              />
              <Label
                htmlFor="agreeAll"
                className="text-sm font-medium text-black"
              >
                아래 약관에 모두 동의합니다.
              </Label>
            </div>

            {/* 만 14세 이상 */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="agreeAge"
                name="agreeAge"
                checked={agreeAge}
                onCheckedChange={(checked) => setAgreeAge(checked as boolean)}
                className="border-gray-300 data-[state=checked]:border-[#41C7BD] data-[state=checked]:bg-[#41C7BD]"
              />
              <Label htmlFor="agreeAge" className="text-sm text-gray-500">
                만 14세 이상입니다.{" "}
                <span className="text-[#41C7BD]">(필수)</span>
              </Label>
            </div>

            {/* 이용약관 */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="agreeTerms"
                name="agreeTerms"
                checked={agreeTerms}
                onCheckedChange={(checked) =>
                  setAgreeTerms(checked as boolean)
                }
                className="border-gray-300 data-[state=checked]:border-[#41C7BD] data-[state=checked]:bg-[#41C7BD]"
              />
              <Label htmlFor="agreeTerms" className="text-sm text-gray-500">
                <Link
                  to="/legal/terms-of-service"
                  className="text-[#41C7BD] hover:underline"
                >
                  나냥 서비스 이용약관
                </Link>
                에 동의합니다.{" "}
                <span className="text-[#41C7BD]">(필수)</span>
              </Label>
            </div>

            {/* 개인정보처리방침 */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="agreePrivacy"
                name="agreePrivacy"
                checked={agreePrivacy}
                onCheckedChange={(checked) =>
                  setAgreePrivacy(checked as boolean)
                }
                className="border-gray-300 data-[state=checked]:border-[#41C7BD] data-[state=checked]:bg-[#41C7BD]"
              />
              <Label htmlFor="agreePrivacy" className="text-sm text-gray-500">
                <Link
                  to="/legal/privacy-policy"
                  className="text-[#41C7BD] hover:underline"
                >
                  개인정보 수집 및 이용
                </Link>
                에 동의합니다.{" "}
                <span className="text-[#41C7BD]">(필수)</span>
              </Label>
            </div>

            {/* 마케팅 동의 */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="agreeMarketing"
                name="agreeMarketing"
                checked={agreeMarketing}
                onCheckedChange={(checked) =>
                  setAgreeMarketing(checked as boolean)
                }
                className="border-gray-300 data-[state=checked]:border-[#41C7BD] data-[state=checked]:bg-[#41C7BD]"
              />
              <Label
                htmlFor="agreeMarketing"
                className="text-sm text-gray-500"
              >
                마케팅 활용 및 광고성 정보 수신에 동의합니다.{" "}
                <span className="text-gray-400">(선택)</span>
              </Label>
            </div>
          </div>

          {/* 에러 메시지 */}
          {generalError && (
            <FormErrors errors={[generalError]} />
          )}

          {/* 가입 완료 버튼 */}
          <button
            type="submit"
            name="intent"
            value="signup"
            disabled={!canSubmit}
            className={`h-12 w-full rounded-md text-sm font-medium transition-colors ${
              canSubmit
                ? "bg-[#41C7BD] text-white hover:bg-[#41C7BD]/90"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            가입 완료
          </button>
        </Form>

        {/* 로그인 링크 */}
        <p className="mt-6 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link
            to="/login"
            viewTransition
            className="text-[#41C7BD] hover:underline"
          >
            로그인하기
          </Link>
        </p>
      </div>
    </div>
  );
}
```

**import 정리 (삭제):**
- `AlertCircle` (lucide-react에서)
- `useFetcher` (react-router에서)

**import 유지:**
- `useState`, `useEffect` from "react"
- `Form`, `Link`, `data`, `redirect` from "react-router"
- `FormButton` (사용하지 않으면 삭제해도 됨 — 위 코드에서는 일반 button 사용)
- `Checkbox`, `Input`(삭제 가능), `Label`
- `makeServerClient`, `getJoinSession`, `clearJoinSession`, `JoinSessionData`

> 주의: `FormButton`과 `Input`은 이 화면에서 직접 사용하지 않으므로 import에서 제거 가능합니다.

---

## 파일 7: `app/features/auth/screens/complete-profile.tsx`

### 라우트: `/auth/complete-profile` (기존 유지)
### 역할: 소셜 로그인 후 프로필 완성

### 삭제할 것
- `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle` import
- `Alert`, `AlertDescription`, `AlertTitle` import
- `CheckCircle2Icon` import
- JSX 내 `<Card>` 래퍼 전체

### 변경 사항

**import 변경:**
```tsx
// 삭제:
import { CheckCircle2Icon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/core/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/core/components/ui/card";

// 추가:
import { Link } from "react-router";
```

**전체 컴포넌트 JSX 교체:**

```tsx
export default function CompleteProfile({ actionData }: Route.ComponentProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [allTermsChecked, setAllTermsChecked] = useState(false);

  const handleAllTermsChange = (checked: boolean | string) => {
    const isChecked = checked === true || checked === "checked";
    setAllTermsChecked(isChecked);
    if (formRef.current) {
      const age14Checkbox =
        formRef.current.querySelector<HTMLInputElement>("#age14");
      const termsCheckbox =
        formRef.current.querySelector<HTMLInputElement>("#terms");
      const privacyCheckbox =
        formRef.current.querySelector<HTMLInputElement>("#privacy");
      const marketingCheckbox =
        formRef.current.querySelector<HTMLInputElement>("#marketing");

      if (age14Checkbox) age14Checkbox.checked = isChecked;
      if (termsCheckbox) termsCheckbox.checked = isChecked;
      if (privacyCheckbox) privacyCheckbox.checked = isChecked;
      if (marketingCheckbox) marketingCheckbox.checked = isChecked;
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-[350px]">
        {/* 타이틀 */}
        <h1 className="mb-2 text-center text-2xl font-bold text-black">
          프로필을 완성해 주세요
        </h1>
        <div className="mb-8 text-center text-sm text-gray-500">
          <p>소셜 계정으로 연결됐어요.</p>
          <p>아래 정보만 확인하면 가입이 완료됩니다.</p>
        </div>

        <Form
          className="flex w-full flex-col gap-5"
          method="post"
          ref={formRef}
        >
          {/* 닉네임 입력 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="nickname" className="text-sm font-medium text-black">
              닉네임
            </Label>
            <Input
              id="nickname"
              name="nickname"
              required
              type="text"
              placeholder="닉네임을 입력하세요"
              className="h-12 border-gray-300 bg-white text-black placeholder:text-gray-400 focus:border-[#41C7BD]"
            />
            <p className="text-xs text-gray-400">
              닉네임은 2~20자의 한글/영문/숫자만 가능합니다.
            </p>
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors?.nickname ? (
              <FormErrors errors={actionData.fieldErrors.nickname} />
            ) : null}
          </div>

          {/* 추천인 코드 입력 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="referralCode" className="text-sm font-medium text-black">
              추천인 코드
            </Label>
            <Input
              id="referralCode"
              name="referralCode"
              type="text"
              placeholder="추천인 코드를 입력하세요 (선택)"
              className="h-12 border-gray-300 bg-white text-black placeholder:text-gray-400 focus:border-[#41C7BD]"
            />
          </div>

          {/* 전체 약관 동의 */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            <Checkbox
              id="allTerms"
              checked={allTermsChecked}
              onCheckedChange={handleAllTermsChange}
              className="border-gray-300 data-[state=checked]:border-[#41C7BD] data-[state=checked]:bg-[#41C7BD]"
            />
            <Label
              htmlFor="allTerms"
              className="cursor-pointer text-sm font-medium text-black"
            >
              아래 약관에 모두 동의합니다.
            </Label>
          </div>

          {/* 개별 약관 체크박스들 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="age14"
                name="age14"
                required
                className="border-gray-300 data-[state=checked]:border-[#41C7BD] data-[state=checked]:bg-[#41C7BD]"
              />
              <Label htmlFor="age14" className="text-sm text-gray-500">
                만 14세 이상입니다. <span className="text-[#41C7BD]">(필수)</span>
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="terms"
                name="terms"
                required
                className="border-gray-300 data-[state=checked]:border-[#41C7BD] data-[state=checked]:bg-[#41C7BD]"
              />
              <Label htmlFor="terms" className="text-sm text-gray-500">
                <Link to="/legal/terms-of-service" className="text-[#41C7BD] hover:underline">
                  나냥 서비스 이용약관
                </Link>
                에 동의합니다. <span className="text-[#41C7BD]">(필수)</span>
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="privacy"
                name="privacy"
                required
                className="border-gray-300 data-[state=checked]:border-[#41C7BD] data-[state=checked]:bg-[#41C7BD]"
              />
              <Label htmlFor="privacy" className="text-sm text-gray-500">
                <Link to="/legal/privacy-policy" className="text-[#41C7BD] hover:underline">
                  개인정보 수집 및 이용
                </Link>
                에 동의합니다. <span className="text-[#41C7BD]">(필수)</span>
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="marketing"
                name="marketing"
                className="border-gray-300 data-[state=checked]:border-[#41C7BD] data-[state=checked]:bg-[#41C7BD]"
              />
              <Label htmlFor="marketing" className="text-sm text-gray-500">
                마케팅 활용 및 광고성 정보 수신에 동의합니다.{" "}
                <span className="text-gray-400">(선택)</span>
              </Label>
            </div>
          </div>

          {/* 약관 에러 표시 */}
          {actionData &&
          "fieldErrors" in actionData &&
          (actionData.fieldErrors?.age14 ||
            actionData.fieldErrors?.terms ||
            actionData.fieldErrors?.privacy) ? (
            <FormErrors
              errors={
                [
                  actionData.fieldErrors?.age14?.[0],
                  actionData.fieldErrors?.terms?.[0],
                  actionData.fieldErrors?.privacy?.[0],
                ].filter(Boolean) as string[]
              }
            />
          ) : null}

          {/* 일반 에러 표시 */}
          {actionData && "error" in actionData && actionData.error ? (
            <FormErrors errors={[actionData.error]} />
          ) : null}

          <FormButton
            label="가입 완료"
            className="h-12 w-full bg-[#41C7BD] text-white hover:bg-[#41C7BD]/90"
          />
        </Form>
      </div>
    </div>
  );
}
```

> **주의**: action, loader, schema(completeProfileSchema)는 기존 로직 그대로 유지. UI만 변경.

---

## 파일 8: `app/features/auth/screens/forgot-password.tsx`

### 라우트: `/auth/forgot-password/reset` → `/auth/account-recovery` (routes.ts에서 변경)
### 역할: A-4 비밀번호 찾기 (이메일 기반)

### 삭제할 것
- `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle` import

### 변경 사항

**meta 변경:**
```tsx
title: `비밀번호 찾기 | ${import.meta.env.VITE_APP_NAME}`,
```

**Zod 에러 메시지 한국어화:**
```tsx
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "올바른 이메일 주소를 입력해주세요" }),
});
```

**전체 컴포넌트 JSX 교체:**

```tsx
export default function ForgotPassword({ actionData }: Route.ComponentProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success) {
      formRef.current?.reset();
      formRef.current?.blur();
    }
  }, [actionData]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-[360px]">
        {/* 타이틀 */}
        <h1 className="mb-2 text-center text-2xl font-bold text-black">
          비밀번호 찾기
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          가입한 이메일 주소를 입력하세요.
        </p>

        <Form
          className="flex w-full flex-col gap-4"
          method="post"
          ref={formRef}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm font-medium text-black">
              이메일
            </Label>
            <Input
              id="email"
              name="email"
              required
              type="email"
              placeholder="이메일 입력"
              className="h-12 border-gray-300 bg-white text-black placeholder:text-gray-400 focus:border-[#41C7BD]"
            />
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors.email ? (
              <FormErrors errors={actionData.fieldErrors.email} />
            ) : null}
          </div>

          <FormButton
            label="비밀번호 재설정 링크 발송"
            className="h-12 w-full bg-[#41C7BD] text-white hover:bg-[#41C7BD]/90"
          />

          {actionData && "error" in actionData && actionData.error ? (
            <FormErrors errors={[actionData.error]} />
          ) : null}

          {actionData && "success" in actionData && actionData.success ? (
            <FormSuccess message="이메일을 확인해주세요. 비밀번호 재설정 링크를 발송했습니다." />
          ) : null}
        </Form>
      </div>
    </div>
  );
}
```

> **주의**: action 로직은 기존 그대로 유지 (resetPasswordForEmail).

---

## 파일 9: `app/features/auth/screens/new-password.tsx`

### 라우트: `/auth/forgot-password/create` (기존 유지)
### 역할: 비밀번호 재설정

### 삭제할 것
- `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle` import
- `CheckCircle2Icon` import

### 변경 사항

**meta 변경:**
```tsx
title: `비밀번호 재설정 | ${import.meta.env.VITE_APP_NAME}`,
```

**Zod 스키마 한국어화:**
```tsx
const updatePasswordSchema = z
  .object({
    password: z.string().min(8, { message: "비밀번호는 8자 이상이어야 합니다" }),
    confirmPassword: z.string().min(8, { message: "비밀번호는 8자 이상이어야 합니다" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });
```

**action 내 리다이렉트 경로 변경 (인증 안 된 경우):**
```tsx
// 현재: return redirect("/auth/forgot-password");
// 변경:
return redirect("/auth/account-recovery");
```

**전체 컴포넌트 JSX 교체:**

```tsx
export default function ChangePassword({ actionData }: Route.ComponentProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success) {
      formRef.current?.reset();
      formRef.current?.blur();
      formRef.current
        ?.querySelectorAll("input")
        ?.forEach((input) => input.blur());
    }
  }, [actionData]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-[360px]">
        {/* 타이틀 */}
        <h1 className="mb-2 text-center text-2xl font-bold text-black">
          본인 확인이 완료되었습니다.
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          새 비밀번호를 입력해주세요.
        </p>

        <Form
          className="flex w-full flex-col gap-4"
          method="post"
          ref={formRef}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-sm font-medium text-black">
              새 비밀번호
            </Label>
            <Input
              id="password"
              name="password"
              required
              type="password"
              placeholder="새 비밀번호 입력"
              className="h-12 border-gray-300 bg-white text-black placeholder:text-gray-400 focus:border-[#41C7BD]"
            />
            <p className="text-xs text-gray-400">
              최소 8자 이상, 숫자/문자 포함
            </p>
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors.password ? (
              <FormErrors errors={actionData.fieldErrors.password} />
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-black"
            >
              새 비밀번호 확인
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              required
              type="password"
              placeholder="새 비밀번호 확인"
              className="h-12 border-gray-300 bg-white text-black placeholder:text-gray-400 focus:border-[#41C7BD]"
            />
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors.confirmPassword ? (
              <FormErrors errors={actionData.fieldErrors.confirmPassword} />
            ) : null}
          </div>

          <FormButton
            label="비밀번호 재설정 완료"
            className="h-12 w-full bg-[#41C7BD] text-white hover:bg-[#41C7BD]/90"
          />

          {actionData && "error" in actionData && actionData.error ? (
            <FormErrors errors={[actionData.error]} />
          ) : null}

          {actionData && "success" in actionData && actionData.success ? (
            <FormSuccess message="비밀번호가 성공적으로 변경되었습니다." />
          ) : null}
        </Form>
      </div>
    </div>
  );
}
```

> **주의**: `FormSuccess`가 현재 import 되어 있지 않으면 추가 필요:
> `import FormSuccess from "~/core/components/form-success";`

> action 로직은 기존 그대로 유지 (리다이렉트 경로만 변경).

---

## 파일 10: `app/routes.ts`

### 변경 사항 2가지

**1. `/login/email` 라우트 추가:**

98행 `/login` 아래에 추가:

```ts
route("/login", "features/auth/screens/login.tsx"),
route("/login/email", "features/auth/screens/login-email.tsx"),  // 추가
route("/join", "features/auth/screens/join.tsx"),
```

**2. forgot-password 라우트 경로 변경:**

105~108행:

```ts
// 변경 전:
route(
  "/forgot-password/reset",
  "features/auth/screens/forgot-password.tsx",
),

// 변경 후:
route(
  "/account-recovery",
  "features/auth/screens/forgot-password.tsx",
),
```

---

## 검증 체크리스트

구현 완료 후 아래를 확인합니다:

```bash
npm run typecheck
```

### 라우트 접근 확인
- [ ] `/login` → 소셜 버튼 4개 (카카오→애플→네이버→구글) + "이메일 로그인" 밑줄 링크 + "이메일로 회원가입" 링크
- [ ] `/login/email` → 이메일/비밀번호 폼 + 눈 아이콘 토글 + "이메일 / 비밀번호 찾기" 링크 + "이메일로 회원가입" 링크
- [ ] `/join` → 이름/이메일/비밀번호/비밀번호확인/닉네임/추천인코드 6개 필드 + "가입 완료" 버튼
- [ ] `/auth/verify` → 약관 체크박스만 (전화인증 없음) + "가입 완료" 버튼
- [ ] `/auth/complete-profile` → 닉네임 + 추천인코드 + 약관 체크박스 + "가입 완료" 버튼
- [ ] `/auth/account-recovery` → 이메일 입력 + "비밀번호 재설정 링크 발송" 버튼
- [ ] `/auth/forgot-password/create` → 새 비밀번호 + 확인 + "비밀번호 재설정 완료" 버튼

### 스타일 확인
- [ ] 모든 화면 배경색 `bg-white` (다크 배경 없음)
- [ ] 모든 텍스트 `text-black` 또는 `text-gray-*` (흰색 텍스트 없음)
- [ ] 주요 버튼 컬러 `#41C7BD` (기존 `#14b8a6` 아님)
- [ ] 입력 필드 border `border-gray-300` (기존 `border-[#3f3f46]` 아님)
- [ ] 체크박스 활성색 `#41C7BD`

### 기능 확인
- [ ] 이메일 로그인 (signInWithPassword) 정상 동작
- [ ] 이메일 회원가입 → 약관 → 계정 생성 플로우 정상
- [ ] 닉네임이 Supabase user metadata에 저장됨
- [ ] 소셜 로그인 → 프로필 완성 플로우 정상
- [ ] 비밀번호 재설정 이메일 발송 정상
