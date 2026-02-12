/**
 * 비밀번호 찾기 — 이메일로 재설정 링크 발송 (A-4)
 */
import type { Route } from "./+types/forgot-password";

import { useEffect, useRef } from "react";
import { Form, data } from "react-router";
import { z } from "zod";

import FormButton from "~/core/components/form-button";
import FormErrors from "~/core/components/form-error";
import FormSuccess from "~/core/components/form-success";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import makeServerClient from "~/core/lib/supa-client.server";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `비밀번호 찾기 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "올바른 이메일 주소를 입력해주세요" }),
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = forgotPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return data(
      { fieldErrors: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const [client] = makeServerClient(request);
  const { error } = await client.auth.resetPasswordForEmail(result.data.email);

  if (error) {
    return data({ error: error.message }, { status: 400 });
  }

  return { success: true };
}

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
            actionData.fieldErrors?.email ? (
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
            <FormSuccess message="이메일을 확인해주세요." />
          ) : null}
        </Form>
      </div>
    </div>
  );
}
