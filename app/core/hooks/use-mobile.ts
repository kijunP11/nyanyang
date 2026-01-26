/**
 * Mobile Detection Hook Module
 *
 * This module provides a React hook for detecting whether the user is viewing
 * the application on a mobile device based on viewport width. It uses the
 * matchMedia API to efficiently track viewport changes and update state accordingly.
 *
 * The mobile breakpoint is set at 768px, which is a common breakpoint that
 * typically separates tablet/desktop from mobile phone viewports.
 */
import * as React from "react";

/**
 * Mobile viewport breakpoint in pixels
 *
 * Viewports below this width (less than 768px) are considered mobile.
 * This aligns with common responsive design breakpoints and Tailwind's 'md' breakpoint.
 */
const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect if the current viewport is mobile-sized
 *
 * This hook uses the matchMedia API to determine if the viewport width is below
 * the mobile breakpoint (768px). It returns a boolean indicating whether the
 * current viewport is considered mobile.
 *
 * The hook:
 * - Initializes with undefined to avoid hydration mismatches in SSR
 * - Sets up a media query listener for viewport changes
 * - Automatically cleans up the listener on unmount
 * - Re-evaluates on window resize
 *
 * @returns {boolean} true if viewport width is less than 768px, false otherwise
 *
 * @example
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *
 *   return (
 *     <div>
 *       {isMobile ? (
 *         <MobileNav />
 *       ) : (
 *         <DesktopNav />
 *       )}
 *     </div>
 *   );
 * }
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
