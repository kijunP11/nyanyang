/**
 * User Registration (Join) E2E Tests
 * 
 * This file contains end-to-end tests for the user registration flow, including:
 * 1. UI validation for the registration form
 * 2. Form validation for various input scenarios
 * 3. Complete registration flow with email confirmation
 * 4. Error handling for duplicate emails and invalid tokens
 * 5. Verification of user preferences (marketing consent)
 * 
 * The tests use Playwright for browser automation and interact with the database
 * directly to verify and manipulate test data.
 */

import { expect, test } from "@playwright/test";
import { eq, sql } from "drizzle-orm";

import db from "~/core/db/drizzle-client.server";
import { profiles } from "~/features/users/schema";

import {
  checkInvalidField,
  confirmUser,
  deleteUser,
  registerUser,
} from "../utils/test-helpers";

/**
 * Test emails for registration flow
 * 
 * UNCONFIRMED_EMAIL: Used to test the complete registration flow including confirmation
 * EXISTING_EMAIL: Used to test the duplicate email error scenario
 * 
 * Both must be set in environment variables to run these tests.
 * Using environment variables allows for different test emails in different environments.
 */
const UNCONFIRMED_EMAIL = process.env.JOIN_TEST_UNCONFIRMED_USER_EMAIL;
const EXISTING_EMAIL = process.env.JOIN_TEST_EXISTING_USER_EMAIL;

// Ensure the test emails are configured before running tests
if (!UNCONFIRMED_EMAIL || !EXISTING_EMAIL) {
  throw new Error(
    "JOIN_TEST_UNCONFIRMED_USER_EMAIL and JOIN_TEST_EXISTING_USER_EMAIL must be set in .env",
  );
}

/**
 * Test suite for the User Registration UI components
 * 
 * These tests verify the UI elements, form validation, and navigation links
 * of the registration form without completing the actual registration flow.
 */
test.describe("User Registration UI", () => {
  // Navigate to the registration page before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("/join");
  });
  /**
   * Test that verifies all essential UI elements are present on the registration form
   * 
   * Checks for:
   * - Page title
   * - Input fields (name, email, password, confirm password)
   * - Submit button
   * - Marketing consent checkbox
   * - Terms agreement checkbox
   */
  test("should display registration form", async ({ page }) => {
    await expect(
      page.getByText("Create an account", { exact: true }),
    ).toBeVisible();
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#confirmPassword")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create account" }),
    ).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: "Sign up for marketing emails" }),
    ).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: "I have read and agree" }),
    ).toBeVisible();
  });

  /**
   * Test that verifies social login options are displayed
   * 
   * This ensures that users have alternative registration methods
   * beyond the traditional email/password approach
   */
  test("should show alternative login methods", async ({ page }) => {
    await expect(page.getByText("Continue with GitHub")).toBeVisible();
    await expect(page.getByText("Continue with Kakao")).toBeVisible();
  });

  /**
   * Test that verifies the link to the sign-in page works correctly
   * 
   * This ensures users can easily navigate to the login page if they
   * already have an account, improving the user experience
   */
  test("should have a link to sign in page", async ({ page }) => {
    await expect(
      page.getByText("Already have an account? Sign in", { exact: true }),
    ).toBeVisible();
    await page.getByTestId("form-signin-link").click();
    await expect(page).toHaveURL("/login");
  });

  /**
   * Test that verifies the link to the terms of service page works correctly
   * 
   * This ensures users can access the legal terms before agreeing to them,
   * which is important for legal compliance and transparency
   */
  test("should have a link to terms of service page", async ({ page }) => {
    await page
      .locator("form")
      .getByRole("link", { name: "Terms of Service" })
      .click();
    await expect(page).toHaveURL("/legal/terms-of-service");
  });

  /**
   * Test that verifies the link to the privacy policy page works correctly
   * 
   * This ensures users can access the privacy policy before providing their data,
   * which is important for legal compliance and transparency
   */
  test("should have a link to privacy policy page", async ({ page }) => {
    await page
      .locator("form")
      .getByRole("link", { name: "Privacy Policy" })
      .click();
    await expect(page).toHaveURL("/legal/privacy-policy");
  });

  /**
   * Test that verifies form validation for empty fields
   * 
   * Attempts to submit the form without filling any fields
   * and verifies that appropriate validation errors appear for each field
   */
  test("should show validation error when any field is empty", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Create account" }).click();
    await checkInvalidField(page, "name");
    await checkInvalidField(page, "email");
    await checkInvalidField(page, "password");
    await checkInvalidField(page, "confirmPassword");
  });

  /**
   * Test that verifies email format validation
   * 
   * Attempts to submit the form with an invalid email format
   * and verifies that the appropriate validation error appears
   */
  test("should show error for invalid email format", async ({ page }) => {
    await page.locator("#name").fill("John Doe");
    await page.locator("#email").fill("invalid@email"); // Invalid email format
    await page.locator("#password").fill("password");
    await page.locator("#confirmPassword").fill("password");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(
      page.getByText("Invalid email address", { exact: true }),
    ).toBeVisible();
  });

  /**
   * Test that verifies password matching validation
   * 
   * Attempts to submit the form with non-matching passwords
   * and verifies that the appropriate validation error appears
   */
  test("should show error when passwords do not match", async ({ page }) => {
    await page.locator("#name").fill("John Doe");
    await page.locator("#email").fill("john.doe@example.com");
    await page.locator("#password").fill("password");
    await page.locator("#confirmPassword").fill("password1"); // Different password
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(
      page.getByText("Passwords must match", { exact: true }),
    ).toBeVisible();
  });

  /**
   * Test that verifies password length validation
   * 
   * Attempts to submit the form with passwords that are too short
   * and verifies that the appropriate validation errors appear
   * Note: Expects two error messages (one for each password field)
   */
  test("should show error when passwords are less than 8 characters", async ({
    page,
  }) => {
    await page.locator("#name").fill("John Doe");
    await page.locator("#email").fill("john.doe@example.com");
    await page.locator("#password").fill("short"); // Too short password
    await page.locator("#confirmPassword").fill("short"); // Too short password
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(
      page.getByText("Password must be at least 8 characters long"),
    ).toHaveCount(2); // One error for each password field
  });
});

