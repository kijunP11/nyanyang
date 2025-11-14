/**
 * User Settings E2E Tests
 * 
 * This file contains end-to-end tests for the user settings functionality, including:
 * 1. Theme switching (light/dark mode)
 * 2. Locale/language switching (English, Spanish, Korean)
 * 
 * These tests verify that user preferences are correctly applied and persisted
 * across page reloads, ensuring a consistent user experience.
 * 
 * The tests use Playwright for browser automation and verify changes to
 * HTML attributes that reflect the current theme and locale settings.
 */

import { expect, test } from "@playwright/test";

/**
 * Test suite for the Theme Switcher functionality
 * 
 * These tests verify that users can switch between light and dark themes,
 * and that the selected theme is correctly applied to the page.
 * 
 * The theme is reflected in the HTML class attribute, which controls
 * the application of CSS variables for theming.
 */
test.describe("Theme Switcher", () => {
  /**
   * Before each test, navigate to the home page
   * where the theme switcher is accessible in the navigation bar
   */
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  /**
   * Test that verifies switching to dark mode
   * 
   * This test clicks the theme switcher dropdown, selects the "Dark" option,
   * and verifies that the HTML element has the "dark" class applied.
   * 
   * The presence of the "dark" class indicates that dark mode styles
   * are being applied throughout the application.
   */
  test("should switch to dark mode", async ({ page }) => {
    // Open the theme switcher dropdown
    await page.getByTestId("theme-switcher").click();
    // Select the dark theme option
    await page.getByText("Dark", { exact: true }).click();
    // Get the class attribute from the HTML element
    const htmlClass = await page.locator("html").getAttribute("class");
    // Verify the dark class is applied
    expect(htmlClass).toContain("dark");
  });

  /**
   * Test that verifies switching to light mode
   * 
   * This test clicks the theme switcher dropdown, selects the "Light" option,
   * and verifies that the HTML element has the "light" class applied.
   * 
   * The presence of the "light" class indicates that light mode styles
   * are being applied throughout the application.
   */
  test("should switch to light mode", async ({ page }) => {
    // Open the theme switcher dropdown
    await page.getByTestId("theme-switcher").click();
    // Select the light theme option
    await page.getByText("Light", { exact: true }).click();
    // Get the class attribute from the HTML element
    const htmlClass = await page.locator("html").getAttribute("class");
    // Verify the light class is applied
    expect(htmlClass).toContain("light");
  });
});

/**
 * Test suite for the Locale Switcher functionality
 * 
 * These tests verify that users can switch between different languages (locales),
 * and that the selected locale is correctly applied and persisted.
 * 
 * The locale is reflected in the HTML lang attribute, which affects:
 * - Text content throughout the application
 * - Date and number formatting
 * - Right-to-left text direction (if applicable)
 * - Screen reader and accessibility behavior
 */
test.describe("Locale Switcher", () => {
  /**
   * Before each test, navigate to the home page
   * where the language switcher is accessible in the navigation bar
   */
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  /**
   * Test that verifies switching to Spanish locale
   * 
   * This test clicks the language switcher dropdown, selects the "Spanish" option,
   * waits for the change to be applied, reloads the page, and verifies that
   * the HTML element has the "es" (Spanish) lang attribute.
   * 
   * The page reload confirms that the language preference is persisted
   * using cookies or local storage.
   */
  test("should switch to Spanish", async ({ page }) => {
    // Open the language switcher dropdown
    await page.getByTestId("lang-switcher").click();
    // Select the Spanish language option
    await page.getByText("Spanish").click();
    // Wait for the language change to be applied and saved
    await page.waitForTimeout(2000);
    // Reload the page to verify persistence
    await page.reload();
    // Get the lang attribute from the HTML element
    const htmlLang = await page.locator("html").getAttribute("lang");
    // Verify Spanish locale is applied
    expect(htmlLang).toBe("es");
  });

  /**
   * Test that verifies switching to Korean locale
   * 
   * This test clicks the language switcher dropdown, selects the "Korean" option,
   * waits for the change to be applied, reloads the page, and verifies that
   * the HTML element has the "ko" (Korean) lang attribute.
   * 
   * The page reload confirms that the language preference is persisted
   * using cookies or local storage.
   */
  test("should switch to Korean", async ({ page }) => {
    // Open the language switcher dropdown
    await page.getByTestId("lang-switcher").click();
    // Select the Korean language option
    await page.getByText("Korean").click();
    // Wait for the language change to be applied and saved
    await page.waitForTimeout(2000);
    // Reload the page to verify persistence
    await page.reload();
    // Get the lang attribute from the HTML element
    const htmlLang = await page.locator("html").getAttribute("lang");
    // Verify Korean locale is applied
    expect(htmlLang).toBe("ko");
  });

  /**
   * Test that verifies switching to English locale
   * 
   * This test clicks the language switcher dropdown, selects the "English" option,
   * waits for the change to be applied, reloads the page, and verifies that
   * the HTML element has the "en" (English) lang attribute.
   * 
   * The page reload confirms that the language preference is persisted
   * using cookies or local storage.
   */
  test("should switch to English", async ({ page }) => {
    // Open the language switcher dropdown
    await page.getByTestId("lang-switcher").click();
    // Select the English language option
    await page.getByText("English").click();
    // Wait for the language change to be applied and saved
    await page.waitForTimeout(2000);
    // Reload the page to verify persistence
    await page.reload();
    // Get the lang attribute from the HTML element
    const htmlLang = await page.locator("html").getAttribute("lang");
    // Verify English locale is applied
    expect(htmlLang).toBe("en");
  });
});
