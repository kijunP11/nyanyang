/**
 * Change Password E2E Tests
 * 
 * This file contains end-to-end tests for the password change functionality, including:
 * 1. Form validation for the password change form
 * 2. Error handling for password mismatch
 * 3. Successful password update flow
 * 4. Login verification with the new password
 * 
 * The tests verify that users can securely change their password and that
 * the new password is immediately usable for authentication.
 * 
 * The tests use Playwright for browser automation and test helpers for
 * common authentication operations.
 */

import { expect } from "@playwright/test";
import { test } from "@playwright/test";
import {
  checkInvalidField,
  confirmUser,
  deleteUser,
  loginUser,
  registerUser,
} from "e2e/utils/test-helpers";

/**
 * Test email for password change flow
 * 
 * This email is used to create a test user for the password change flow.
 * It must be set in the environment variables to run these tests.
 * Using an environment variable allows for different test emails in different environments
 * and prevents hardcoding sensitive information in the test files.
 */
const TEST_EMAIL = process.env.CHANGE_PASSWORD_TEST_USER_EMAIL;

// Ensure the test email is configured before running tests
if (!TEST_EMAIL) {
  throw new Error("CHANGE_PASSWORD_TEST_USER_EMAIL must be set in .env");
}

/**
 * Test suite for the password change functionality
 * 
 * This suite tests the complete password change flow, including form validation,
 * successful password update, and login with the new password.
 */
test.describe("Change Password", () => {
  /**
   * Setup: Create and confirm a test user before running the test suite
   * 
   * This creates a user account with a known password that will be
   * used to test the password change process.
   */
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await registerUser(page, TEST_EMAIL, "password");
    await confirmUser(page, TEST_EMAIL);
    await context.close();
  });

  /**
   * Cleanup: Delete the test user after all tests are complete
   * 
   * This ensures that test data doesn't accumulate in the database
   * and that tests can be run repeatedly without conflicts.
   */
  test.afterAll(async () => {
    await deleteUser(TEST_EMAIL);
  });

  /**
   * Before each test, log in with the original password and navigate to the account edit page
   * 
   * This ensures that each test starts from a consistent authenticated state
   * at the account settings page where the password change form is located.
   */
  test.beforeEach(async ({ page }) => {
    await loginUser(page, TEST_EMAIL, "password");
    await page.goto("/account/edit");
  });

  /**
   * Comprehensive test for the complete password change flow
   * 
   * This test verifies the entire password change process from form validation
   * to successful login with the new password. It's broken into logical
   * steps for better readability and debugging.
   */
  test("should validate and submit password change form", async ({ page }) => {
    /**
     * Step 1: Verify validation for empty password fields
     * 
     * This ensures that the form requires both password fields
     * to be filled and doesn't allow submission with empty fields.
     */
    await test.step("should show error on empty fields", async () => {
      // Attempt to submit the form without filling any fields
      await page.getByRole("button", { name: "Change password" }).click();
      // Verify validation errors appear for both password fields
      await checkInvalidField(page, "password");
      await checkInvalidField(page, "confirmPassword");
    });

    /**
     * Step 2: Verify validation for password mismatch
     * 
     * This ensures that the form validates that both password fields
     * contain the same value, preventing accidental typos when setting
     * a new password.
     */
    await test.step("should show error if passwords do not match", async () => {
      // Fill in different passwords in each field
      await page.locator("#password").fill("newpassword123");
      await page.locator("#confirmPassword").fill("wrongpassword123"); // Different password
      // Attempt to submit the form
      await page.getByRole("button", { name: "Change password" }).click();
      // Verify the password mismatch error appears
      await expect(
        page.getByText("Passwords must match", { exact: true }),
      ).toBeVisible();
    });

    /**
     * Step 3: Submit the form with matching passwords
     * 
     * This verifies that the form can be successfully submitted with matching
     * passwords and that the appropriate success message is displayed.
     */
    await test.step("should update password successfully", async () => {
      // Fill in matching passwords in both fields
      await page.locator("#password").fill("newpassword123");
      await page.locator("#confirmPassword").fill("newpassword123");
      // Submit the form
      await page.getByRole("button", { name: "Change password" }).click();
      // Verify the success message appears
      await expect(page.getByText("Password updated")).toBeVisible();
    });

    /**
     * Step 4: Verify the form is reset after successful submission
     * 
     * This ensures a good user experience by clearing the form
     * after the password change has been submitted and processed.
     */
    await test.step("should reset form after success", async () => {
      // Verify both password fields are empty
      await expect(page.locator("#password")).toHaveValue("");
      await expect(page.locator("#confirmPassword")).toHaveValue("");
    });

    /**
     * Step 5: Verify login with the new password
     * 
     * This logs out and then logs back in using the new password
     * to verify that the password change was successful and that the user
     * can now authenticate with the new password.
     * 
     * This is the final verification that the entire password change process worked correctly.
     */
    await test.step("should log out and log in with new password", async () => {
      // Log out of the current session
      await page.goto("/logout");
      // Log in with the same email but the new password
      await loginUser(page, TEST_EMAIL, "newpassword123");
      // Navigate to the dashboard and verify successful login
      await page.goto("/dashboard");
      await expect(page).toHaveTitle(/Dashboard/);
    });
  });
});
