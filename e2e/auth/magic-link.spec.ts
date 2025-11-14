/**
 * Magic Link Authentication E2E Tests
 *
 * This file contains end-to-end tests for the passwordless magic link authentication flow, including:
 * 1. UI validation for the magic link form
 * 2. Form validation for various input scenarios
 * 3. Complete magic link flow with token validation
 * 4. Error handling for non-existent users
 * 5. Login verification for both confirmed and unconfirmed users
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
  registerUser,
} from "e2e/utils/test-helpers";

import db from "~/core/db/drizzle-client.server";

/**
 * Test email for magic link flow
 *
 * This email is used to create a test user for the magic link authentication flow.
 * It must be set in the environment variables to run these tests.
 * Using an environment variable allows for different test emails in different environments.
 */
const TEST_EMAIL = process.env.MAGIC_LINK_TEST_USER_EMAIL;

// Ensure the test email is configured before running tests
if (!TEST_EMAIL) {
  throw new Error("MAGIC_LINK_TEST_USER_EMAIL must be set in .env");
}

/**
 * Test suite for the Magic Link UI components
 *
 * These tests verify the UI elements and form validation
 * of the magic link form without completing the actual authentication flow.
 */
test.describe("Magic Link UI", () => {
  // Navigate to the magic link page before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/magic-link");
  });

  /**
   * Test that verifies all essential UI elements are present on the magic link form
   *
   * Checks for:
   * - Page title
   * - Email input field
   * - Submit button
   */
  test("should render magic link form", async ({ page }) => {
    await expect(page.getByText("Enter your email")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send magic link" }),
    ).toBeVisible();
  });

  /**
   * Test that verifies form validation for empty email field
   *
   * Attempts to submit the form without filling the email field
   * and verifies that appropriate validation error appears
   */
  test("should validate empty email input", async ({ page }) => {
    await page.getByRole("button", { name: "Send magic link" }).click();
    await checkInvalidField(page, "email");
  });

  /**
   * Test that verifies email format validation
   *
   * Attempts to submit the form with an invalid email format
   * and verifies that the appropriate validation error appears
   */
  test("should validate invalid email format", async ({ page }) => {
    await page.locator("#email").fill("nico@las"); // Invalid email format
    await page.getByRole("button", { name: "Send magic link" }).click();
    await expect(
      page.getByText("Invalid email", { exact: true }),
    ).toBeVisible();
  });
});

/**
 * Test suite for the complete Magic Link authentication flow
 *
 * These tests verify the end-to-end magic link process including:
 * - Error handling for non-existent users
 * - Successful magic link request and form reset
 * - Login via magic link for unconfirmed users
 * - Login via magic link for confirmed users
 *
 * This suite uses .serial to ensure tests run in sequence and share state
 */
test.describe.serial("Magic Link Flow", () => {
  /**
   * Setup: Create a test user before running the test suite
   *
   * This creates a user account that will be used to test the magic link flow
   * Note: The user is initially unconfirmed
   */
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await registerUser(page, TEST_EMAIL, "password");
    await context.close();
  });

  /**
   * Cleanup: Delete the test user after all tests are complete
   *
   * This ensures that test data doesn't accumulate in the database
   * and that tests can be run repeatedly without conflicts
   */
  test.afterAll(async () => {
    await deleteUser(TEST_EMAIL);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/magic-link");
  });

  /**
   * Test that verifies error handling for non-existent users
   *
   * Attempts to request a magic link for an email that doesn't exist in the system
   * and verifies that the appropriate error message is displayed
   *
   * Note: This is a security feature that prevents email enumeration
   * while still providing helpful guidance to users
   */
  test("should show error if user does not have an account", async ({
    page,
  }) => {
    await page.locator("#email").fill("auserthatdoesnotexist@example.com"); // Non-existent email
    await page.getByRole("button", { name: "Send magic link" }).click();
    await expect(
      page.getByText("Create an account before signing in.", { exact: true }),
    ).toBeVisible();
  });

  /**
   * Test that verifies successful magic link request and form reset
   *
   * This test submits a valid email address, verifies the success message,
   * and checks that the form is reset after submission
   */
  test("should submit form", async ({ page }) => {
    // For some reason we have to wait for 60 seconds after the user is created
    // otherwise the test fails.
    await page.waitForTimeout(60_000);

    /**
     * Step 1: Submit the form with a valid email address
     */
    await test.step("submit form with valid email", async () => {
      await page.locator("#email").fill(TEST_EMAIL); // Valid registered email
      await page.getByRole("button", { name: "Send magic link" }).click();
    });

    /**
     * Step 2: Verify the success message appears
     */
    await test.step("expect success message", async () => {
      await expect(
        page.getByText(
          "Check your email and click the magic link to continue. You can close this tab.",
          { exact: true },
        ),
      ).toBeVisible();
    });

    /**
     * Step 3: Verify the form is reset after submission
     */
    await test.step("expect form to be reset", async () => {
      await expect(page.locator("#email")).toHaveValue("");
    });
  });

  /**
   * Test that verifies login via magic link for unconfirmed users
   *
   * This test simulates clicking the magic link in the email for an unconfirmed user
   * by directly querying the database for the confirmation token and constructing the URL
   *
   * The test verifies that the user is successfully logged in and redirected to the home page
   */
  test("should login from confirmation link if not confirmed", async ({
    page,
  }) => {
    // Get the confirmation token directly from the database
    const [{ confirmation_token }] = await db.execute<{
      confirmation_token: string;
    }>(
      sql`SELECT confirmation_token FROM auth.users WHERE email = ${TEST_EMAIL}`,
    );

    // Simulate clicking the magic link in the email
    await page.goto(
      `/auth/confirm?token_hash=${confirmation_token}&type=email&next=/`,
    );

    // Verify successful login by checking redirect to home page
    await expect(page).toHaveURL("/");
  });

  /**
   * Test that verifies login via magic link for confirmed users
   *
   * This test creates a confirmed user, requests a magic link,
   * and then simulates clicking the link in the email by directly
   * querying the database for the recovery token and constructing the URL
   *
   * The test verifies that the user is successfully logged in and redirected to the home page
   */
  test("should show error if user is already confirmed", async ({ page }) => {
    // Create a fresh confirmed user for this test
    await deleteUser(TEST_EMAIL);
    await registerUser(page, TEST_EMAIL, "password");
    await confirmUser(page, TEST_EMAIL);

    // Log out to prepare for magic link login
    await page.goto("/logout");

    // Request a magic link
    await page.goto("/auth/magic-link");
    await page.locator("#email").fill(TEST_EMAIL);
    await page.getByRole("button", { name: "Send magic link" }).click();

    // Verify success message appears
    await expect(
      page.getByText(
        "Check your email and click the magic link to continue. You can close this tab.",
        { exact: true },
      ),
    ).toBeVisible();

    // Get the recovery token directly from the database
    // For confirmed users, the recovery token is used instead of confirmation token
    const [{ recovery_token }] = await db.execute<{
      recovery_token: string;
    }>(sql`SELECT recovery_token FROM auth.users WHERE email = ${TEST_EMAIL}`);

    // Simulate clicking the magic link in the email
    await page.goto(
      `/auth/confirm?token_hash=${recovery_token}&type=email&next=/`,
    );

    // Verify successful login by checking redirect to home page
    await expect(page).toHaveURL("/");
  });
});
