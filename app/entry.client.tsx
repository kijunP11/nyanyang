/**
 * Client Entry Point
 * 
 * This file serves as the entry point for the client-side portion of the application.
 * It handles hydration of the React application, initialization of critical services
 * like internationalization and error monitoring, and ensures optimal loading performance.
 * 
 * Key features:
 * - Sentry integration for client-side error monitoring and session replay
 * - Internationalization (i18n) setup with language detection
 * - React hydration with performance optimizations
 * - Multi-language support (English, Spanish, Korean)
 */

import * as Sentry from "@sentry/react-router";
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { HydratedRouter } from "react-router/dom";
import { getInitialNamespaces } from "remix-i18next/client";

// Import i18n configuration and language resources
import i18n from "./i18n";
import en from "./locales/en";
import es from "./locales/es";
import ko from "./locales/ko";

/**
 * Hydration function for client-side initialization
 * 
 * This asynchronous function handles the complete client-side initialization process:
 * 1. Initializes Sentry for error monitoring (production only)
 * 2. Sets up i18next for internationalization with language detection
 * 3. Hydrates the React application with the server-rendered HTML
 * 
 * The function is called using requestIdleCallback or setTimeout for optimal
 * performance, ensuring that critical user interactions are not blocked.
 */
async function hydrate() {
  // Initialize Sentry for error monitoring in production environments only
  if (import.meta.env.VITE_SENTRY_DSN && !import.meta.env.DEV) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      // Capture all replays for errors
      replaysOnErrorSampleRate: 1.0,
      // Sample 10% of normal sessions for performance monitoring
      replaysSessionSampleRate: 0.1,
      integrations: [
        // Configure session replay with privacy protections
        Sentry.replayIntegration({
          maskAllText: true, // Mask all text inputs for privacy
          blockAllMedia: true, // Block media content in replays
        }),
      ],
    });
  }

  // Initialize i18next for internationalization
  await i18next
    .use(initReactI18next) // Connect i18next with React
    .use(LanguageDetector) // Add language detection capability
    .init({
      ...i18n, // Spread base i18n configuration
      ns: getInitialNamespaces(), // Get namespaces from server-rendered content
      detection: {
        order: ["htmlTag"], // Detect language from HTML lang attribute
        caches: [], // Disable caching for language detection
      },
      // Configure language resources for all supported languages
      resources: {
        en: {
          common: en, // English translations
        },
        es: {
          common: es, // Spanish translations
        },
        ko: {
          common: ko, // Korean translations
        },
      },
    });

  // Hydrate the React application with performance optimization
  startTransition(() => {
    // Use startTransition to mark this as a non-urgent update
    // This allows React to prioritize more important updates
    hydrateRoot(
      document, // Hydrate the entire document
      <I18nextProvider i18n={i18next}>
        {/* Provide i18n context to the entire application */}
        <StrictMode>
          {/* Enable React strict mode for additional development checks */}
          <HydratedRouter />
          {/* Use the HydratedRouter from React Router */}
        </StrictMode>
      </I18nextProvider>,
    );
  });
}

/**
 * Optimal hydration scheduling
 * 
 * This code schedules the hydration process using the most efficient method available:
 * - requestIdleCallback: Used when available to run hydration during browser idle time
 * - setTimeout: Used as a fallback for browsers that don't support requestIdleCallback
 * 
 * This approach ensures that the hydration process doesn't block critical user interactions
 * and provides the best possible user experience, especially on lower-end devices.
 */
if (window.requestIdleCallback) {
  // Use requestIdleCallback when available for optimal performance
  // This will run the hydration process during browser idle time
  window.requestIdleCallback(hydrate);
} else {
  // Fallback for browsers that don't support requestIdleCallback
  // Using a minimal timeout to defer execution after the main thread is free
  setTimeout(hydrate, 1);
}
