/**
 * User Registration Screen Component (Step 1)
 *
 * This component handles the first step of user registration:
 * - Basic information collection (name, email, password, nickname)
 * - Form validation for all fields
 * - Duplicate email checking
 *
 * After validation, user data is stored in a secure cookie
 * and redirected to /auth/verify for terms agreement.
 */
import type { Route } from "./+types/join";

import { AlertCircle } from "lucide-react";
import { Form, Link, data, redirect } from "react-router";
import { z } from "zod";

import FormButton from "~/core/components/form-button";
import FormErrors from "~/core/components/form-error";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";

import { createJoinSession } from "../lib/join-session.server";
import { doesUserExist } from "../lib/queries.server";

/**
 * Meta function for the registration page
 *
 * Sets the page title using the application name from environment variables
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `회원가입 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Form validation schema for user registration
 *
 * Uses Zod to validate:
 * - Name: Required field
 * - Email: Must be a valid email format
 * - Password: Must be at least 8 characters long
 * - Confirm Password: Must match the password field
 * - Marketing: Boolean for marketing consent (defaults to false)
 * - Terms: Boolean for terms acceptance
 *
 * The schema includes a custom refinement to ensure passwords match
 */
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

/**
 * Server action for handling user registration form submission (Step 1)
 *
 * This function processes the registration form data and stores it in a cookie
 * for the verification step (Step 2).
 * The flow is:
 * 1. Parse and validate form data using the join schema
 * 2. Return validation errors if the data is invalid
 * 3. Check if a user with the provided email already exists
 * 4. Store validated data in a secure cookie
 * 5. Redirect to /auth/verify for phone verification and terms agreement
 *
 * @param request - The form submission request
 * @returns Validation errors or redirect to verify page
 */
export async function action({ request }: Route.ActionArgs) {
  // Parse form data from the request
  const formData = await request.formData();
  const {
    data: validData,
    success,
    error,
  } = joinSchema.safeParse(Object.fromEntries(formData));

  // Return validation errors if form data is invalid
  if (!success) {
    return data({ fieldErrors: error.flatten().fieldErrors }, { status: 400 });
  }

  // Check if a user with the provided email already exists
  const userExists = await doesUserExist(validData.email);

  if (userExists) {
    return data(
      { error: "이미 가입된 이메일입니다" },
      { status: 400 },
    );
  }

  // Store validated data in a secure cookie and redirect to verify page
  const cookieHeader = await createJoinSession({
    name: validData.name,
    email: validData.email,
    password: validData.password,
    nickname: validData.nickname,
    referralCode: validData.referralCode,
  });

  return redirect("/auth/verify", {
    headers: {
      "Set-Cookie": cookieHeader,
    },
  });
}

/**
 * Registration Component (Step 1)
 *
 * This component renders the first step of the registration form.
 * It includes:
 * - Personal information fields (name, email)
 * - Password creation with confirmation
 * - Referral code input (optional)
 * - Error display for form validation
 * - Social registration options
 * - Sign in link for existing users
 *
 * @param actionData - Data returned from the form action, including errors
 */
