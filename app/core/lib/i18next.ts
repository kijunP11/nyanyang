/**
 * Internationalization (i18n) Configuration Module
 *
 * This module configures the internationalization system for the application using
 * remix-i18next, which integrates i18next with Remix for server-side rendering support.
 * It sets up language detection, fallback languages, and the backend for loading
 * translation files.
 *
 * The configuration includes:
 * - Cookie-based language preference storage
 * - Support for multiple languages as defined in the i18n configuration
 * - File system backend for loading translation files
 * - URL search parameter support for language switching
 *
 * This is a critical part of the application's internationalization system,
 * enabling multi-language support throughout the UI.
 */
import Backend from "i18next-fs-backend/cjs";
import { resolve } from "node:path";
import { createCookie } from "react-router";
import { RemixI18Next } from "remix-i18next/server";

// Import the base i18n configuration
import i18n from "~/i18n";

/**
 * Cookie for storing the user's language preference
 * 
 * This cookie is used to persist the user's language choice across sessions.
 * It doesn't use secrets since the language preference is not sensitive information.
 */
export const localeCookie = createCookie("locale", { secrets: undefined });

/**
 * RemixI18Next instance configured for server-side rendering
 * 
 * This configuration sets up:
 * 1. Language detection strategy (cookie, URL parameter)
 * 2. Supported languages from the base i18n configuration
 * 3. Fallback language when the requested language is not available
 * 4. File system backend for loading translation files
 * 
 * The instance is used in loaders to determine the user's language preference
 * and load the appropriate translations for server-rendered content.
 */
const i18next = new RemixI18Next({
  // Language detection configuration
  detection: {
    // Use the localeCookie for persistent language preference
    cookie: localeCookie,
    // Languages supported by the application
    supportedLanguages: i18n.supportedLngs as unknown as string[],
    // Fallback language when the requested language is not available
    fallbackLanguage: i18n.fallbackLng,
    // URL search parameter for language switching (e.g., ?lang=en)
    searchParamKey: "lang",
  },
  // i18next configuration
  i18next: {
    // Spread the base i18n configuration
    ...i18n,
    // Backend configuration for loading translation files
    backend: {
      // Path to the translation files (using file system)
      loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json"),
    },
  },
  // Plugins for i18next
  plugins: [Backend], // File system backend for loading translations
});

export default i18next;
