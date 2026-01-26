/**
 * My Characters API Endpoint
 *
 * This file implements an API endpoint for fetching characters created by the authenticated user.
 * Unlike the public list endpoint, this returns ALL characters created by the user regardless of
 * their status (pending, approved, rejected) or public visibility.
 *
 * Key features:
 * - Returns all characters created by the authenticated user
 * - Includes status information (pending, approved, rejected)
 * - Pagination support
 * - Default sort: created_at DESC (newest first)
 */

import type { Route } from "./+types/my";

import { data } from "react-router";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getMyCharacters, myCharactersQuerySchema } from "../lib/queries.server";

/**
 * Loader function for fetching user's own characters
 *
 * @param {Route.LoaderArgs} args - The loader arguments
 * @returns {Promise<Response>} JSON response with character list and pagination metadata
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Create Supabase client and require authentication
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  // Parse and validate query parameters
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams);
  const { success, data: params, error } = myCharactersQuerySchema.safeParse(searchParams);

  if (!success) {
    return data(
      { error: "Invalid query parameters", details: error.flatten().fieldErrors },
      { status: 400, headers }
    );
  }

  try {
    const result = await getMyCharacters(user.id, params);
    return data(result, { headers });
  } catch (err) {
    console.error("Error fetching user characters:", err);
    return data({ error: "Failed to fetch characters" }, { status: 500, headers });
  }
}

