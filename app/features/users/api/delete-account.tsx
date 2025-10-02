/**
 * Delete Account API Endpoint
 *
 * This file implements an API endpoint for completely deleting a user's account.
 * It handles authentication checks, user deletion from Supabase Auth, and cleanup
 * of associated storage resources.
 *
 * Key features:
 * - Request method validation (DELETE only)
 * - Authentication protection
 * - Complete user deletion from Supabase Auth
 * - Cleanup of user avatar from storage
 * - Redirection to home page after successful deletion
 * - Error handling for API errors
 */
import type { Route } from "./+types/delete-account";

import { data, redirect } from "react-router";

import { requireAuthentication, requireMethod } from "~/core/lib/guards.server";
import adminClient from "~/core/lib/supa-admin-client.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Action handler for processing account deletion requests
 *
 * This function handles the complete account deletion flow:
 * 1. Validates that the request method is DELETE
 * 2. Authenticates the user making the request
 * 3. Deletes the user from Supabase Auth
 * 4. Attempts to clean up the user's avatar from storage
 * 5. Redirects to the home page or returns error response
 *
 * Security considerations:
 * - Requires DELETE method to prevent unintended account deletions
 * - Requires authentication to protect user accounts
 * - Uses admin client for user deletion (elevated permissions)
 * - Handles errors gracefully with appropriate status codes
 * - Performs cleanup of associated resources
 *
 * Note: This is a destructive operation that permanently removes the user's
 * account and associated data. It cannot be undone.
 *
 * @param request - The incoming HTTP request
 * @returns Redirect to home page or error response
 */
export async function action({ request }: Route.ActionArgs) {
  // Validate request method (only allow DELETE)
  requireMethod("DELETE")(request);

  // Create a server-side Supabase client with the user's session
  const [client] = makeServerClient(request);

  // Verify the user is authenticated
  await requireAuthentication(client);

  // Get the authenticated user's information
  const {
    data: { user },
  } = await client.auth.getUser();

  // Delete the user from Supabase Auth
  const { error } = await adminClient.auth.admin.deleteUser(user!.id);

  // Handle API errors
  if (error) {
    return data(
      {
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }

  // Clean up user's avatar from storage
  // Note: We don't fail the request if this cleanup fails
  try {
    await adminClient.storage.from("avatars").remove([user!.id]);
  } catch (error) {
    // We don't really care if this fails, as the main user deletion succeeded
    // This is just cleanup of associated resources
  }

  // Redirect to home page after successful deletion
  return redirect("/");
}
