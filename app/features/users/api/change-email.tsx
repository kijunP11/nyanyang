/**
 * Change Email API Endpoint
 *
 * This file implements an API endpoint for changing a user's email address.
 * It handles form validation, authentication checks, and email update requests
 * to the Supabase Auth API.
 *
 * Key features:
 * - Request method validation (POST only)
 * - Authentication protection
 * - Email validation with Zod schema
 * - Integration with Supabase Auth API for email updates
 * - Error handling for invalid inputs and API errors
 */

import type { Route } from "./+types/change-email";

import { data } from "react-router";
import { z } from "zod";

import { requireAuthentication, requireMethod } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Validation schema for email change form data
 *
 * This schema defines the required fields and validation rules:
 * - email: Required, must be a valid email format
 *
 * The schema is used with Zod's safeParse method to validate form submissions
 * before processing them further.
 */
const schema = z.object({
  email: z.string().email(),
});

/**
 * Action handler for processing email change requests
 *
 * This function handles the complete email change flow:
 * 1. Validates that the request method is POST
 * 2. Authenticates the user making the request
 * 3. Validates the new email address format
 * 4. Submits the email change request to Supabase Auth API
 * 5. Returns appropriate success or error responses
 *
 * Security considerations:
 * - Requires POST method to prevent unintended changes
 * - Requires authentication to protect user data
 * - Validates email format before submission
 * - Handles errors gracefully with appropriate status codes
 *
 * Note: When the email is changed, Supabase will send a confirmation email
 * to the new address. The user must confirm this email before the change takes effect.
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
  const { success, data: validData } = schema.safeParse(
    Object.fromEntries(formData),
  );
  
  // Return error if email validation fails
  if (!success) {
    return data({ error: "Invalid email" }, { status: 400 });
  }
  
  // Submit email change request to Supabase Auth API
  const { error } = await client.auth.updateUser({
    email: validData.email,
  });

  // Handle API errors
  if (error) {
    return data({ error: error.message }, { status: 400 });
  }

  // Return success response
  // Note: At this point, the user will receive a confirmation email
  // and must verify the new address before the change takes effect
  return {
    success: true,
  };
}
