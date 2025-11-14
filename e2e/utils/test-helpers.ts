/**
 * E2E Test Helper Functions
 * 
 * This file contains utility functions used across multiple E2E test files to:
 * 1. Validate form fields and error messages
 * 2. Create, login, and manage test users
 * 3. Handle email confirmation flows
 * 4. Clean up test data after tests
 * 
 * These helpers ensure consistent testing patterns and reduce code duplication
 * across the test suite, making tests more maintainable and readable.
 */

import { type Page, expect } from "@playwright/test";
import { eq, sql } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";

import db from "~/core/db/drizzle-client.server";

/**
 * Check if a form field has validation errors
 * 
 * This function verifies that a field is invalid and has a non-empty validation message.
 * It uses the browser's built-in form validation API to check validity and retrieve
 * the validation message, ensuring consistent validation testing across forms.
 * 
 * @param page - The Playwright Page object
 * @param fieldId - The HTML id attribute of the input field to check
 */
export async function checkInvalidField(page: Page, fieldId: string) {
  // Check if the field is marked as invalid by the browser
  const isValid = await page.$eval(
    `#${fieldId}`,
    (el: HTMLInputElement) => el.validity.valid,
  );
  expect(isValid).toBe(false);

  // Verify that there is a non-empty validation message
  const message = await page.$eval(
    `#${fieldId}`,
    (el: HTMLInputElement) => el.validationMessage,
  );
  expect(message).not.toBe("");
}

/**
 * Create a test user (placeholder function)
 * 
 * This is a placeholder for a potential helper function to create test users.
 * Currently not implemented, but kept as a stub for future expansion.
 * 
 * @param page - The Playwright Page object
 */
export async function createTestUser(page: Page) {}

/**
 * Log in a user with email and password
 * 
 * This function navigates to the login page, fills in the credentials,
 * submits the form, and waits for the login process to complete.
 * 
 * The extended timeout (15 seconds) allows for server-side processing,
 * potential redirects, and session establishment to complete.
 * 
 * @param page - The Playwright Page object
 * @param email - The email address of the user to log in
 * @param password - The password for the user account
 */
export async function loginUser(page: Page, email: string, password: string) {
  // Navigate to the login page
  await page.goto("/login");
  // Fill in the email and password fields
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  // Click the login button
  await page.getByRole("button", { name: "Log in" }).click();
  // Wait for login process to complete (including potential redirects)
  await page.waitForTimeout(15000);
}

/**
 * Register a new user account
 * 
 * This function navigates to the registration page, fills in all required fields,
 * opts into marketing emails, submits the form, and waits for the success message.
 * 
 * The function automatically generates a name from the email address by using
 * the part before the @ symbol, which is useful for automated testing.
 * 
 * @param page - The Playwright Page object
 * @param email - The email address for the new user
 * @param password - The password for the new user account
 */
export async function registerUser(
  page: Page,
  email: string,
  password: string,
) {
  // Navigate to the registration page
  await page.goto("/join");
  // Fill in the registration form
  await page.locator("#name").fill(email.split("@")[0]); // Use part before @ as name
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#confirmPassword").fill(password);
  // Opt into marketing emails
  await page
    .getByRole("checkbox", { name: "Sign up for marketing emails" })
    .click();
  // Submit the registration form
  await page.getByRole("button", { name: "Create account" }).click();
  // Wait for success message to confirm registration completed
  await page.waitForSelector("text=Account created!");
}

/**
 * Confirm a user's email address
 * 
 * This function simulates clicking the confirmation link in the verification email.
 * It directly queries the database to get the confirmation token for the specified user,
 * then navigates to the confirmation URL with that token.
 * 
 * This approach allows testing the email confirmation flow without actually
 * sending or intercepting emails, which simplifies the testing process.
 * 
 * @param page - The Playwright Page object
 * @param email - The email address of the user to confirm
 */
export async function confirmUser(page: Page, email: string) {
  // Get the confirmation token directly from the database
  const [{ confirmation_token }] = await db.execute<{
    confirmation_token: string;
  }>(sql`SELECT confirmation_token FROM auth.users WHERE email = ${email}`);
  
  // Navigate to the confirmation URL with the token
  await page.goto(
`/auth/confirm?token_hash=${confirmation_token}&type=email&next=/&testid=285493`
  );
}

/**
 * Delete a test user from the database
 * 
 * This function removes a user account from the database by email address.
 * It's used in test cleanup to ensure test data doesn't accumulate and
 * that tests can be run repeatedly without conflicts.
 * 
 * The function uses Drizzle ORM to perform a direct database deletion,
 * bypassing the application's API for efficiency and reliability in tests.
 * 
 * @param email - The email address of the user to delete
 */
export async function deleteUser(email: string) {
  await db.delete(authUsers).where(eq(authUsers.email, email));
}