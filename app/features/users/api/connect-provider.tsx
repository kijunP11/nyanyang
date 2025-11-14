/**
 * Connect Provider API Endpoint
 *
 * This file implements an API endpoint for connecting a user's account to a third-party
 * authentication provider (like GitHub or Kakao). It handles provider validation,
 * authentication checks, and integration with Supabase Auth API for identity linking.
 *
 * Key features:
 * - Request method validation (POST only)
 * - Authentication protection
 * - Provider validation with Zod schema
 * - Integration with Supabase Auth API for identity linking
 * - Redirect to provider OAuth flow
 * - Error handling for invalid inputs and API errors
 */

import type { Route } from "./+types/connect-provider";

import { data, redirect } from "react-router";
import { z } from "zod";

import { requireAuthentication, requireMethod } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Validation schema for provider connection form data
 *
 * This schema defines the required fields and validation rules:
 * - provider: Must be one of the supported providers (github, kakao)
 *
 * The schema ensures that only supported providers can be used for account linking,
 * preventing potential security issues with unsupported providers.
 */
const schema = z.object({
  provider: z.enum(["github", "kakao"]),
});

/**
 * Action handler for processing provider connection requests
 *
 * This function handles the complete provider connection flow:
 * 1. Validates that the request method is POST
 * 2. Authenticates the user making the request
 * 3. Validates the provider type (github, kakao)
 * 4. Initiates the identity linking process with Supabase Auth API
 * 5. Redirects to the provider's OAuth flow or returns error responses
 *
 * Security considerations:
 * - Requires POST method to prevent unintended connections
 * - Requires authentication to protect user accounts
 * - Validates provider type against an allowed list
 * - Handles errors gracefully with appropriate status codes
 *
 * Note: There is a known issue with the redirectTo option in Supabase Auth
 * (https://github.com/supabase/auth/issues/1927), which is commented in the code.
 *
 * @param request - The incoming HTTP request with form data
 * @returns Redirect to provider OAuth flow or error response
 */
export async function action({ request }: Route.ActionArgs) {
  // Validate request method (only allow POST)
  requireMethod("POST")(request);
  
  // Create a server-side Supabase client with the user's session
  const [client] = makeServerClient(request);
  
  // Verify the user is authenticated
  await requireAuthentication(client);
  
  // Extract and validate form data
  const form = await request.formData();
  const { success, data: parsedParams } = schema.safeParse(
    Object.fromEntries(form),
  );
  
  // Return error if provider validation fails
  if (!success) {
    return data({ error: "Invalid provider" }, { status: 400 });
  }
  
  // Initiate identity linking process with Supabase Auth API
  const { data: linkingData, error: linkingError } =
    await client.auth.linkIdentity({
      provider: parsedParams.provider,
      options: {
        // Note: There is a known issue with this option
        // See: https://github.com/supabase/auth/issues/1927
        redirectTo: `${process.env.APP_URL}/auth/connect`,
      },
    });
  
  // Handle API errors
  if (linkingError) {
    return data({ error: linkingError.message }, { status: 400 });
  }
  
  // Redirect to provider's OAuth flow
  // The user will be redirected back to the redirectTo URL after authentication
  return redirect(linkingData.url);
}
