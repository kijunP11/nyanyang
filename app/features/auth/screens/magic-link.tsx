/**
 * Magic Link Authentication Screen Component
 *
 * This component handles passwordless authentication via magic links.
 * Users enter their email and receive a link that automatically logs them in.
 * 
 * The component includes:
 * - Email input field with validation
 * - Form submission handling
 * - Success confirmation after sending magic link
 * - Error handling for invalid emails or non-existent accounts
 */
import type { Route } from "./+types/magic-link";

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
 * Meta function for the magic link page
 *
 * Sets the page title using the application name from environment variables
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Magic Link | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Form validation schema for magic link authentication
 *
 * Uses Zod to validate the email field to ensure it's a valid email format
 * before attempting to send a magic link
 */
const magicLinkSchema = z.object({
  email: z.string().email(),
});

/**
 * Server action for handling magic link authentication form submission
 *
 * This function processes the form data and attempts to send a magic link email.
 * The flow is:
 * 1. Parse and validate the email using the schema
 * 2. Return validation errors if the email is invalid
 * 3. Request a one-time password (OTP) email from Supabase auth
 * 4. Handle specific errors like non-existent users
 * 5. Return success or error response
 *
 * Note: The shouldCreateUser: false option ensures that only existing users
 * can use magic link authentication, preventing account enumeration.
 *
 * @param request - The form submission request
 * @returns Validation errors, auth errors, or success confirmation
 */
export async function action({ request }: Route.ActionArgs) {
  // Parse form data from the request
  const formData = await request.formData();
  const { success, data: validData } = magicLinkSchema.safeParse(
    Object.fromEntries(formData),
  );

  // Return validation error if email is invalid
  if (!success) {
    return data({ error: "Invalid email" }, { status: 400 });
  }

  // Create Supabase client
  const [client] = makeServerClient(request);

  // Request magic link email from Supabase
  const { error } = await client.auth.signInWithOtp({
    email: validData.email,
    options: {
      // Only allow existing users to sign in with magic link
      shouldCreateUser: false,
    },
  });

  // Handle specific errors
  if (error) {
    // Handle case where user doesn't exist
    if (error.code === "otp_disabled") {
      return data(
        { error: "Create an account before signing in." },
        { status: 400 },
      );
    }
    // Handle other errors
    return data({ error: error.message }, { status: 400 });
  }

  // Return success response
  return {
    success: true,
  };
}

/**
 * Magic Link Authentication Component
 *
 * This component renders the form for requesting a magic link for passwordless login.
 * It includes:
 * - Email input field with validation
 * - Submit button for requesting the magic link
 * - Error display for validation and server errors
 * - Success confirmation message after sending the magic link
 *
 * @param actionData - Data returned from the form action, including errors or success status
 */
export default function MagicLink({ actionData }: Route.ComponentProps) {
  // Reference to the form element for resetting after successful submission
  const formRef = useRef<HTMLFormElement>(null);
  
  // Reset the form when the magic link is successfully sent
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
            Enter your email
          </CardTitle>
          <CardDescription className="text-center text-base">
            We&apos;ll send you a verification code.
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
            </div>
            <FormButton label="Send magic link" className="w-full" />
            {actionData && "error" in actionData && actionData.error ? (
              <FormErrors errors={[actionData.error]} />
            ) : null}
            {actionData && "success" in actionData && actionData.success ? (
              <FormSuccess message="Check your email and click the magic link to continue. You can close this tab." />
            ) : null}
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