/**
 * Test suite for the complete User Registration flow
 * 
 * These tests verify the end-to-end registration process including:
 * - Error handling for duplicate emails
 * - Successful registration with form reset
 * - Email confirmation process
 * - Error handling for invalid tokens
 * - Verification of user preferences in the database
 * 
 * This suite uses .serial to ensure tests run in sequence and share state
 */
test.describe.serial("User Registration Flow", () => {
  /**
   * Setup: Create a test user before running the test suite
   * 
   * This creates a user with the EXISTING_EMAIL to test the duplicate
   * email error scenario in the registration flow
   */
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    /*
     * Create a test user before testing the error message when the email already exists
     */
    await registerUser(page, EXISTING_EMAIL, "password");
    await confirmUser(page, EXISTING_EMAIL);
    await context.close();
  });

  /**
   * Cleanup: Delete all test users after all tests are complete
   * 
   * This ensures that test data doesn't accumulate in the database
   * and that tests can be run repeatedly without conflicts
   */
  test.afterAll(async () => {
    /*
     * Delete the test user that was created in the beforeAll
     * and the test user that was created for the registration test
     */
    await Promise.all([
      deleteUser(EXISTING_EMAIL),
      deleteUser(UNCONFIRMED_EMAIL),
    ]);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/join");
  });

  /**
   * Test that verifies error handling for duplicate email addresses
   * 
   * Attempts to register with an email that already exists in the system
   * and verifies that the appropriate error message is displayed
   */
  test("should show error if account with email already exists", async ({
    page,
  }) => {
    await page.locator("#name").fill("Test User");
    await page.locator("#email").fill(EXISTING_EMAIL!); // Email that already exists
    await page.locator("#password").fill("password");
    await page.locator("#confirmPassword").fill("password");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(
      page.getByText("There is an account with this email already.", {
        exact: true,
      }),
    ).toBeVisible();
  });

  /**
   * Test that verifies successful registration and form reset
   * 
   * Completes the registration form with valid data, including marketing consent,
   * and verifies that the success message appears and the form is reset
   * 
   * This test uses a longer timeout (10 seconds) because the server needs to
   * process the registration and potentially send an email in the background
   */
  test("should reset the form after successful submission", async ({
    page,
  }) => {
    await page.locator("#name").fill("Test User");
    await page.locator("#email").fill(UNCONFIRMED_EMAIL!); // New email for registration
    await page.locator("#password").fill("password");
    await page.locator("#confirmPassword").fill("password");
    await page.locator("#marketing").click(); // Opt in to marketing emails
    await page.getByRole("button", { name: "Create account" }).click();
    
    // Verify success message appears
    await expect(page.getByText("Account created!")).toBeVisible({
      timeout: 10000, // Extended timeout for server processing
    });
    
    // Verify form is reset
    await expect(page.locator("#name")).toBeEmpty();
    await expect(page.locator("#email")).toBeEmpty();
    await expect(page.locator("#password")).toBeEmpty();
    await expect(page.locator("#confirmPassword")).toBeEmpty();
  });

  /**
   * Test that verifies the email confirmation process
   * 
   * Uses a helper function to simulate clicking the confirmation link
   * in the email and verifies that the user is redirected to the home page
   */
  test("should confirm email", async ({ page }) => {
    await confirmUser(page, UNCONFIRMED_EMAIL);
    // Verify successful confirmation by checking redirect to home page
    await expect(page).toHaveURL("/");
  });

  /**
   * Test that verifies error handling for invalid confirmation tokens
   * 
   * Attempts to confirm an email with an invalid token and verifies
   * that the appropriate error message is displayed
   */
  test("should show error when token is invalid", async ({ page }) => {
    // Simulate clicking a confirmation link with an invalid token
    await page.goto(`/auth/confirm?token_hash=invalid&type=email&next=/`);
    await expect(
      page.getByText("Confirmation failed", { exact: true }),
    ).toBeVisible();
  });

  /**
   * Test that verifies user preferences are correctly stored in the database
   * 
   * This test directly queries the database to verify that the marketing consent
   * preference selected during registration was correctly saved
   */
  test("should have marketing consent set to true", async ({ page }) => {
    // Get the user ID from the auth.users table
    const [{ id }] = await db.execute<{
      id: string;
    }>(sql`SELECT id FROM auth.users WHERE email = ${UNCONFIRMED_EMAIL}`);
    
    // Query the profiles table to get the user's preferences
    const [user] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.profile_id, id));
    
    // Verify marketing consent was saved correctly
    expect(user.marketing_consent).toBe(true);
  });
});
