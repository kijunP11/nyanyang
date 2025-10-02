/**
 * One-Time Password (OTP) Authentication Complete Screen
 *
 * This component handles the second step of the OTP authentication flow:
 * allowing users to enter the verification code they received via email.
 *
 * The OTP flow consists of two steps:
 * 1. Start screen: User enters email to receive a verification code
 * 2. This screen: User enters the received code to authenticate
 *
 * This screen uses a specialized OTP input component for a better user experience
 * when entering the 6-digit verification code.
 */
import type { Route } from "./+types/complete";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useRef } from "react";
import { Form, data, redirect, useSubmit } from "react-router";
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
import { InputOTPSeparator } from "~/core/components/ui/input-otp";
import { InputOTPGroup } from "~/core/components/ui/input-otp";
import { InputOTPSlot } from "~/core/components/ui/input-otp";
import { InputOTP } from "~/core/components/ui/input-otp";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Meta function for the OTP complete page
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
 * Schema for validating URL parameters
 *
 * Ensures that a valid email is provided in the URL query parameters
 * This email is passed from the OTP start page
 */
const paramsSchema = z.object({
  email: z.string().email(),
});

/**
 * Loader function for the OTP complete page
 *
 * This function validates the email parameter in the URL and makes it available to the component.
 * If the email is missing or invalid, the user is redirected back to the OTP start page.
 *
 * @param request - The incoming request with URL parameters
 * @returns The validated email or redirects to the start page
 */
export function loader({ request }: Route.LoaderArgs) {
  // Extract and validate the email from URL query parameters
  const url = new URL(request.url);
  const { success, data: validData } = paramsSchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  
  // Redirect to start page if email is missing or invalid
  if (!success) {
    return redirect("/auth/otp/start");
  }
  
  // Return the validated email to the component
  return { email: validData.email };
}

/**
 * Server action for handling OTP verification form submission
 *
 * This function processes the form data and attempts to verify the OTP code.
 * The flow is:
 * 1. Validate the email and code using the schema
 * 2. Return validation errors if the data is invalid
 * 3. Verify the OTP code with Supabase auth
 * 4. Redirect to home page with auth cookies or return an error
 *
 * @param request - The form submission request
 * @returns Validation errors, auth errors, or redirect to home page with auth cookies
 */
export async function action({ request }: Route.ActionArgs) {
  // Schema for validating the OTP verification form
  const otpCompleteSchema = z.object({
    email: z.string().email(),
    code: z.string().length(6),
  });

  // Parse and validate form data
  const formData = await request.formData();
  const { success, data: validData } = otpCompleteSchema.safeParse(
    Object.fromEntries(formData),
  );

  // Return validation error if data is invalid
  if (!success) {
    return data(
      { error: "Could not verify code. Please try again." },
      { status: 400 },
    );
  }

  // Create Supabase client and get response headers for auth cookies
  const [client, headers] = makeServerClient(request);

  // Verify the OTP code with Supabase
  const { error } = await client.auth.verifyOtp({
    email: validData.email,
    token: validData.code,
    type: "email",
  });

  // Return error if verification fails
  if (error) {
    return data({ error: error.message }, { status: 400 });
  }

  // Redirect to home page with auth cookies in headers
  return redirect(`/`, { headers });
}

/**
 * OTP Authentication Complete Component
 *
 * This component renders the form for entering the OTP verification code.
 * It includes:
 * - Hidden email field (pre-filled from the loader data)
 * - Specialized OTP input with 6 digit slots
 * - Auto-submission when all digits are entered
 * - Manual submit button as a fallback
 * - Error display for validation and verification errors
 *
 * The component uses a specialized InputOTP component for better UX when
 * entering verification codes, with auto-submission when all digits are entered.
 *
 * @param loaderData - Data from the loader containing the email address
 * @param actionData - Data returned from the form action, including any errors
 */
export default function OtpComplete({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  // Reference to the form element for submission
  const formRef = useRef<HTMLFormElement>(null);
  
  // Hook to programmatically submit the form
  const submit = useSubmit();
  
  // Handler to automatically submit the form when all OTP digits are entered
  const handleComplete = () => {
    submit(formRef.current);
  };
  
  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-md">
        {/* Card header with title and description */}
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold">Confirm code</CardTitle>
          <CardDescription className="text-center text-base">
            Enter the code we sent you.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* OTP verification form */}
          <Form
            className="flex w-full flex-col items-center gap-4"
            method="post"
            ref={formRef}
          >
            {/* Hidden email field pre-filled from loader data */}
            <Input
              id="email"
              name="email"
              hidden
              required
              type="email"
              defaultValue={loaderData.email}
              placeholder="nico@supaplate.com"
            />

            {/* Specialized OTP input component with 6 digit slots */}
            <InputOTP
              name="code"
              required
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS} // Only allow numeric digits
              onComplete={handleComplete} // Auto-submit when all digits are entered
            >
              {/* First group of 3 digits */}
              <InputOTPGroup className="*:p-6 *:text-lg">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              {/* Second group of 3 digits */}
              <InputOTPGroup className="*:p-6 *:text-lg">
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            {/* Manual submit button as fallback */}
            <FormButton label="Submit" className="w-full" />
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
