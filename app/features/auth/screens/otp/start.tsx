/**
 * One-Time Password (OTP) Authentication Start Screen
 *
 * This component handles the first step of the OTP authentication flow:
 * allowing users to enter their email to receive a verification code.
 *
 * The OTP flow consists of two steps:
 * 1. This screen: User enters email to receive a verification code
 * 2. Complete screen: User enters the received code to authenticate
 *
 * This implementation uses Supabase's OTP authentication system.
 */
import type { Route } from "./+types/start";

import { Form, data, redirect } from "react-router";
import { z } from "zod";

import FormButton from "~/core/components/form-button";
import FormErrors from "~/core/components/form-error";
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
 * Meta function for the OTP start page
 *
 * Sets the page title using the application name from environment variables
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `OTP Login | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Form validation schema for OTP start
 *
 * Uses Zod to validate the email field to ensure it's a valid email format
 * before attempting to send a verification code
 */
const otpStartSchema = z.object({
  email: z.string().email(),
});

/**
 * Server action for handling OTP start form submission
 *
 * This function processes the form data and attempts to send an OTP verification code.
 * The flow is:
 * 1. Parse and validate the email using the schema
 * 2. Return validation errors if the email is invalid
 * 3. Request an OTP email from Supabase auth
 * 4. Redirect to the OTP complete page or return an error
 *
 * Note: The shouldCreateUser: false option ensures that only existing users
 * can use OTP authentication, preventing account enumeration.
 *
 * @param request - The form submission request
 * @returns Validation errors, auth errors, or redirect to OTP complete page
 */
export async function action({ request }: Route.ActionArgs) {
  // Parse and validate form data
  const formData = await request.formData();
  const { success, data: validData } = otpStartSchema.safeParse(
    Object.fromEntries(formData),
  );

  // Return validation error if email is invalid
  if (!success) {
    return data({ error: "Invalid email" }, { status: 400 });
  }

  // Create Supabase client
  const [client] = makeServerClient(request);

  // Request OTP email from Supabase
  const { error } = await client.auth.signInWithOtp({
    email: validData.email,
    options: {
      // Only allow existing users to sign in with OTP
      shouldCreateUser: false,
    },
  });

  // Return error if request fails
  if (error) {
    return data({ error: error.message }, { status: 400 });
  }

  // Redirect to OTP complete page with email in query parameter
  return redirect(`/auth/otp/complete?email=${validData.email}`);
}

/**
 * OTP Authentication Start Component
 *
 * This component renders the form for initiating the OTP authentication process.
 * It includes:
 * - Email input field with validation
 * - Submit button for requesting the verification code
 * - Error display for validation and server errors
 *
 * After successful submission, the user is redirected to the OTP complete page
 * where they can enter the verification code received via email.
 *
 * @param actionData - Data returned from the form action, including any errors
 */
export default function OtpStart({ actionData }: Route.ComponentProps) {
  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-md">
        {/* Card header with title and description */}
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold">
            Enter your email
          </CardTitle>
          <CardDescription className="text-center text-base">
            We&apos;ll send you a verification code.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* OTP request form */}
          <Form className="flex w-full flex-col gap-4" method="post">
            {/* Email input field */}
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
            {/* Submit button */}
            <FormButton label="Send verification code" className="w-full" />
            {/* Error message display */}
            {actionData && "error" in actionData && actionData.error ? (
              <FormErrors errors={[actionData.error]} />
            ) : null}
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
