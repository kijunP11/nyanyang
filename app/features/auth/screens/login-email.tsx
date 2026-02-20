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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] px-4">
      <div className="w-full max-w-[350px]">
        <h1 className="mb-8 text-center text-[28px] font-medium leading-[40px] text-[#181D27]">
          이메일 로그인
        </h1>

        <Form
          className="flex w-full flex-col gap-5"
          method="post"
          ref={formRef}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-[#414651]">
              이메일
            </Label>
            <Input
              id="email"
              name="email"
              required
              type="email"
              placeholder="이메일 입력"
              className="h-11 border-[#D5D7DA] bg-white text-base text-black shadow-xs placeholder:text-[#717680] focus:border-[#36C4B3]"
            />
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors?.email ? (
              <FormErrors errors={actionData.fieldErrors.email} />
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-[#414651]"
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
                className="h-11 border-[#D5D7DA] bg-white pr-10 text-base text-black shadow-xs placeholder:text-[#717680] focus:border-[#36C4B3]"
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
            className="mt-2 h-12 w-full rounded-lg bg-[#36C4B3] text-base font-semibold text-white shadow-xs hover:bg-[#36C4B3]/90"
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

        <div className="mt-4 text-right">
          <Link
            to="/auth/account-recovery"
            className="text-xs font-semibold text-[#A4A7AE] underline"
            viewTransition
          >
            이메일 / 비밀번호 찾기
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-[#535862]">
          소셜 계정이 없으신가요?{" "}
          <Link
            to="/join"
            viewTransition
            className="font-semibold text-[#28A393] underline"
          >
            이메일로 회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
