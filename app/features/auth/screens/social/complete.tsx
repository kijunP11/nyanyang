/**
 * Social Authentication Complete Screen
 *
 * This component handles the callback from third-party OAuth providers after authentication.
 * It processes the authentication code returned by the provider and exchanges it for a session.
 *
 * The social authentication flow consists of two steps:
 * 1. Start screen: Initiates the OAuth flow and redirects to the provider
 * 2. This screen: Handles the callback from the provider and completes the authentication
 *
 * This implementation uses Supabase's OAuth authentication system to exchange the OAuth code
 * for a valid session, creating or updating the user in the Supabase database.
 */
import type { Route } from "./+types/complete";

import { data, redirect } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Meta function for the social authentication complete page
 *
 * Sets the page title using the application name from environment variables
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Confirm | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Schema for validating successful OAuth callback parameters
 *
 * When the OAuth flow is successful, the provider redirects back with a code
 * that can be exchanged for a session
 */
const searchParamsSchema = z.object({
  code: z.string(),
});

/**
 * Schema for validating error parameters from OAuth providers
 *
 * When the OAuth flow fails (e.g., user denies permission), the provider
 * redirects back with error information in standard OAuth error format
 */
const errorSchema = z.object({
  error: z.string(),
  error_code: z.string(),
  error_description: z.string(),
});

/**
 * Loader function for the social authentication complete page
 *
 * This function handles the OAuth callback and completes the authentication process:
 * 1. Extracts and validates the code or error from URL query parameters
 * 2. For successful flows, exchanges the code for a session with Supabase
 * 3. For error flows, extracts and displays the error message
 * 4. Redirects authenticated users to the home page with session cookies
 *
 * @param request - The incoming request with OAuth callback parameters
 * @returns Redirect to home page with auth cookies or error response
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Extract query parameters from the URL
  const { searchParams } = new URL(request.url);
  
  // Try to validate the parameters as a successful OAuth callback
  const { success, data: validData } = searchParamsSchema.safeParse(
    Object.fromEntries(searchParams),
  );
  
  // If not a successful callback, check if it's an error callback
  if (!success) {
    const { data: errorData, success: errorSuccess } = errorSchema.safeParse(
      Object.fromEntries(searchParams),
    );
    
    // If neither a successful nor error callback, return generic error
    if (!errorSuccess) {
      return data({ error: "Invalid code" }, { status: 400 });
    }
    
    // Return the error description from the provider
    return data({ error: errorData.error_description }, { status: 400 });
  }

  // Create Supabase client and get response headers for auth cookies
  const [client, headers] = makeServerClient(request);
  
  // Exchange the OAuth code for a session
  const { error } = await client.auth.exchangeCodeForSession(validData.code);

  // Return error if session exchange fails
  if (error) {
    return data({ error: error.message }, { status: 400 });
  }

  // Redirect to home page with auth cookies in headers
  return redirect("/", { headers });
}

/**
 * Social Authentication Complete Component
 *
 * This component is only rendered if there's an error during the OAuth callback processing.
 * Under normal circumstances, the loader function will redirect the user directly to
 * the home page after successful authentication before this component is rendered.
 *
 * If there's an error (e.g., invalid code, authentication denied by user, network issues),
 * this component displays the error message to inform the user about the failure.
 *
 * @param loaderData - Data from the loader containing any error messages
 */
export default function Confirm({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5">
      {/* Display error heading */}
      <h1 className="text-2xl font-semibold">Login failed</h1>
      {/* Display specific error message from the provider or Supabase */}
      <p className="text-muted-foreground">{loaderData.error}</p>
    </div>
  );
}
