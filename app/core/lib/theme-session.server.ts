/**
 * Theme Session Management Module
 *
 * This module configures and exports a theme session resolver for managing theme preferences
 * in the application. It integrates with remix-themes to provide server-side theme detection
 * and persistence through cookies.
 *
 * The theme preference is stored in a non-HTTP-only cookie, allowing both server and client
 * access to the theme setting. This enables the application to render with the correct theme
 * on initial load (server-side) and maintain theme consistency during client-side navigation.
 */
import { createCookieSessionStorage } from "react-router";
import { createThemeSessionResolver } from "remix-themes";

/**
 * Cookie-based session storage for theme preferences
 * 
 * This session storage is configured with the following settings:
 * - name: "theme" - The name of the cookie used to store theme preference
 * - path: "/" - Makes the cookie available across the entire application
 * - httpOnly: false - Allows JavaScript access to read the cookie (required for client-side theme switching)
 * - sameSite: "lax" - Provides some CSRF protection while allowing normal navigation
 * 
 * Note: httpOnly is set to false intentionally to allow client-side theme detection
 * without requiring a server roundtrip. This is a common pattern for theme preferences
 * since they are not sensitive data.
 */
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "theme",
    path: "/",
    httpOnly: false,
    sameSite: "lax",
  },
});

/**
 * Theme session resolver for managing theme preferences
 * 
 * This resolver provides methods for getting and setting the theme preference
 * in both server and client contexts. It's used by the ThemeProvider component
 * to initialize the theme and by theme switching components to update it.
 * 
 * @example
 * // In a loader function
 * export async function loader({ request }: LoaderArgs) {
 *   const { getTheme } = await themeSessionResolver(request);
 *   const theme = getTheme();
 *   return json({ theme });
 * }
 * 
 * // In an action function for theme switching
 * export async function action({ request }: ActionArgs) {
 *   const { getTheme, setTheme } = await themeSessionResolver(request);
 *   const formData = await request.formData();
 *   const theme = formData.get("theme") as Theme;
 *   return json(
 *     { success: true },
 *     { headers: { "Set-Cookie": await setTheme(theme) } }
 *   );
 * }
 */
export const themeSessionResolver = createThemeSessionResolver(sessionStorage);
