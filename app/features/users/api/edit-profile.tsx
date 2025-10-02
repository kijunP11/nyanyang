/**
 * Edit Profile API Endpoint
 *
 * This file implements an API endpoint for updating a user's profile information.
 * It handles form data processing, validation, avatar image uploads, and database updates.
 *
 * Key features:
 * - Form data validation with Zod schema
 * - File upload handling for avatar images
 * - Storage management with Supabase Storage
 * - Profile data updates in both auth and profiles tables
 * - Comprehensive error handling
 */

import type { Route } from "./+types/edit-profile";

import { data } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

import { getUserProfile } from "../queries";

/**
 * Validation schema for profile update form data
 *
 * This schema defines the required fields and validation rules:
 * - name: Required, must be at least 1 character
 * - avatar: Must be a File instance (for avatar image uploads)
 * - marketingConsent: Boolean flag for marketing communications consent
 *
 * The schema is used with Zod's safeParse method to validate form submissions
 * before processing them further.
 */
const schema = z.object({
  name: z.string().min(1),
  avatar: z.instanceof(File),
  marketingConsent: z.coerce.boolean(),
});

/**
 * Action handler for processing profile update requests
 *
 * This function handles the complete profile update flow:
 * 1. Validates the request method and authentication status
 * 2. Processes and validates form data using the Zod schema
 * 3. Handles avatar image uploads to Supabase Storage
 * 4. Updates profile information in both auth and profiles tables
 * 5. Returns appropriate success or error responses
 *
 * Security considerations:
 * - Validates authentication status before processing
 * - Validates file size and type for avatar uploads
 * - Uses user ID from authenticated session for database operations
 * - Handles errors gracefully with appropriate status codes
 *
 * @param request - The incoming HTTP request with form data
 * @returns Response indicating success or error with appropriate details
 */
export async function action({ request }: Route.ActionArgs) {
  // Create a server-side Supabase client with the user's session
  const [client] = makeServerClient(request);
  
  // Get the authenticated user's information
  const {
    data: { user },
  } = await client.auth.getUser();

  // Validate request method (only allow POST)
  if (request.method !== "POST") {
    return data(null, { status: 405 }); // Method Not Allowed
  }
  
  // Ensure user is authenticated
  if (!user) {
    return data(null, { status: 401 }); // Unauthorized
  }
  
  // Extract and validate form data
  const formData = await request.formData();
  const {
    success,
    data: validData,
    error,
  } = schema.safeParse(Object.fromEntries(formData));
  
  // Return validation errors if any
  if (!success) {
    return data({ fieldErrors: error.flatten().fieldErrors }, { status: 400 });
  }
  
  // Get current user profile to determine existing avatar URL
  const profile = await getUserProfile(client, { userId: user.id });
  let avatarUrl = profile?.avatar_url || null;
  
  // Handle avatar image upload if a valid file was provided
  if (
    validData.avatar &&
    validData.avatar instanceof File &&
    validData.avatar.size > 0 &&
    validData.avatar.size < 1024 * 1024 && // 1MB size limit
    validData.avatar.type.startsWith("image/") // Ensure it's an image file
  ) {
    // Upload avatar to Supabase Storage
    const { error: uploadError } = await client.storage
      .from("avatars")
      .upload(user.id, validData.avatar, {
        upsert: true, // Replace existing avatar if any
      });
      
    // Handle upload errors
    if (uploadError) {
      return data({ error: uploadError.message }, { status: 400 });
    }
    
    // Get public URL for the uploaded avatar
    const {
      data: { publicUrl },
    } = await client.storage.from("avatars").getPublicUrl(user.id);
    avatarUrl = publicUrl;
  }
  
  // Update profile information in the profiles table
  const { error: updateProfileError } = await client
    .from("profiles")
    .update({
      name: validData.name,
      marketing_consent: validData.marketingConsent,
      avatar_url: avatarUrl,
    })
    .eq("profile_id", user.id);
    
  // Update user metadata in the auth table
  const { error: updateError } = await client.auth.updateUser({
    data: {
      name: validData.name,
      display_name: validData.name,
      marketing_consent: validData.marketingConsent,
      avatar_url: avatarUrl,
    },
  });
  
  // Handle auth update errors
  if (updateError) {
    return data({ error: updateError.message }, { status: 400 });
  }
  
  // Handle profile update errors
  if (updateProfileError) {
    return data({ error: updateProfileError.message }, { status: 400 });
  }

  // Return success response
  return {
    success: true,
  };
}
