/**
 * Disconnect Provider API Endpoint
 *
 * This file implements an API endpoint for disconnecting a third-party
 * authentication provider (like GitHub or Kakao) from a user's account.
 * It handles provider validation, authentication checks, and integration
 * with Supabase Auth API for identity unlinking.
 *
 * Key features:
 * - Request method validation (DELETE only)
 * - Authentication protection
 * - Provider validation with Zod schema
 * - Identity verification before disconnection
 * - Integration with Supabase Auth API for identity unlinking
 * - Error handling for invalid inputs and API errors
 */

import type { Route } from "./+types/disconnect-provider";

import { data, redirect } from "react-router";
import { z } from "zod";

import { requireAuthentication, requireMethod } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Validation schema for provider disconnection parameters
 *
 * This schema defines the required fields and validation rules:
 * - provider: Must be one of the supported providers (github, kakao)
 *
 * The schema ensures that only supported providers can be disconnected,
 * preventing potential security issues with unsupported providers.
 *
 * @type {z.ZodObject<{provider: z.ZodEnum<["github", "kakao"]>}>}
 */
const schema = z.object({
  provider: z.enum(["github", "kakao"]),
});

/**
 * Action handler for processing provider disconnection requests
 *
 * This function handles the complete provider disconnection flow:
 * 1. Validates that the request method is DELETE
 * 2. Authenticates the user making the request
 * 3. Validates the provider type (github, kakao)
 * 4. Verifies that the user has the specified identity connected
 * 5. Unlinks the identity using Supabase Auth API
 * 6. Returns appropriate success or error responses
 *
 * Security considerations:
 * - Requires DELETE method to prevent unintended disconnections
 * - Requires authentication to protect user accounts
 * - Validates provider type against an allowed list
 * - Verifies identity existence before attempting to unlink
 * - Handles errors gracefully with appropriate status codes
 *
 * @param {Route.ActionArgs} args - The action arguments
 * @param {Request} args.request - The incoming HTTP request
 * @param {object} args.params - The route parameters containing the provider to disconnect
 * @param {string} args.params.provider - The OAuth provider to disconnect (github or kakao)
 * @returns {Promise<{success: boolean} | TypedResponse<{error: string}>>} Success object or error response with status 400
 * @throws {Response} Throws 401 if user is not authenticated
 * @throws {Response} Throws 405 if request method is not DELETE
 *
 * @example
 * // Client-side usage with form submission
 * <form method="post" action="/api/users/disconnect-provider/github">
 *   <input type="hidden" name="_method" value="DELETE" />
 *   <button type="submit">Disconnect GitHub</button>
 * </form>
 *
 * @example
 * // Example successful response
 * { success: true }
 *
 * @example
 * // Example error response (status 400)
 * { error: "Identity not found" }
 *
 * @remarks
 * This endpoint ensures users cannot accidentally disconnect
 * identities they don't have, providing better error messages.
 */
export async function action({ request, params }: Route.ActionArgs) {
  // Validate request method (only allow DELETE)
  requireMethod("DELETE")(request);
  
  // Create a server-side Supabase client with the user's session
  const [client] = makeServerClient(request);
  
  // Verify the user is authenticated
  await requireAuthentication(client);
  
  // Validate the provider parameter
  const { error, success, data: parsedParams } = schema.safeParse(params);
  if (!success) {
    return data({ error: "Invalid provider" }, { status: 400 });
  }
  
  // Fetch the user's current connected identities
  const { data: userIdentities } = await client.auth.getUserIdentities();

  // Find the specific identity to disconnect
  const identity = userIdentities?.identities.find(
    (identity) => identity.provider === parsedParams.provider,
  );
  
  // Return error if the identity is not found
  if (!identity) {
    return data({ error: "Identity not found" }, { status: 400 });
  }
  
  // Unlink the identity using Supabase Auth API
  const { error: unlinkingError } = await client.auth.unlinkIdentity(identity);
  
  // Handle API errors
  if (unlinkingError) {
    return data({ error: unlinkingError.message }, { status: 400 });
  }
  
  // Return success response
  return {
    success: true,
  };
}
