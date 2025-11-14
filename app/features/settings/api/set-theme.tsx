/**
 * Set Theme API Endpoint
 *
 * This file implements an API endpoint for changing the user's theme preference
 * (light or dark mode). It leverages the remix-themes library for theme management
 * and session-based persistence.
 *
 * Key features:
 * - Integration with remix-themes for theme management
 * - Session-based persistence of theme preference
 * - Automatic theme switching based on user selection
 * - Seamless integration with the application's theming system
 *
 * The endpoint uses the createThemeAction utility from remix-themes, which
 * handles the request processing, theme validation, and session storage.
 * This provides a consistent theming experience across the application.
 */

import { createThemeAction } from "remix-themes";

import { themeSessionResolver } from "~/core/lib/theme-session.server";

/**
 * Action handler for processing theme change requests
 *
 * This action is created using the createThemeAction utility from remix-themes,
 * which handles:
 * 1. Extracting the requested theme from the request
 * 2. Validating the theme (light or dark)
 * 3. Storing the theme preference in the user's session
 * 4. Returning a response with the appropriate session cookie
 *
 * The themeSessionResolver provides the session handling mechanism,
 * ensuring that the theme preference persists across requests.
 */
export const action = createThemeAction(themeSessionResolver);