export default function Join({ actionData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] px-4 py-8">
      <div className="w-full max-w-[360px]">
        <h1 className="mb-8 text-center text-2xl font-bold text-[#181D27]">
          회원가입
        </h1>

        <Form className="flex w-full flex-col gap-2.5" method="post">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className="text-sm text-[#414651]">
              이름
            </Label>
            <div className="relative">
              <Input
                id="name"
                name="name"
                required
                type="text"
                placeholder="이름 입력"
                aria-invalid={!!(actionData && "fieldErrors" in actionData && actionData.fieldErrors?.name)}
                className="h-11 border-[#D5D7DA] bg-white text-base text-black shadow-xs placeholder:text-[#717680] focus:border-[#36C4B3]"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors?.name ? (
                <AlertCircle className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#F04438]" />
              ) : null}
            </div>
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors?.name ? (
              <FormErrors errors={actionData.fieldErrors.name} />
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-sm text-[#414651]">
              이메일
            </Label>
            <div className="relative">
              <Input
                id="email"
                name="email"
                required
                type="email"
                placeholder="이메일 입력"
                aria-invalid={!!(actionData && "fieldErrors" in actionData && actionData.fieldErrors?.email)}
                className="h-11 border-[#D5D7DA] bg-white text-base text-black shadow-xs placeholder:text-[#717680] focus:border-[#36C4B3]"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors?.email ? (
                <AlertCircle className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#F04438]" />
              ) : null}
            </div>
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors?.email ? (
              <FormErrors errors={actionData.fieldErrors.email} />
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-sm text-[#414651]">
              비밀번호
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                required
                type="password"
                placeholder="비밀번호 입력"
                aria-invalid={!!(actionData && "fieldErrors" in actionData && actionData.fieldErrors?.password)}
                className="h-11 border-[#D5D7DA] bg-white text-base text-black shadow-xs placeholder:text-[#717680] focus:border-[#36C4B3]"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors?.password ? (
                <AlertCircle className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#F04438]" />
              ) : null}
            </div>
            <p className="text-sm text-[#535862]">
              영문, 숫자를 포함하여 8자 이상 입력해주세요.
            </p>
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors?.password ? (
              <FormErrors errors={actionData.fieldErrors.password} />
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword" className="text-sm text-[#414651]">
              비밀번호 확인
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                required
                type="password"
                placeholder="비밀번호 입력"
                aria-invalid={!!(actionData && "fieldErrors" in actionData && actionData.fieldErrors?.confirmPassword)}
                className="h-11 border-[#D5D7DA] bg-white text-base text-black shadow-xs placeholder:text-[#717680] focus:border-[#36C4B3]"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors?.confirmPassword ? (
                <AlertCircle className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#F04438]" />
              ) : null}
            </div>
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors?.confirmPassword ? (
              <FormErrors errors={actionData.fieldErrors.confirmPassword} />
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nickname" className="text-sm font-medium text-[#414651]">
              닉네임
            </Label>
            <div className="relative">
              <Input
                id="nickname"
                name="nickname"
                required
                type="text"
                placeholder="닉네임 입력"
                aria-invalid={!!(actionData && "fieldErrors" in actionData && actionData.fieldErrors?.nickname)}
                className="h-11 border-[#D5D7DA] bg-white text-base text-black shadow-xs placeholder:text-[#717680] focus:border-[#36C4B3]"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors?.nickname ? (
                <AlertCircle className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#F04438]" />
              ) : null}
            </div>
            <p className="text-sm text-[#535862]">
              닉네임은 2~20자의 한글/영문/숫자만 가능합니다.
            </p>
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors?.nickname ? (
              <FormErrors errors={actionData.fieldErrors.nickname} />
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="referralCode" className="text-sm font-medium text-[#414651]">
              추천인 코드
            </Label>
            <Input
              id="referralCode"
              name="referralCode"
              type="text"
              placeholder="추천인 코드 입력"
              className="h-11 border-[#D5D7DA] bg-white text-base text-black shadow-xs placeholder:text-[#717680] focus:border-[#36C4B3]"
            />
          </div>

          <FormButton
            label="가입 완료"
            className="mt-[22px] h-12 w-full rounded-lg bg-[#36C4B3] text-base font-semibold text-white shadow-xs hover:bg-[#36C4B3]/90"
          />

          {actionData && "error" in actionData && actionData.error ? (
            <FormErrors errors={[actionData.error]} />
          ) : null}
        </Form>

        <p className="mt-6 text-center text-sm text-[#181D27]">
          이미 계정이 있으신가요?{" "}
          <Link
            to="/login"
            viewTransition
            data-testid="form-signin-link"
            className="font-semibold text-[#28A393] underline"
          >
            로그인하기
          </Link>
        </p>
      </div>
    </div>
  );
}
