/**
 * User Registration Screen Component (Step 1)
 *
 * This component handles the first step of user registration:
 * - Basic information collection (name, email, password)
 * - Form validation for all fields
 * - Duplicate email checking
 * - Social authentication providers
 *
 * After validation, user data is stored in a secure cookie
 * and redirected to /auth/verify for phone verification and terms agreement.
 */
import type { Route } from "./+types/join";

import { Form, Link, data, redirect } from "react-router";
import { z } from "zod";

import FormButton from "~/core/components/form-button";
import FormErrors from "~/core/components/form-error";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";

import { SignUpButtons } from "../components/auth-login-buttons";
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1a1a1a] px-4 py-8">
      <div className="w-full max-w-[350px]">
        {/* 타이틀 */}
        <h1 className="mb-8 text-center text-3xl font-bold text-white">
          회원가입
        </h1>

        {/* 회원가입 폼 */}
        <Form
          className="flex w-full flex-col gap-4"
          method="post"
        >
          {/* 이름 입력 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-sm text-[#9ca3af]">
              이름
            </Label>
            <Input
              id="name"
              name="name"
              required
              type="text"
              placeholder="이름을 입력하세요"
              className="h-12 border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6]"
            />
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors?.name ? (
              <FormErrors errors={actionData.fieldErrors.name} />
            ) : null}
          </div>

          {/* 이메일 입력 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm text-[#9ca3af]">
              이메일
            </Label>
            <Input
              id="email"
              name="email"
              required
              type="email"
              placeholder="이메일을 입력하세요"
              className="h-12 border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6]"
            />
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors?.email ? (
              <FormErrors errors={actionData.fieldErrors.email} />
            ) : null}
          </div>

          {/* 비밀번호 입력 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-sm text-[#9ca3af]">
              비밀번호
            </Label>
            <Input
              id="password"
              name="password"
              required
              type="password"
              placeholder="비밀번호를 입력하세요"
              className="h-12 border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6]"
            />
            <p className="text-xs text-[#6b7280]">
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
            <Label htmlFor="confirmPassword" className="text-sm text-[#9ca3af]">
              비밀번호 확인
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              required
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              className="h-12 border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6]"
            />
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors?.confirmPassword ? (
              <FormErrors errors={actionData.fieldErrors.confirmPassword} />
            ) : null}
          </div>

          {/* 추천인 코드 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="referralCode" className="text-sm text-[#9ca3af]">
              추천인 코드
            </Label>
            <Input
              id="referralCode"
              name="referralCode"
              type="text"
              placeholder="추천인 코드 입력"
              className="h-12 border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6]"
            />
          </div>

          {/* 다음단계로 버튼 */}
          <FormButton
            label="다음단계로"
            className="mt-4 h-11 w-full bg-[#14b8a6] text-white hover:bg-[#0d9488]"
          />

          {/* 에러 메시지 */}
          {actionData && "error" in actionData && actionData.error ? (
            <FormErrors errors={[actionData.error]} />
          ) : null}
        </Form>

        {/* 소셜 로그인 */}
        <div className="mt-6">
          <SignUpButtons />
        </div>

        {/* 로그인 링크 */}
        <p className="mt-6 text-center text-sm text-[#9ca3af]">
          이미 계정이 있으신가요?{" "}
          <Link
            to="/login"
            viewTransition
            data-testid="form-signin-link"
            className="font-medium text-[#14b8a6] hover:underline"
          >
            로그인하기
          </Link>
        </p>
      </div>
    </div>
  );
}
