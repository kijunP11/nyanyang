/**
 * Edit Profile E2E Tests
 * 
 * This file contains end-to-end tests for the profile editing functionality, including:
 * 1. Name update
 * 2. Marketing consent toggle
 * 3. Avatar image upload and storage
 * 4. Database verification of profile changes
 * 
 * The tests verify that users can update their profile information and that
 * these changes are correctly persisted in the database and reflected in the UI.
 * 
 * The tests use Playwright for browser automation and directly query
 * the database to verify data persistence. They also interact with
 * Supabase storage for avatar image handling.
 */

import { expect, test } from "@playwright/test";
import { eq, sql } from "drizzle-orm";
import {
  checkInvalidField,
  confirmUser,
  deleteUser,
  loginUser,
  registerUser,
} from "e2e/utils/test-helpers";

import db from "~/core/db/drizzle-client.server";
import adminClient from "~/core/lib/supa-admin-client.server";
import { profiles } from "~/features/users/schema";

/**
 * Test email for profile editing flow
 * 
 * This email is used to create a test user for the profile editing tests.
 * It must be set in the environment variables to run these tests.
 * Using an environment variable allows for different test emails in different environments
 * and prevents hardcoding sensitive information in the test files.
 */
const TEST_EMAIL = process.env.EDIT_PROFILE_TEST_USER_EMAIL!;

// Ensure the test email is configured before running tests
if (!TEST_EMAIL) {
  throw new Error("EDIT_PROFILE_TEST_USER_EMAIL must be set in .env");
}

/**
 * Test suite for the profile editing functionality
 * 
 * This suite tests the complete profile editing flow, including
 * updating personal information, toggling preferences, and uploading an avatar.
 */
test.describe("Edit Profile", () => {
  /**
   * User ID variable to store the test user's ID for cleanup
   * This is needed to remove the avatar from storage after tests
   */
  let userId: string;

  /**
   * Setup: Create and confirm a test user before running the test suite
   * 
   * This creates a user account that will be used to test the profile editing features.
   * The user is confirmed to ensure they have full account access.
   */
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await registerUser(page, TEST_EMAIL, "password");
    await confirmUser(page, TEST_EMAIL);
    await context.close();
  });

  /**
   * Cleanup: Delete the test user and their avatar after all tests are complete
   * 
   * This ensures that test data doesn't accumulate in the database or storage.
   * The avatar is explicitly removed from Supabase storage to prevent orphaned files.
   */
  test.afterAll(async () => {
    await deleteUser(TEST_EMAIL);
    await adminClient.storage.from("avatars").remove([userId]);
  });

  /**
   * Comprehensive test for the complete profile editing flow
   * 
   * This test verifies the entire profile editing process including:
   * - Updating the display name
   * - Toggling marketing consent
   * - Uploading an avatar image
   * - Verifying changes in both the UI and database
   */
  test("should update name, consent, avatar and verify in DB", async ({
    page,
  }) => {
    // Define test constants
    const NEW_NAME = "Avatar Updated";
    const IMAGE_PATH = "e2e/assets/avatar-test.jpg";

    // Get the user ID from the database for later verification and cleanup
    const [{ id }] = await db.execute<{ id: string }>(
      sql`SELECT id FROM auth.users WHERE email = ${TEST_EMAIL}`,
    );
    userId = id;

    // Log in with the test user account
    await loginUser(page, TEST_EMAIL, "password");
    // Navigate to the account edit page
    await page.goto("/account/edit");

    /**
     * Step 1: Update all profile fields and submit the form
     * 
     * This step uploads a new avatar image, changes the display name,
     * opts into marketing emails, and submits the form.
     * It then verifies that the success message appears.
     */
    await test.step("submit form with all updated fields", async () => {
      // Upload a test avatar image
      await page.setInputFiles("input#avatar", IMAGE_PATH);
      // Update the display name
      await page.locator("#name").fill(NEW_NAME);
      // Opt into marketing emails
      await page.locator("#marketingConsent").check();
      // Submit the form
      await page.getByRole("button", { name: "Save profile" }).click();
      // Verify the success message appears
      await expect(page.getByText("Profile updated")).toBeVisible();
    });

    /**
     * Step 2: Verify the avatar image is updated in the UI
     * 
     * This step reloads the page and checks that the avatar image
     * is visible and that its source URL points to the Supabase storage.
     * This verifies that the image was successfully uploaded and is being displayed.
     */
    await test.step("verify avatar image preview is updated", async () => {
      // Reload the page to ensure we're seeing the latest data
      await page.reload();
      // Locate the avatar image element
      const avatarImage = page.locator("img[alt='Avatar']");
      // Verify the image is visible
      await expect(avatarImage).toBeVisible();
      // Get the image source URL
      const src = await avatarImage.getAttribute("src");
      // Verify the URL points to Supabase storage
      expect(src).toMatch(/avatars/); // assuming Supabase public URL
    });

    /**
     * Step 3: Verify profile data was correctly saved to the database
     * 
     * This step directly queries the database to confirm that all profile changes
     * (name, marketing consent, avatar URL) were correctly persisted.
     * This is the final verification that the entire profile update process worked correctly.
     */
    await test.step("verify profile data was saved to database", async () => {
      // Get the user ID from the database
      const [{ id }] = await db.execute<{ id: string }>(
        sql`SELECT id FROM auth.users WHERE email = ${TEST_EMAIL}`,
      );
      // Query the profiles table for the user's profile
      const results = await db
        .select()
        .from(profiles)
        .where(eq(profiles.profile_id, id));

      // Verify that exactly one profile was found
      expect(results.length).toBe(1);

      // Extract the profile data
      const profile = results[0];
      // Verify the name was updated
      expect(profile.name).toBe(NEW_NAME);
      // Verify marketing consent was enabled
      expect(profile.marketing_consent).toBe(true);
      // Verify the avatar URL is a valid URL
      expect(profile.avatar_url).toMatch(/^https?:\/\//); // assuming public URL is stored
    });
  });
});
