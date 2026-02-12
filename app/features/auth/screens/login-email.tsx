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
        <h1 className="mb-8 text-center text-2xl font-bold text-black">
          이메일 로그인
        </h1>

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
            actionData.fieldErrors?.email ? (
              <FormErrors errors={actionData.fieldErrors.email} />
            ) : null}
          </div>

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
            actionData.fieldErrors?.password ? (
              <FormErrors errors={actionData.fieldErrors.password} />
            ) : null}
          </div>

          <FormButton
            label="로그인"
            className="mt-2 h-12 w-full bg-[#41C7BD] text-white hover:bg-[#41C7BD]/90"
          />

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

        <div className="mt-4 text-center">
          <Link
            to="/auth/account-recovery"
            className="text-sm text-gray-400 underline"
            viewTransition
          >
            이메일 / 비밀번호 찾기
          </Link>
        </div>

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
