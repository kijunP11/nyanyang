/**
 * Login Screen Component
 *
 * This component handles user authentication via email/password login,
 * social authentication providers, and provides options for password reset
 * and email verification. It demonstrates form validation, error handling,
 * and Supabase authentication integration.
 */
import type { Route } from "./+types/login";

import { AlertCircle, Loader2Icon } from "lucide-react";
import { useRef } from "react";
import { Form, Link, data, redirect, useFetcher } from "react-router";
import { z } from "zod";

import FormButton from "~/core/components/form-button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/core/components/ui/alert";
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import makeServerClient from "~/core/lib/supa-client.server";

import FormErrors from "../../../core/components/form-error";
import { SignInButtons } from "../components/auth-login-buttons";

/**
 * Meta function for the login page
 *
 * Sets the page title using the application name from environment variables
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `로그인 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Form validation schema for login
 *
 * Uses Zod to validate:
 * - Email: Must be a valid email format
 * - Password: Must be at least 8 characters long
 *
 * Error messages are provided for user feedback
 */
const loginSchema = z.object({
  email: z.string().email({ message: "올바른 이메일 주소를 입력해주세요" }),
  password: z
    .string()
    .min(8, { message: "비밀번호는 8자 이상이어야 합니다" }),
});

/**
 * Server action for handling login form submission
 *
 * This function processes the login form data and attempts to authenticate the user.
 * The flow is:
 * 1. Parse and validate form data using the login schema
 * 2. Return validation errors if the data is invalid
 * 3. Attempt to sign in with Supabase using email/password
 * 4. Return authentication errors if sign-in fails
 * 5. Redirect to home page with auth cookies if successful
 *
 * @param request - The form submission request
 * @returns Validation errors, auth errors, or redirect on success
 */
export async function action({ request }: Route.ActionArgs) {
  // Parse form data from the request
  const formData = await request.formData();
  const {
    data: validData,
    success,
    error,
  } = loginSchema.safeParse(Object.fromEntries(formData));

  // Return validation errors if form data is invalid
  if (!success) {
    return data({ fieldErrors: error.flatten().fieldErrors }, { status: 400 });
  }

  // Create Supabase client with request cookies for authentication
  const [client, headers] = makeServerClient(request);

  // Attempt to sign in with email and password
  const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
    ...validData,
  });

  // Return error if authentication fails
  if (signInError) {
    // Check for specific error types
    if (signInError.message.includes("Email not confirmed") || 
        signInError.message.includes("email_not_confirmed")) {
      return data({ 
        error: "Email not confirmed",
        email: validData.email,
      }, { status: 400 });
    }
    return data({ error: signInError.message }, { status: 400 });
  }

  // Verify that we have a valid session
  if (!signInData?.session) {
    return data({ 
      error: "세션을 생성하지 못했습니다. 다시 시도해주세요." 
    }, { status: 500 });
  }

  // Redirect to home page with authentication cookies in headers
  return redirect("/", { headers });
}

/**
 * Login Component
 *
 * This component renders the login form and handles user interactions.
 * It includes:
 * - Email and password input fields with validation
 * - Error display for form validation and authentication errors
 * - Password reset link
 * - Email verification resend functionality
 * - Social login options
 * - Sign up link for new users
 *
 * @param actionData - Data returned from the form action, including any errors
 */
export default function Login({ actionData }: Route.ComponentProps) {
  // Reference to the form element for accessing form data
  const formRef = useRef<HTMLFormElement>(null);

  // Fetcher for submitting the email verification resend request
  const fetcher = useFetcher();

  /**
   * Handler for resending email verification
   *
   * When a user tries to log in with an unverified email, they can click
   * to resend the verification email. This function:
   * 1. Prevents the default button behavior
   * 2. Gets the current form data (email only)
   * 3. Submits it to the resend endpoint
   */
  const onResendClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    formData.delete("password"); // Only need the email for resending verification
    fetcher.submit(formData, {
      method: "post",
      action: "/auth/api/resend",
    });
  };
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1a1a1a] px-4">
      <div className="w-full max-w-[350px]">
        {/* 타이틀 */}
        <h1 className="mb-8 text-center text-3xl font-bold text-white">
          로그인
        </h1>

        {/* 로그인 폼 */}
        <Form
          className="flex w-full flex-col gap-4"
          method="post"
          ref={formRef}
        >
          {/* 아이디 입력 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm text-[#9ca3af]">
              아이디
            </Label>
            <Input
              id="email"
              name="email"
              required
              type="email"
              placeholder="아이디 입력"
              className="h-12 border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6]"
            />
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors.email ? (
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
            {actionData &&
            "fieldErrors" in actionData &&
            actionData.fieldErrors.password ? (
              <FormErrors errors={actionData.fieldErrors.password} />
            ) : null}
          </div>

          {/* 로그인 버튼 */}
          <FormButton
            label="로그인"
            className="mt-2 h-11 w-full bg-[#14b8a6] text-white hover:bg-[#0d9488]"
          />

          {/* 에러 메시지 */}
          {actionData && "error" in actionData ? (
            actionData.error === "Email not confirmed" ? (
              <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>이메일 인증 필요</AlertTitle>
                <AlertDescription className="flex flex-col items-start gap-2">
                  로그인하기 전에 이메일을 인증해주세요.
                  <Button
                    variant="outline"
                    className="border-[#3f3f46] bg-transparent text-white hover:bg-[#3f3f46]"
                    onClick={onResendClick}
                  >
                    인증 메일 재발송
                    {fetcher.state === "submitting" ? (
                      <Loader2Icon
                        data-testid="resend-confirmation-email-spinner"
                        className="ml-2 size-4 animate-spin"
                      />
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
            to="/auth/forgot-password/reset"
            className="text-sm text-[#9ca3af] underline underline-offset-4 hover:text-white"
            viewTransition
          >
            아이디 또는 비밀번호를 잊어버리셨나요?
          </Link>
        </div>

        {/* 소셜 로그인 */}
        <div className="mt-6">
          <SignInButtons />
        </div>

        {/* 회원가입 링크 */}
        <p className="mt-6 text-center text-sm text-[#9ca3af]">
          신규 회원이신가요?{" "}
          <Link
            to="/join"
            viewTransition
            data-testid="form-signup-link"
            className="font-medium text-[#14b8a6] hover:underline"
          >
            1분만에 회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
