/**
 * Forgot Password E2E Tests
 * 
 * This file contains end-to-end tests for the password recovery flow, including:
 * 1. UI validation for the forgot password form
 * 2. Error handling for invalid inputs
 * 3. Complete password reset flow with token validation
 * 4. Login verification after password reset
 * 
 * The tests use Playwright for browser automation and interact with the database
 * directly to verify and manipulate test data.
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
 * Test email for password recovery flow
 * 
 * This email is used to create a test user for the password reset flow.
 * It must be set in the environment variables to run these tests.
 * Using an environment variable allows for different test emails in different environments.
 */
const TEST_EMAIL = process.env.FORGOT_PASSWORD_TEST_USER_EMAIL;

// Ensure the test email is configured before running tests
if (!TEST_EMAIL) {
  throw new Error("FORGOT_PASSWORD_TEST_USER_EMAIL must be set in .env");
}

/**
 * Test suite for the Reset Password UI components
 * 
 * These tests verify the UI elements, form validation, and success messages
 * of the forgot password form without completing the actual reset flow.
 */
test.describe("Reset Password UI", () => {
  // Navigate to the forgot password page before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/forgot-password/reset");
  });

  /**
   * Test that verifies all essential UI elements are present on the forgot password form
   * 
   * Checks for:
   * - Page title
   * - Email input field
   * - Submit button
   */
  test("should show forgot password form", async ({ page }) => {
    await expect(page.getByText("Forgot your password?")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send reset link" }),
    ).toBeVisible();
  });

  /**
   * Test that verifies form validation for empty fields
   * 
   * Attempts to submit the form without filling any fields
   * and verifies that appropriate validation errors appear
   */
  test("should show validation error when any field is empty", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Send reset link" }).click();
    await checkInvalidField(page, "email");
  });

  /**
   * Test that verifies email format validation
   * 
   * Attempts to submit the form with an invalid email format
   * and verifies that the appropriate validation error appears
   */
  test("should show validation error when email is invalid", async ({
    page,
  }) => {
    await page.locator("#email").fill("nico@las"); // Invalid email format
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(
      page.getByText("Invalid email", { exact: true }),
    ).toBeVisible();
  });

  /**
   * Test that verifies success message appears after submitting a valid email
   * 
   * This test uses a longer timeout (10 seconds) because the server needs to
   * process the request and potentially send an email in the background
   */
  test("should show success message after sending reset link", async ({
    page,
  }) => {
    await page.locator("#email").fill("nico@supaplate.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(
      page.getByText(
        "Check your email for a reset link, you can close this tab.",
        { exact: true },
      ),
    ).toBeVisible({ timeout: 10000 }); // Extended timeout for server processing
  });

  /**
   * Test that verifies the form is reset after successful submission
   * 
   * This ensures a good user experience by clearing the form after
   * the user has successfully requested a password reset
   */
  test("should reset the form after successful submission", async ({
    page,
  }) => {
    await page.locator("#email").fill("nico@supaplate.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.locator("#email")).toBeEmpty();
  });
});

/**
 * Test suite for the complete Reset Password flow
 * 
 * These tests verify the end-to-end password reset process including:
 * - Sending the reset link
 * - Using the recovery token
 * - Setting a new password
 * - Verifying login with the new password
 * 
 * This suite uses .serial to ensure tests run in sequence and share state
 */
test.describe.serial("Reset Password Flow", () => {
  /**
   * Setup: Create a test user before running the test suite
   * 
   * This creates a fresh user account that will be used to test the complete
   * password reset flow, including registration and email confirmation
   */
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    /*
     * Create a test user so we can test the reset password flow
     */
    await registerUser(page, TEST_EMAIL, "password");
    await confirmUser(page, TEST_EMAIL);
    await context.close();
  });

  /**
   * Cleanup: Delete the test user after all tests are complete
   * 
   * This ensures that test data doesn't accumulate in the database
   * and that tests can be run repeatedly without conflicts
   */
  test.afterAll(async () => {
    /*
     * Delete the test user that was created in the beforeAll
     */
    await deleteUser(TEST_EMAIL);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/forgot-password/reset");
  });

  /**
   * Complete end-to-end test of the password reset flow
   * 
   * This test verifies the entire password reset process from requesting
   * a reset link to logging in with the new password. It's broken into
   * logical steps for better readability and debugging.
   */
  test("should reset password using valid recovery token", async ({ page }) => {
    /**
     * Step 1: Request a password reset link
     * 
     * Fill in the email and submit the form, then verify the success message appears
     */
    await test.step("send reset link", async () => {
      await page.locator("#email").fill(TEST_EMAIL);
      await page.getByRole("button", { name: "Send reset link" }).click();
      await expect(
        page.getByText(
          "Check your email for a reset link, you can close this tab.",
          { exact: true },
        ),
      ).toBeVisible();
    });
    
    /**
     * Step 2: Simulate clicking the reset link in the email
     * 
     * This step directly queries the database to get the recovery token
     * and constructs the URL that would be in the reset email
     */
    await test.step("redirect to reset page", async () => {
      // Get the recovery token directly from the database
      const [{ recovery_token }] = await db.execute<{
        recovery_token: string;
      }>(
        sql`SELECT recovery_token FROM auth.users WHERE email = ${TEST_EMAIL}`,
      );
      
      // Simulate clicking the link in the email
      await page.goto(
        `/auth/confirm?token_hash=${recovery_token}&type=recovery&next=/auth/forgot-password/create`,
      );
      
      // Verify we're on the password reset page
      await expect(page.getByText("Update your password")).toBeVisible();
    });
    
    /**
     * Step 3: Set a new password
     * 
     * Fill in the new password and confirmation, then submit the form
     */
    await test.step("reset password", async () => {
      await page.locator("#password").fill("newpassword123");
      await page.locator("#confirmPassword").fill("newpassword123");
      await page.getByRole("button", { name: "Update password" }).click();
      
      // Verify the success message
      await expect(
        page.getByText("Password updated successfully."),
      ).toBeVisible();
    });
    
    /**
     * Step 4: Verify the new password works
     * 
     * Log out and log back in with the new password to confirm it was changed
     */
    await test.step("log out and log in again", async () => {
      await page.goto("/logout");
      await loginUser(page, TEST_EMAIL, "newpassword123");
      
      // Verify successful login by checking we're redirected to the home page
      await expect(page).toHaveURL("/");
    });
  });
});
