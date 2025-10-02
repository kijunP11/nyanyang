/**
 * Supabase Client Server Module
 *
 * This module provides a function to create a Supabase client for server-side operations
 * with proper cookie handling for authentication. It's a critical part of the authentication
 * system, allowing server components to interact with Supabase while maintaining user sessions.
 *
 * The module handles:
 * - Creating a Supabase client with environment variables
 * - Setting up cookie-based authentication
 * - Properly managing Set-Cookie headers for authentication responses
 * - Type safety with the Database type
 *
 * This is used throughout the application for server-side data fetching, authentication,
 * and other Supabase operations that need to run on the server.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";

/**
 * Creates a Supabase client for server-side operations with proper cookie handling
 * 
 * This function creates a Supabase client that can be used in server-side code (loaders, actions)
 * while properly handling authentication cookies. It returns both the client and headers that
 * need to be included in the response to maintain the authentication state.
 * 
 * The function:
 * 1. Creates a new Headers object to collect Set-Cookie headers
 * 2. Creates a Supabase client with environment variables
 * 3. Sets up cookie handlers to read cookies from the request and write cookies to the response
 * 4. Returns both the client and headers for use in server functions
 * 
 * @example
 * // In a loader or action function
 * export async function loader({ request }: LoaderArgs) {
 *   const [client, headers] = makeServerClient(request);
 *   const { data } = await client.from('table').select();
 *   return json({ data }, { headers });
 * }
 * 
 * @param request - The incoming request object containing cookies
 * @returns A tuple with the Supabase client and headers for the response
 */
export default function makeServerClient(
  request: Request,
): [SupabaseClient<Database>, Headers] {
  // Create headers object to collect Set-Cookie headers
  const headers = new Headers();

  // Create Supabase client with cookie handling
  const client = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        // @ts-ignore - The type definitions don't match exactly but this works
        getAll() {
          // Parse cookies from the request headers
          return parseCookieHeader(request.headers.get("Cookie") ?? "");
        },
        setAll(cookiesToSet) {
          // Add Set-Cookie headers to the response headers
          cookiesToSet.forEach(({ name, value, options }) =>
            headers.append(
              "Set-Cookie",
              serializeCookieHeader(name, value, options),
            ),
          );
        },
      },
    },
  );

  // Return both the client and headers
  return [client, headers];
}
