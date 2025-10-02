/**
 * Server Entry Point
 * 
 * This file handles server-side rendering (SSR) for the application.
 * It configures internationalization, streaming rendering, and error handling.
 * 
 * The server entry point is responsible for:
 * 1. Setting up i18n for server-side rendering
 * 2. Rendering the application to a stream for optimal performance
 * 3. Configuring security headers for production
 * 4. Handling errors and reporting them to Sentry
 * 5. Optimizing rendering for bots and search engines
 * 6. Managing streaming timeouts to prevent hanging requests
 */
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import type {
  AppLoadContext,
  EntryContext,
  HandleErrorFunction,
} from "react-router";

import { createReadableStreamFromReadable } from "@react-router/node";
import * as Sentry from "@sentry/node";
import { createInstance } from "i18next";
import { isbot } from "isbot";
import { resolve as resolvePath } from "node:path";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { ServerRouter } from "react-router";

// Import i18n configuration and translation resources
import i18next from "./core/lib/i18next.server"; // Server-side i18n instance
import i18n from "./i18n"; // Shared i18n configuration
import en from "./locales/en"; // English translations
import es from "./locales/es"; // Spanish translations
import ko from "./locales/ko"; // Korean translations

/**
 * Maximum time in milliseconds to wait for streaming content
 * 
 * This timeout prevents hanging requests by aborting the stream if it takes too long.
 * The 5-second timeout is a balance between giving enough time for data loading
 * while preventing excessive wait times for users on slow connections.
 * 
 * After this timeout, the stream will be aborted and the current content will be sent.
 */
export const streamTimeout = 5_000;

/**
 * Main server-side rendering handler
 * 
 * This function is the entry point for all server-side rendering requests.
 * It sets up i18n, renders the application to a stream, and configures response headers.
 * 
 * @param request - The incoming HTTP request
 * @param responseStatusCode - HTTP status code to use in the response
 * @param responseHeaders - HTTP headers to include in the response
 * @param routerContext - React Router context containing route information
 * @param loadContext - Additional context data for the application
 * @returns A Promise that resolves to a Response object
 */
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext,
  // If you have middleware enabled:
  // loadContext: unstable_RouterContextProvider
) {
  return new Promise(async (resolve, reject) => {
    const i18nextInstance = createInstance();

    const lng = await i18next.getLocale(request);
    const ns = i18next.getRouteNamespaces(routerContext);

    await i18nextInstance.use(initReactI18next).init({
      ...i18n,
      lng,
      ns,
      resources: {
        en: {
          common: en,
        },
        es: {
          common: es,
        },
        ko: {
          common: ko,
        },
      },
    });

    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");

    /**
     * Determine the appropriate rendering strategy based on the user agent
     * 
     * For search engines and bots, we use 'onAllReady' to ensure all content is loaded
     * before sending the response. This improves SEO by providing complete content.
     * 
     * For regular users, we use 'onShellReady' for faster initial page loads with streaming.
     * 
     * SPA Mode also uses 'onAllReady' to ensure complete content for static generation.
     * 
     * @see https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
     */
    let readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? "onAllReady" // Complete rendering for bots and static generation
        : "onShellReady"; // Streaming rendering for human users

    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={i18nextInstance}>
        <ServerRouter context={routerContext} url={request.url} />
      </I18nextProvider>,
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");
          responseHeaders.set(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload",
          );
          if (process.env.NODE_ENV === "production") {
            // Extend and or override CSP for production depending on your needs
            // responseHeaders.set(
            //   "Content-Security-Policy",
            //   `
            //     default-src 'self';
            //     script-src 'self' https: 'unsafe-inline';
            //     style-src 'self' https: 'unsafe-inline';
            //     font-src 'self' https:;
            //     img-src 'self' https: data:;
            //     connect-src 'self' https:;
            //     frame-src 'self' https:;
            //     media-src 'self' https:;
            //     object-src 'none';
            //     base-uri 'self';
            //     frame-ancestors 'self';
            //   `
            //     .replace(/\s{2,}/g, " ")
            //     .trim(),
            // );
          }
          responseHeaders.set("X-Content-Type-Options", "nosniff");
          responseHeaders.set(
            "Referrer-Policy",
            "strict-origin-when-cross-origin",
          );
          responseHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
          responseHeaders.set("Cross-Origin-Embedder-Policy", "unsafe-none");
          responseHeaders.set("X-Frame-Options", "DENY");
          responseHeaders.set("X-XSS-Protection", "1; mode=block");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    // Abort the rendering stream after the `streamTimeout` so it has time to
    // flush down the rejected boundaries
    setTimeout(abort, streamTimeout + 1000);
  });
}

/**
 * Global server-side error handler
 * 
 * This function captures and reports server-side errors to Sentry in production.
 * It only reports errors if the request hasn't been aborted and Sentry is configured.
 * 
 * @param error - The error that occurred during rendering
 * @param context - Context object containing the request and other information
 */
export const handleError: HandleErrorFunction = (error, { request }) => {
  if (
    !request.signal.aborted &&
    process.env.SENTRY_DSN &&
    process.env.NODE_ENV === "production"
  ) {
    // Send the error to Sentry for monitoring and alerting
    Sentry.captureException(error);
    // Also log to console for server-side visibility
    console.error(error);
  }
};
