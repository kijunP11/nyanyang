/**
 * Naver OAuth Authentication Initiation Endpoint
 *
 * This module handles the first step of the Naver OAuth 2.0 authentication flow.
 * It redirects users to Naver's authorization page where they can grant permission
 * for the application to access their Naver account information.
 *
 * OAuth Flow:
 * 1. User clicks "Login with Naver" button
 * 2. This endpoint generates a random state parameter for CSRF protection
 * 3. User is redirected to Naver's authorization page
 * 4. After authorization, Naver redirects back to /auth/naver/callback with a code
 *
 * Security considerations:
 * - Uses a random UUID as the state parameter to prevent CSRF attacks
 * - Client ID is stored as an environment variable
 * - Redirect URI must be whitelisted in Naver Developer Console
 *
 * @see https://developers.naver.com/docs/login/api/api.md
 */
import type { Route } from "./+types/naver";

import { redirect } from "react-router";

/**
 * Initiates the Naver OAuth authentication flow
 *
 * This loader function constructs the Naver OAuth authorization URL and redirects
 * the user to Naver's login page. It generates a unique state parameter for CSRF
 * protection and includes all required OAuth parameters.
 *
 * The authorization URL includes:
 * - response_type: Set to "code" for authorization code flow
 * - client_id: Application's Naver client ID from environment variables
 * - redirect_uri: Callback URL where Naver will send the authorization code
 * - state: Random UUID for CSRF protection
 *
 * Security considerations:
 * - The state parameter helps prevent cross-site request forgery attacks
 * - The redirect_uri must be registered in Naver Developer Console
 * - Client credentials are never exposed to the client
 *
 * @param request - The incoming HTTP request object
 * @returns A redirect response to Naver's OAuth authorization page
 *
 * @throws Will fail if NAVER_CLIENT_ID environment variable is not set
 *
 * @example
 * // User visits /auth/naver
 * // Redirected to: https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=...&redirect_uri=.../callback&state=...
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Generate a random state parameter for CSRF protection
  const state = crypto.randomUUID();
  const naverClientId = process.env.NAVER_CLIENT_ID;

  // Construct OAuth authorization parameters
  const params = new URLSearchParams({
    response_type: "code",
    client_id: naverClientId!,
    redirect_uri: `${import.meta.env.VITE_SITE_URL}/auth/naver/callback`,
    state: state,
  });

  // Build the full Naver OAuth authorization URL
  const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?${params}`;

  // Redirect user to Naver's login/authorization page
  return redirect(naverAuthUrl);
}
