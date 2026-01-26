/**
 * Naver OAuth Callback Handler
 *
 * This module handles the OAuth callback from Naver after user authorization.
 * It completes the Naver OAuth 2.0 authentication flow by:
 * 1. Exchanging the authorization code for an access token
 * 2. Fetching user profile information from Naver
 * 3. Creating or logging in the user in Supabase
 *
 * OAuth Flow (Step 2):
 * 1. Naver redirects back to this endpoint with an authorization code
 * 2. Exchange code for access token using client secret
 * 3. Use access token to fetch user profile from Naver API
 * 4. Create synthetic email address for OAuth user (id@naver.oauth)
 * 5. Sign in or sign up the user in Supabase
 * 6. Redirect to home page with authentication cookies
 *
 * Security considerations:
 * - Client secret is only used on the server side (never exposed to client)
 * - State parameter should be validated (currently passed through)
 * - Synthetic email addresses prevent collisions with regular email users
 * - User profile data is stored in Supabase user metadata
 *
 * @see https://developers.naver.com/docs/login/api/api.md
 */
import type { Route } from "./+types/naver-callback";

import { data, redirect } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Type definition for Naver user profile data
 *
 * Represents the user information returned from Naver's /v1/nid/me endpoint.
 * Only includes the fields we use in our application.
 */
interface NaverUser {
  /** Unique Naver user ID */
  id: string;
  /** User's display name (optional) */
  name?: string;
  /** URL to user's profile image (optional) */
  profile_image?: string;
}

/**
 * Handles the OAuth callback from Naver and completes the authentication flow
 *
 * This loader processes the OAuth callback from Naver, exchanges the authorization
 * code for an access token, retrieves the user's profile information, and either
 * creates a new user account or logs in an existing user in Supabase.
 *
 * Authentication flow:
 * 1. Extract authorization code and state from URL parameters
 * 2. Exchange code for access token via Naver token endpoint
 * 3. Use access token to fetch user profile from Naver API
 * 4. Create synthetic email (id@naver.oauth) to uniquely identify OAuth users
 * 5. Attempt to sign in with synthetic credentials
 * 6. If sign in fails, create new user account with profile data
 * 7. Redirect to home page with authentication session
 *
 * Security considerations:
 * - Validates that authorization code is present
 * - Uses client secret only on server side
 * - Synthetic email format prevents collision with regular users
 * - User ID is used as password for OAuth users (they can't login with password)
 * - Profile data stored in Supabase user metadata for future reference
 *
 * @param request - The incoming HTTP request containing OAuth callback parameters
 * @returns Redirect to home page on success, or error data on failure
 *
 * @throws Returns 400 error if authorization code is missing
 * @throws Returns 400 error if token exchange fails
 * @throws Returns 400 error if user info fetch fails
 * @throws Returns 400 error if user creation fails
 *
 * @example
 * // Naver redirects to: /auth/naver/callback?code=ABC123&state=...
 * // This handler:
 * // 1. Exchanges code for token
 * // 2. Fetches user profile
 * // 3. Creates/logs in user with email: user_id@naver.oauth
 * // 4. Redirects to home page
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Parse URL to extract OAuth callback parameters
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // Validate that authorization code was provided
  if (!code) {
    return data({ error: "Authorization code not found" }, { status: 400 });
  }

  // Exchange authorization code for access token
  // This is the OAuth 2.0 token exchange step
  const tokenResponse = await fetch("https://nid.naver.com/oauth2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.NAVER_CLIENT_ID!,
      client_secret: process.env.NAVER_CLIENT_SECRET!,
      code: code,
      state: state || "",
    }),
  });

  const tokenData = await tokenResponse.json();

  // Validate that access token was received
  if (!tokenData.access_token) {
    return data({ error: "Failed to get access token" }, { status: 400 });
  }

  // Fetch user profile information from Naver API
  // Uses the access token to authenticate the request
  const userResponse = await fetch("https://openapi.naver.com/v1/nid/me", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  const userData = await userResponse.json();

  // Validate that user info was received
  if (!userData.response) {
    return data({ error: "Failed to get user info" }, { status: 400 });
  }

  // Extract user profile data from the response
  const naverUser = userData.response as NaverUser;

  // Create Supabase client with proper cookie handling
  const [client, headers] = makeServerClient(request);

  // Attempt to sign in existing OAuth user
  // Uses synthetic email format: user_id@naver.oauth
  // Password is the user's Naver ID (OAuth users don't use this for login)
  const { error } = await client.auth.signInWithPassword({
    email: `${naverUser.id}@naver.oauth`,
    password: naverUser.id,
  });

  // If user doesn't exist, create a new account
  if (error) {
    const { error: signUpError } = await client.auth.signUp({
      email: `${naverUser.id}@naver.oauth`,
      password: naverUser.id,
      options: {
        data: {
          full_name: naverUser.name,
          avatar_url: naverUser.profile_image,
          provider: "naver",
        },
      },
    });

    // Return error if user creation fails
    if (signUpError) {
      return data({ error: signUpError.message }, { status: 400 });
    }
  }

  // Redirect to home page with authentication cookies
  // The headers contain the updated session cookies from Supabase
  return redirect("/", { headers });
}
