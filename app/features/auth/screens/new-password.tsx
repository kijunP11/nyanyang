/**
 * New Password Screen Component
 *
 * This component handles the second step of the password reset flow:
 * allowing users to create a new password after clicking a reset link.
 * 
 * The component includes:
 * - Password and confirmation input fields with validation
 * - Form submission handling
 * - Success confirmation after updating password
 * - Error handling for validation issues or server errors
 */
import type { Route } from "./+types/new-password";

import { CheckCircle2Icon } from "lucide-react";
import { useEffect, useRef } from "react";
import { redirect } from "react-router";
import { Form, data, useLoaderData } from "react-router";
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
 * Meta function for the new password page
 *
 * Sets the page title using the application name from environment variables
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Update password | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Form validation schema for password update
 *
 * Uses Zod to validate:
 * - Password: Must be at least 8 characters long
 * - Confirm Password: Must match the password field
 *
 * The schema includes a custom refinement to ensure passwords match
 */
const updatePasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

/**
 * Server action for handling password update form submission
 *
 * This function processes the form data and attempts to update the user's password.
 * The flow is:
 * 1. Verify the user is authenticated (has clicked the reset link)
 * 2. Parse and validate the new password using the schema
 * 3. Return validation errors if the data is invalid
 * 4. Update the user's password with Supabase auth
 * 5. Return success or error response
 *
 * @param request - The form submission request
 * @returns Validation errors, auth errors, or success confirmation
 */
export async function action({ request }: Route.ActionArgs) {
  // Create Supabase client and get the current user
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  
  // Redirect to forgot password page if user is not authenticated
  // This prevents direct access to this page without a valid reset link
  if (!user) {
    return redirect("/auth/forgot-password");
  }
  
  // Parse and validate form data
  const formData = await request.formData();
  const {
    success,
    data: validData,
    error,
  } = updatePasswordSchema.safeParse(Object.fromEntries(formData));
  
  // Return validation errors if passwords are invalid
  if (!success) {
    return data({ fieldErrors: error.flatten().fieldErrors }, { status: 400 });
  }
  
  // Update the user's password with Supabase
  const { error: updateError } = await client.auth.updateUser({
    password: validData.password,
  });
  
  // Return error if password update fails
  if (updateError) {
    return data({ error: updateError.message }, { status: 400 });
  }
  
  // Return success response
  return {
    success: true,
  };
}

/**
 * Password Update Component
 *
 * This component renders the form for creating a new password after a reset.
 * It includes:
 * - Password input field with validation
 * - Password confirmation field with matching validation
 * - Submit button for updating the password
 * - Error display for validation and server errors
 * - Success confirmation message after updating the password
 *
 * @param actionData - Data returned from the form action, including errors or success status
 */
export default function ChangePassword({ actionData }: Route.ComponentProps) {
  // Reference to the form element for resetting after successful submission
  const formRef = useRef<HTMLFormElement>(null);
  
  // Reset and blur the form when the password is successfully updated
  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success) {
      formRef.current?.reset();
      formRef.current?.blur();
      // Blur all input fields for better UX and security
      formRef.current?.querySelectorAll("input")?.forEach((input) => {
        input.blur();
      });
    }
  }, [actionData]);
  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold">
            Update your password
          </CardTitle>
          <CardDescription className="text-center text-base">
            Enter your new password and confirm it.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Form
            className="flex w-full flex-col gap-4"
            method="post"
            ref={formRef}
          >
            <div className="flex flex-col items-start space-y-2">
              <Label htmlFor="name" className="flex flex-col items-start gap-1">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                required
                type="password"
                placeholder="Enter your new password"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors.password ? (
                <FormErrors errors={actionData.fieldErrors.password} />
              ) : null}
            </div>
            <div className="flex flex-col items-start space-y-2">
              <Label htmlFor="name" className="flex flex-col items-start gap-1">
                Confirm password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                required
                type="password"
                placeholder="Confirm your new password"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors.confirmPassword ? (
                <FormErrors errors={actionData.fieldErrors.confirmPassword} />
              ) : null}
            </div>
            <FormButton label="Update password" />
            {actionData && "error" in actionData && actionData.error ? (
              <FormErrors errors={[actionData.error]} />
            ) : null}
            {actionData && "success" in actionData && actionData.success ? (
              <div className="flex items-center justify-center gap-2 text-sm text-green-500">
                <CheckCircle2Icon className="size-4" />
                <p>Password updated successfully.</p>
              </div>
            ) : null}
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
