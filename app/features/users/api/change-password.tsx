/**
 * Change Password API Endpoint
 *
 * This file implements an API endpoint for changing a user's password.
 * It handles form validation, password matching, authentication checks,
 * and password update requests to the Supabase Auth API.
 *
 * Key features:
 * - Request method validation (POST only)
 * - Authentication protection
 * - Password validation with Zod schema
 * - Password confirmation matching
 * - Integration with Supabase Auth API for password updates
 * - Detailed error handling for validation and API errors
 */

import type { Route } from "./+types/change-password";

import { data } from "react-router";
import { z } from "zod";

import { requireAuthentication, requireMethod } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Validation schema for password change form data
 *
 * This schema defines the required fields and validation rules:
 * - password: Required, must be at least 8 characters
 * - confirmPassword: Required, must be at least 8 characters
 *
 * Additionally, it includes a refinement to ensure both passwords match,
 * with a specific error message and path for the validation error.
 *
 * The schema is used with Zod's safeParse method to validate form submissions
 * before processing them further.
 */
const changePasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

/**
 * Action handler for processing password change requests
 *
 * This function handles the complete password change flow:
 * 1. Validates that the request method is POST
 * 2. Authenticates the user making the request
 * 3. Validates the new password format and confirmation match
 * 4. Submits the password change request to Supabase Auth API
 * 5. Returns appropriate success or error responses
 *
 * Security considerations:
 * - Requires POST method to prevent unintended changes
 * - Requires authentication to protect user data
 * - Validates password length and confirmation match
 * - Returns field-specific validation errors
 * - Handles API errors gracefully with appropriate status codes
 *
 * @param request - The incoming HTTP request with form data
 * @returns Response indicating success or error with appropriate details
 */
export async function action({ request }: Route.ActionArgs) {
  // Validate request method (only allow POST)
  requireMethod("POST")(request);
  
  // Create a server-side Supabase client with the user's session
  const [client] = makeServerClient(request);
  
  // Verify the user is authenticated
  await requireAuthentication(client);
  
  // Extract and validate form data
  const formData = await request.formData();
  const {
    success,
    data: validData,
    error,
  } = changePasswordSchema.safeParse(Object.fromEntries(formData));
  
  // Return field-specific validation errors if validation fails
  if (!success) {
    return data({ fieldErrors: error.flatten().fieldErrors }, { status: 400 });
  }
  
  // Submit password change request to Supabase Auth API
  const { error: updateError } = await client.auth.updateUser({
    password: validData.password,
  });

  // Handle API errors
  if (updateError) {
    return data({ error: updateError.message }, { status: 400 });
  }
  
  // Return success response
  return {
    success: true,
  };
}
