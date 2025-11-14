/**
 * Change Email E2E Tests
 * 
 * This file contains end-to-end tests for the email change functionality, including:
 * 1. Form validation for the email change form
 * 2. Complete email change flow with dual verification
 * 3. Login verification with the new email address
 * 
 * The tests verify the secure email change process that requires verification
 * from both the old and new email addresses before completing the change.
 * 
 * The tests use Playwright for browser automation and interact with the database
 * directly to simulate email verification links.
 */

import { expect, test } from "@playwright/test";
import { sql } from "drizzle-orm";
import {
  checkInvalidField,
  confirmUser,
  deleteUser,
  loginUser,
  registerUser,
} from "e2e/utils/test-helpers";

import db from "~/core/db/drizzle-client.server";

/**
 * Test emails for email change flow
 * 
 * TEST_EMAIL: The original email address of the test user
 * TEST_NEW_EMAIL: The new email address to change to
 * 
 * Both must be set in environment variables to run these tests.
 * Using environment variables allows for different test emails in different environments
 * and prevents hardcoding sensitive information in the test files.
 */
const TEST_EMAIL = process.env.CHANGE_EMAIL_TEST_USER_EMAIL;
const TEST_NEW_EMAIL = process.env.CHANGE_EMAIL_TEST_USER_NEW_EMAIL;

// Ensure the test emails are configured before running tests
if (!TEST_EMAIL || !TEST_NEW_EMAIL) {
  throw new Error(
    "CHANGE_EMAIL_TEST_USER_EMAIL and CHANGE_EMAIL_TEST_USER_NEW_EMAIL must be set in .env",
  );
}

/**
 * Test suite for the email change functionality
 * 
 * This suite tests the complete email change flow, including form validation,
 * dual email verification, and login with the new email address.
 */
