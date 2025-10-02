/**
 * Email Confirmation Screen
 *
 * This component handles the verification of various email-related actions:
 * - Email verification for new accounts
 * - Password recovery confirmation
 * - Email change confirmation
 *
 * When users click on links in verification emails sent by Supabase, they are
 * directed to this page with a token hash and type parameter. This component
 * verifies the token with Supabase and completes the respective action.
 *
 * This is a critical security component that ensures email ownership before
 * completing sensitive account actions.
 */
import type { Route } from "./+types/confirm";

import { data, redirect } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Meta function for the confirmation page
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
 * Schema for validating URL parameters in the confirmation link
 *
 * The schema validates three key parameters:
 * - token_hash: The verification token provided by Supabase
 * - type: The type of confirmation (email verification, password recovery, or email change)
 * - next: The URL to redirect to after successful confirmation (defaults to home page)
 */
const searchParamsSchema = z.object({
  token_hash: z.string(),
  type: z.enum(["email", "recovery", "email_change"]),
  next: z.string().default("/"),
});

/**
 * Loader function for the confirmation page
 *
 * This function processes the verification token and completes the respective action:
 * 1. Validates the token hash, type, and next URL from query parameters
 * 2. Verifies the token with Supabase authentication
 * 3. For email change confirmations, redirects with a success message
 * 4. For other confirmations, redirects to the specified next URL
 *
 * The function handles three types of confirmations:
 * - email: Email verification for new accounts
 * - recovery: Password recovery confirmation
 * - email_change: Email change confirmation
 *
 * @param request - The incoming request with confirmation parameters
 * @returns Redirect to next URL with auth cookies or error response
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Extract query parameters from the URL
  const { searchParams } = new URL(request.url);

  // Validate the confirmation parameters
  const { success, data: validData } = searchParamsSchema.safeParse(
    Object.fromEntries(searchParams),
  );

  // Return error if parameters are invalid
  if (!success) {
    return data({ error: "Invalid confirmation code" }, { status: 400 });
  }

  // Create Supabase client and get response headers for auth cookies
  const [client, headers] = makeServerClient(request);

  // Verify the token with Supabase
  const { error, data: verifyOtpData } = await client.auth.verifyOtp({
    ...validData,
  });

  // Return error if verification fails
  if (error) {
    return data({ error: error.message }, { status: 400 });
  }

  // Special handling for email change confirmations
  if (validData.type === "email_change") {
    return redirect(
      // @ts-ignore - Supabase returns a message in the user object for email changes
      `${validData.next}?message=${encodeURIComponent(verifyOtpData.user.msg ?? "Your email has been updated")}`,
      { headers },
    );
  }

  // Redirect to the next URL with auth cookies in headers
  return redirect(validData.next, { headers });
}

/**
 * Email Confirmation Component
 *
 * This component is only rendered if there's an error during the confirmation process.
 * Under normal circumstances, the loader function will redirect the user directly to
 * the next URL after successful confirmation before this component is rendered.
 *
 * If there's an error (e.g., expired token, invalid token, already confirmed),
 * this component displays the error message to inform the user about the failure.
 *
 * @param loaderData - Data from the loader containing any error messages
 */
export default function Confirm({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5">
      {/* Display error heading */}
      <h1 className="text-2xl font-semibold">Confirmation failed</h1>
      {/* Display specific error message from Supabase */}
      <p className="text-muted-foreground">{loaderData.error}</p>
    </div>
  );
}
