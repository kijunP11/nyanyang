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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
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
      title: `Log in | ${import.meta.env.VITE_APP_NAME}`,
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
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
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
  const { error: signInError } = await client.auth.signInWithPassword({
    ...validData,
  });

  // Return error if authentication fails
  if (signInError) {
    return data({ error: signInError.message }, { status: 400 });
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
    <div className="flex flex-col items-center justify-center gap-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold">
            Sign into your account
          </CardTitle>
          <CardDescription className="text-base">
            Please enter your details
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Form
            className="flex w-full flex-col gap-5"
            method="post"
            ref={formRef}
          >
            <div className="flex flex-col items-start space-y-2">
              <Label
                htmlFor="email"
                className="flex flex-col items-start gap-1"
              >
                Email
              </Label>
              <Input
                id="email"
                name="email"
                required
                type="email"
                placeholder="i.e nico@supaplate.com"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors.email ? (
                <FormErrors errors={actionData.fieldErrors.email} />
              ) : null}
            </div>
            <div className="flex flex-col items-start space-y-2">
              <div className="flex w-full items-center justify-between">
                <Label
                  htmlFor="password"
                  className="flex flex-col items-start gap-1"
                >
                  Password
                </Label>
                <Link
                  to="/auth/forgot-password/reset"
                  className="text-muted-foreground text-underline hover:text-foreground self-end text-sm underline transition-colors"
                  tabIndex={-1}
                  viewTransition
                >
                  Forgot your password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                required
                type="password"
                placeholder="Enter your password"
              />

              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors.password ? (
                <FormErrors errors={actionData.fieldErrors.password} />
              ) : null}
            </div>
            <FormButton label="Log in" className="w-full" />
            {actionData && "error" in actionData ? (
              actionData.error === "Email not confirmed" ? (
                <Alert variant="destructive" className="bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Email not confirmed</AlertTitle>
                  <AlertDescription className="flex flex-col items-start gap-2">
                    Before signing in, please verify your email.
                    <Button
                      variant="outline"
                      className="text-foreground flex items-center justify-between gap-2"
                      onClick={onResendClick}
                    >
                      Resend confirmation email
                      {fetcher.state === "submitting" ? (
                        <Loader2Icon
                          data-testid="resend-confirmation-email-spinner"
                          className="size-4 animate-spin"
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
          <SignInButtons />
        </CardContent>
      </Card>
      <div className="flex flex-col items-center justify-center text-sm">
        <p className="text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/join"
            viewTransition
            data-testid="form-signup-link"
            className="text-muted-foreground hover:text-foreground text-underline underline transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
