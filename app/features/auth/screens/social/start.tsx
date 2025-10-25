});

/**
 * Loader function for the social authentication start page
 *
 * This function initiates the OAuth flow with the specified provider:
 * 1. Validates the provider parameter from the URL
 * 2. Initializes the OAuth flow with Supabase
 * 3. Sets up the redirect URL for when authentication is complete
 * 4. Redirects the user to the provider's authentication page
 *
 * @param params - URL parameters containing the provider name
 * @param request - The incoming request
 * @returns Redirect to the provider's auth page or error response
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  // Validate the provider parameter
  const { error, success, data: parsedParams } = paramsSchema.safeParse(params);
  if (!success) {
    return data({ error: "Invalid provider" }, { status: 400 });
  }

  // Create Supabase client and get response headers for auth cookies
  const [client, headers] = makeServerClient(request);

  // Initialize OAuth flow with the specified provider
  const { data: signInData, error: signInError } =
    await client.auth.signInWithOAuth({
      provider: parsedParams.provider,
      options: {
        // Set the callback URL for when authentication is complete
        redirectTo: `${process.env.SITE_URL}/auth/social/complete/${parsedParams.provider}`,
      },
    });

  // Return error if OAuth initialization fails
  if (signInError) {
    return data({ error: signInError.message }, { status: 400 });
  }

  // Redirect to the provider's authentication page with auth headers
  return redirect(signInData.url, { headers });
}

/**
 * Social Authentication Start Component
 *
 * This component is only rendered if there's an error during the OAuth initialization.
 * Under normal circumstances, the loader function will redirect the user directly to
 * the authentication provider's login page before this component is rendered.
 *
 * If there's an error (e.g., invalid provider, network issues), this component
 * displays the error message and prompts the user to try again.
 *
 * @param loaderData - Data from the loader containing any error messages
 */
export default function StartSocialLogin({ loaderData }: Route.ComponentProps) {
  // Extract error from loader data
  const { error } = loaderData;

  return (
    <div className="flex flex-col items-center justify-center gap-2.5">
      {/* Display error message */}
      <h1 className="text-2xl font-semibold">{error}</h1>
      <p className="text-muted-foreground">Please try again.</p>
    </div>
  );
}