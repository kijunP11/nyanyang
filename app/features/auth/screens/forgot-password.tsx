/**
 * Password Reset Request Screen Component
 *
 * This component handles the first step of the password reset flow:
 * allowing users to request a password reset link via email.
 *
 * The component includes:
 * - Email input field with validation
 * - Form submission handling
 * - Success confirmation after sending reset link
 * - Error handling for invalid emails or server issues
 */
import type { Route } from "./+types/forgot-password";

import { useEffect, useRef } from "react";
import { Form, data } from "react-router";
import { z } from "zod";

import FormButton from "~/core/components/form-button";
import FormErrors from "~/core/components/form-error";
import FormSuccess from "~/core/components/form-success";
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

/**
 * Meta function for the forgot password page
 *
 * Sets the page title using the application name from environment variables
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Forgot Password | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Form validation schema for password reset request
 *
 * Uses Zod to validate the email field to ensure it's a valid email format
 * before attempting to send a reset link
 */
const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

/**
 * Server action for handling password reset request form submission
 *
 * This function processes the form data and attempts to send a password reset email.
 * The flow is:
 * 1. Parse and validate the email using the schema
 * 2. Return validation errors if the email is invalid
 * 3. Request a password reset email from Supabase auth
 * 4. Return success or error response
 *
 * Note: For security reasons, this endpoint returns success even if the email
 * doesn't exist in the system, to prevent email enumeration attacks.
 *
 * @param request - The form submission request
 * @returns Validation errors, auth errors, or success confirmation
 */
export async function action({ request }: Route.ActionArgs) {
  // Parse and validate form data
  const formData = await request.formData();
  const result = forgotPasswordSchema.safeParse(Object.fromEntries(formData));

  // Return validation errors if email is invalid
  if (!result.success) {
    return data(
      { fieldErrors: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  // Create Supabase client
  const [client] = makeServerClient(request);

  // Request password reset email from Supabase
  const { error } = await client.auth.resetPasswordForEmail(result.data.email);

  // Return error if request fails
  if (error) {
    return data({ error: error.message }, { status: 400 });
  }

  // Return success response
  return { success: true };
}

/**
 * Password Reset Request Component
 *
 * This component renders the form for requesting a password reset link.
 * It includes:
 * - Email input field with validation
 * - Submit button for requesting the reset link
 * - Error display for validation and server errors
 * - Success confirmation message after sending the reset link
 *
 * @param actionData - Data returned from the form action, including errors or success status
 */
export default function ForgotPassword({ actionData }: Route.ComponentProps) {
  // Reference to the form element for resetting after successful submission
  const formRef = useRef<HTMLFormElement>(null);

  // Reset the form when the reset link is successfully sent
  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success) {
      formRef.current?.reset();
      formRef.current?.blur();
    }
  }, [actionData]);
  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold">
            Forgot your password?
          </CardTitle>
          <CardDescription className="text-center text-base">
            Enter your email and we&apos;ll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Form
            className="flex w-full flex-col gap-5"
            method="post"
            ref={formRef}
          >
            <div className="flex flex-col items-start space-y-2">
              <Label htmlFor="name" className="flex flex-col items-start gap-1">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                required
                type="email"
                placeholder="nico@supaplate.com"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors.email ? (
                <FormErrors errors={actionData.fieldErrors.email} />
              ) : null}
            </div>
            <FormButton label="Send reset link" className="w-full" />
            {actionData && "error" in actionData && actionData.error ? (
              <FormErrors errors={[actionData.error]} />
            ) : null}
            {actionData && "success" in actionData && actionData.success ? (
              <FormSuccess message="Check your email for a reset link, you can close this tab." />
            ) : null}
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
