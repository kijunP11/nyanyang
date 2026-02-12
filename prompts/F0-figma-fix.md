# F0 Figma 피드백 수정 — 2건

Figma 디자인과 비교하여 발견된 차이 2건을 수정합니다.

---

## 수정 1: `app/features/auth/screens/complete-profile.tsx`

### 내용
버튼 텍스트 "가입 완료" → **"시작하기"** (Figma 기준)

### 변경
284행 한 줄만 수정:

```tsx
// 현재 (284행):
label="가입 완료"

// 변경:
label="시작하기"
```

---

## 수정 2: `app/features/auth/screens/new-password.tsx`

### 내용
비밀번호 재설정 성공 시, 현재는 인라인 `FormSuccess` 메시지만 표시.
Figma에서는 **별도 완료 화면**으로 전환됩니다:

```
"비밀번호 재설정 완료"  (제목, text-2xl font-bold text-black)
"새 비밀번호로 로그인할 수 있습니다."  (부제, text-sm text-gray-500)

[로그인 하러 가기]      — 주요 버튼 (bg-[#41C7BD] text-white)
[메인화면으로 돌아가기]  — 보조 버튼 (bg-white border border-gray-300 text-black)
```

### 변경

**import에 `Link` 추가:**
```tsx
// 현재 (7행):
import { Form, data, redirect } from "react-router";

// 변경:
import { Form, Link, data, redirect } from "react-router";
```

**`FormSuccess` import 제거** (더 이상 사용하지 않음):
```tsx
// 삭제 (12행):
import FormSuccess from "~/core/components/form-success";
```

**컴포넌트 JSX 전체 교체 (106~193행):**

성공 여부에 따라 폼 / 완료 화면을 조건부 렌더링합니다.

```tsx
export default function ChangePassword({ actionData }: Route.ComponentProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const isSuccess = actionData && "success" in actionData && actionData.success;

  useEffect(() => {
    if (isSuccess) {
      formRef.current?.reset();
      formRef.current?.blur();
      formRef.current
        ?.querySelectorAll("input")
        ?.forEach((input) => input.blur());
    }
  }, [isSuccess]);

  // 성공 시 완료 화면
  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="w-full max-w-[360px]">
          <h1 className="mb-2 text-center text-2xl font-bold text-black">
            비밀번호 재설정 완료
          </h1>
          <p className="mb-8 text-center text-sm text-gray-500">
            새 비밀번호로 로그인할 수 있습니다.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              className="flex h-12 w-full items-center justify-center rounded-md bg-[#41C7BD] text-sm font-medium text-white hover:bg-[#41C7BD]/90"
            >
              로그인 하러 가기
            </Link>
            <Link
              to="/"
              className="flex h-12 w-full items-center justify-center rounded-md border border-gray-300 bg-white text-sm font-medium text-black hover:bg-gray-50"
            >
              메인화면으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 기본: 비밀번호 입력 폼
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-[360px]">
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
            <Label
              htmlFor="password"
              className="text-sm font-medium text-black"
            >
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
            actionData.fieldErrors?.password ? (
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
              placeholder="새 비밀번호 다시 입력"
              className="h-12 border-gray-300 bg-white text-black placeholder:text-gray-400 focus:border-[#41C7BD]"
            />
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors?.confirmPassword ? (
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
        </Form>
      </div>
    </div>
  );
}
```

### 핵심 변경 요약
- `isSuccess` 변수로 성공 여부 판별
- 성공 시 폼 대신 완료 화면 렌더링 (제목 + 부제 + 2개 Link 버튼)
- `FormSuccess` 컴포넌트 → 삭제 (import도 제거)
- `Link` import 추가

---

## 검증
```bash
npm run typecheck
```
- `/auth/forgot-password/create` 접근 → 폼 표시 → 성공 후 완료 화면 전환 확인
- `/auth/complete-profile` 접근 → 버튼 텍스트 "시작하기" 확인