test.describe("Change Email", async () => {
  /**
   * Setup: Create and confirm a test user before running the test suite
   * 
   * This creates a user account with the original test email that will be
   * used to test the email change process.
   */
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await registerUser(page, TEST_EMAIL, "password");
    await confirmUser(page, TEST_EMAIL);
    await context.close();
  });
  
  /**
   * Cleanup: Delete both test users after all tests are complete
   * 
   * This ensures that test data doesn't accumulate in the database
   * and that tests can be run repeatedly without conflicts.
   */
  test.afterAll(async () => {
    await deleteUser(TEST_EMAIL);
    await deleteUser(TEST_NEW_EMAIL);
  });
  
  /**
   * Before each test, log in with the original email and navigate to the account edit page
   * 
   * This ensures that each test starts from a consistent authenticated state
   * at the account settings page where the email change form is located.
   */
  test.beforeEach(async ({ page }) => {
    await loginUser(page, TEST_EMAIL, "password");
    await page.goto("/account/edit");
  });

  /**
   * Comprehensive test for the complete email change flow
   * 
   * This test verifies the entire email change process from form validation
   * to successful login with the new email address. It's broken into logical
   * steps for better readability and debugging.
   */
  test("should validate input, submit change, reset form, verify emails, log out and log in with new email", async ({
    page,
  }) => {
    /**
     * Step 1: Verify the current email field is displayed but disabled
     * 
     * This ensures that users can see their current email address
     * but cannot modify it directly, which is a security best practice.
     */
    await test.step("should render current email input as disabled", async () => {
      await expect(page.locator("#currentEmail")).toBeDisabled();
    });
    /**
     * Step 2: Verify validation for invalid email format
     * 
     * This ensures that the form properly validates email formats
     * before allowing submission, preventing invalid email addresses.
     */
    await test.step("should show validation error on invalid email", async () => {
      await page.locator("#email").fill("invalid@mail"); // Invalid email format
      await page.getByRole("button", { name: "Change email" }).click();
      await expect(page.getByText("Invalid email")).toBeVisible();
    });
    /**
     * Step 3: Verify validation for empty email field
     * 
     * This ensures that the form requires an email address
     * and doesn't allow submission with an empty field.
     */
    await test.step("should show error when submitting with empty field", async () => {
      await page.locator("#email").fill(""); // Empty field
      await page.getByRole("button", { name: "Change email" }).click();
      await checkInvalidField(page, "email");
    });
    /**
     * Step 4: Submit the form with a valid new email address
     * 
     * This verifies that the form can be successfully submitted with a valid
     * email address and that the appropriate success message is displayed.
     * The message indicates that verification emails have been sent.
     */
    await test.step("should submit form and show success message", async () => {
      await page.locator("#email").fill(TEST_NEW_EMAIL); // Valid new email
      await page.getByRole("button", { name: "Change email" }).click();
      await expect(
        page.getByText(
          "Email update process started. Please check your old email for a verification link.",
        ),
      ).toBeVisible();
    });
    /**
     * Step 5: Verify the form is reset after successful submission
     * 
     * This ensures a good user experience by clearing the form
     * after the email change request has been submitted.
     */
    await test.step("should reset form after success", async () => {
      await expect(page.locator("#email")).toHaveValue("");
    });
    /**
     * Step 6: Verify input focus is removed after submission
     * 
     * This ensures a good user experience by removing focus from the input
     * field after submission, indicating that the action is complete.
     */
    await test.step("should blur inputs after success", async () => {
      await expect(page.locator("#email")).not.toBeFocused();
    });
    /**
     * Step 7: Verify the new email address
     * 
     * This simulates clicking the verification link sent to the new email address.
     * It directly queries the database for the verification token and constructs
     * the URL that would be in the verification email.
     * 
     * This is the first part of the dual verification process required for email changes.
     */
    await test.step("should verify new email", async () => {
      // Get the verification token for the new email from the database
      const [{ email_change_token_new }] = await db.execute<{
        email_change_token_new: string;
      }>(
        sql`SELECT email_change_token_new FROM auth.users WHERE email = ${TEST_EMAIL}`,
      );
      
      // Simulate clicking the verification link in the email
      await page.goto(
        `/auth/confirm?token_hash=${email_change_token_new}&type=email_change&next=/auth/email-verified`,
      );
      
      // Verify the confirmation was successful
      await expect(page.getByText("Confirmation Complete")).toBeVisible();
    });
    /**
     * Step 8: Verify the old email address
     * 
     * This simulates clicking the verification link sent to the old email address.
     * It directly queries the database for the verification token and constructs
     * the URL that would be in the verification email.
     * 
     * This is the second part of the dual verification process required for email changes,
     * which helps prevent unauthorized email changes if someone gains temporary access to an account.
     */
    await test.step("should verify old email", async () => {
      // Get the verification token for the current email from the database
      const [{ email_change_token_current }] = await db.execute<{
        email_change_token_current: string;
      }>(
        sql`SELECT email_change_token_current FROM auth.users WHERE email = ${TEST_EMAIL}`,
      );
      
      // Simulate clicking the verification link in the email
      await page.goto(
        `/auth/confirm?token_hash=${email_change_token_current}&type=email_change&next=/auth/email-verified`,
      );
      
      // Verify the confirmation was successful
      await expect(page.getByText("Confirmation Complete")).toBeVisible();
    });
    /**
     * Step 9: Verify login with the new email address
     * 
     * This logs out and then logs back in using the new email address
     * to verify that the email change was successful and that the user
     * can now authenticate with the new email address.
     * 
     * This is the final verification that the entire email change process worked correctly.
     */
    await test.step("should log out and log in with new email", async () => {
      // Log out of the current session
      await page.goto("/logout");
      
      // Log in with the new email address
      await loginUser(page, TEST_NEW_EMAIL, "password");
      
      // Navigate to the dashboard and verify successful login
      await page.goto("/dashboard");
      await expect(page).toHaveTitle(/Dashboard/);
    });
  });
});
