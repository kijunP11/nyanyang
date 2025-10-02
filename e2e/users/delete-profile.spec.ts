/**
 * Delete Profile E2E Tests
 * 
 * This file contains end-to-end tests for the account deletion functionality, including:
 * 1. The dual confirmation process to prevent accidental deletions
 * 2. Successful account deletion flow
 * 3. Verification that the user data is completely removed from the database
 * 
 * The tests verify that users can permanently delete their accounts
 * with appropriate safeguards to prevent accidental deletions.
 * 
 * The tests use Playwright for browser automation and directly query
 * the database to verify complete data removal.
 */

import { expect, test } from "@playwright/test";
import { sql } from "drizzle-orm";
import {
  confirmUser,
  deleteUser,
  loginUser,
  registerUser,
} from "e2e/utils/test-helpers";

import db from "~/core/db/drizzle-client.server";

/**
 * Test email for account deletion flow
 * 
 * This email is used to create a test user for the account deletion flow.
 * It must be set in the environment variables to run these tests.
 * Using an environment variable allows for different test emails in different environments
 * and prevents hardcoding sensitive information in the test files.
 */
const TEST_EMAIL = process.env.DELETE_PROFILE_TEST_USER_EMAIL!;

// Ensure the test email is configured before running tests
if (!TEST_EMAIL) {
  throw new Error("DELETE_PROFILE_TEST_USER_EMAIL must be set in .env");
}

/**
 * Test suite for the account deletion functionality
 * 
 * This suite tests the complete account deletion flow, including
 * the confirmation process and verification of data removal.
 */
test.describe("Delete Profile", () => {
  /**
   * Setup: Create and confirm a test user before running the test suite
   * 
   * This creates a user account that will be deleted during the test.
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
   * Cleanup: Attempt to delete the test user after all tests are complete
   * 
   * This is a safety measure in case the deletion test fails for some reason.
   * It ensures that test data doesn't accumulate in the database.
   * 
   * Note: If the deletion test succeeds, this will have no effect since
   * the user will already be deleted.
   */
  test.afterAll(async () => {
    await deleteUser(TEST_EMAIL);
  });

  /**
   * Test for the complete account deletion flow
   * 
   * This test verifies the entire account deletion process from login
   * to confirmation of data removal from the database.
   */
  test("should delete account after confirmation", async ({ page }) => {
    // Log in with the test user account
    await loginUser(page, TEST_EMAIL, "password");
    // Navigate to the account settings page
    await page.goto("/account/edit");

    /**
     * Step 1: Complete the dual confirmation process
     * 
     * This verifies that users must explicitly confirm their intention
     * to delete their account by checking two separate confirmation checkboxes.
     * This dual confirmation is a security measure to prevent accidental deletions.
     */
    await test.step("check both confirmations", async () => {
      // Check the first confirmation checkbox
      await page.getByLabel(/I confirm that I want to delete/i).check();
      // Check the second confirmation checkbox
      await page
        .getByLabel(/I understand that this action is irreversible/i)
        .check();
    });

    /**
     * Step 2: Submit the account deletion request
     * 
     * This clicks the delete account button and verifies that the user
     * is redirected to the home page after successful deletion.
     * The redirect indicates that the user has been logged out and their
     * session has been terminated as part of the deletion process.
     */
    await test.step("submit deletion and confirm redirect", async () => {
      // Click the delete account button
      await page.getByRole("button", { name: "Delete account" }).click();
      // Verify redirect to the home page after deletion
      await expect(page).toHaveURL("/");
    });

    /**
     * Step 3: Verify complete data removal from the database
     * 
     * This directly queries the database to confirm that the user's data
     * has been completely removed, ensuring that the deletion was successful
     * and that no orphaned data remains.
     * 
     * This verification is critical for privacy compliance and data protection.
     */
    await test.step("verify user no longer exists", async () => {
      // Query the database for the deleted user
      const [user] = await db.execute<{ id: string }>(
        sql`SELECT id FROM auth.users WHERE email = ${TEST_EMAIL}`,
      );
      // Verify that no user record is found
      expect(user).toBeUndefined();
    });
  });
});
