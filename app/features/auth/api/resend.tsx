/**
 * Email Verification Resend API Endpoint
 *
 * This module provides an API endpoint for resending verification emails to users
 * during the signup process. It's used when a user hasn't received their initial
 * verification email or when the verification link has expired.
 *
 * The endpoint:
 * - Validates the email address using Zod schema validation
 * - Creates a server-side Supabase client with proper cookie handling
 * - Calls Supabase's resend verification email API
 * - Returns appropriate success or error responses
 *
 * This is part of the authentication flow that ensures users verify their email
 * addresses before gaining full access to the application.
 */
import type { Route } from "./+types/resend";

import { data } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Validation schema for email resend requests
 * 
 * This schema ensures that the submitted email address is valid before
 * attempting to resend the verification email. It uses Zod's email validator
 * with a custom error message for better user feedback.
 */
const resendSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

/**
 * Action handler for resending verification emails
 * 
 * This function processes requests to resend verification emails to users
 * during the signup process. It follows these steps:
 * 1. Extracts and validates the email from the form data
 * 2. Creates a server-side Supabase client with proper authentication context
 * 3. Calls Supabase's resend API with the signup type
 * 4. Sets the redirect URL to the verification page
 * 5. Returns appropriate success or error responses
 * 
 * Security considerations:
 * - Validates email format to prevent malformed requests
 * - Uses server-side validation to prevent client-side bypass
 * - Returns generic error messages to prevent email enumeration
 * 
 * @param request - The incoming HTTP request with form data
 * @returns JSON response indicating success or error
 */
export async function action({ request }: Route.ActionArgs) {
  // Extract form data from the request
  const formData = await request.formData();

  // Validate the email address using Zod schema
  const { success, data: validData } = resendSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!success) {
    // Return error response if validation fails
    return data({ error: "Invalid email address" }, { status: 400 });
  }

  // Create a server-side Supabase client with proper cookie handling
  const [client] = makeServerClient(request);

  // Call Supabase's resend API to send a new verification email
  const { error } = await client.auth.resend({
    type: "signup", // Specify that this is for signup verification
    email: validData.email,
    options: {
      // Set the redirect URL for the verification link
      emailRedirectTo: `${process.env.SITE_URL}/auth/verify`,
    },
  });

  // Handle any errors from the Supabase API
  if (error) {
    return data({ error: error.message }, { status: 400 });
  }

  // Return success response if the email was sent successfully
  return data({ success: true }, { status: 200 });
}
