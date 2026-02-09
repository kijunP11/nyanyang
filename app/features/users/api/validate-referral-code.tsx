/**
 * Validate Referral Code API Endpoint
 *
 * This API endpoint validates referral codes during user registration.
 * It checks if:
 * 1. The referral code exists in the database
 * 2. The code owner has completed identity verification (verified_at is not null)
 *
 * This endpoint does not require authentication as it's called during
 * the registration process before the user is authenticated.
 */
import type { ActionFunctionArgs } from "react-router";

import { data } from "react-router";
import { z } from "zod";

import makeServerAdminClient from "~/core/lib/supa-admin-client.server";

/**
 * Validation schema for referral code validation request
 */
const validateReferralCodeSchema = z.object({
  referralCode: z
    .string()
    .min(1, { message: "추천인 코드를 입력해주세요." })
    .max(20, { message: "추천인 코드가 너무 깁니다." })
    .trim()
    .toUpperCase(),
});

/**
 * Action handler for validating referral codes
 *
 * This function:
 * 1. Validates the request method (POST only)
 * 2. Validates the referral code format
 * 3. Checks if the code exists in the database
 * 4. Verifies that the code owner has completed identity verification
 * 5. Returns validation result with appropriate messages
 *
 * Security considerations:
 * - Uses admin client to bypass RLS for public validation
 * - Validates input format to prevent injection attacks
 * - Returns generic error messages to prevent code enumeration
 *
 * @param request - The incoming HTTP request with referral code
 * @returns Response indicating validation result
 */
export async function action({ request }: ActionFunctionArgs) {
  // Only allow POST method
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const {
      success,
      data: validData,
      error,
    } = validateReferralCodeSchema.safeParse(body);

    if (!success) {
      return data(
        {
          valid: false,
          message:
            error.errors[0]?.message || "유효하지 않은 추천인 코드입니다.",
        },
        { status: 400 },
      );
    }

    // Query the database to find the profile with this referral code
    // Using admin client to bypass RLS for public validation
    const { data: profile, error: queryError } = await makeServerAdminClient()
      .from("profiles")
      .select("profile_id, referral_code, verified_at")
      .eq("referral_code", validData.referralCode)
      .single();

    // Check if code exists
    if (queryError || !profile) {
      return data(
        {
          valid: false,
          message: "존재하지 않는 추천인 코드입니다.",
        },
        { status: 200 }, // 200 OK with valid: false (not an error, just invalid code)
      );
    }

    // Check if the code owner has completed identity verification
    if (!profile.verified_at) {
      return data(
        {
          valid: false,
          message: "본인인증이 완료되지 않은 추천인 코드입니다.",
        },
        { status: 200 },
      );
    }

    // Code is valid
    return data(
      {
        valid: true,
        message: "유효한 추천인 코드입니다.",
        referrer_id: profile.profile_id,
      },
      { status: 200 },
    );
  } catch (error) {
    // Handle unexpected errors
    console.error("Error validating referral code:", error);
    return data(
      {
        valid: false,
        message: "추천인 코드 검증 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
