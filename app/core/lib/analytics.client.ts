/**
 * Google Analytics Integration Module
 * 
 * This module provides a simple interface for tracking events with Google Analytics 4 (GA4).
 * It extends the global Window interface to include the gtag function provided by the
 * Google Analytics script, which is typically loaded in the application's root layout.
 * 
 * The module offers a type-safe way to track custom events with optional properties,
 * making it easy to implement consistent analytics tracking throughout the application.
 */

/**
 * Extend the Window interface to include the Google Analytics gtag function
 * This allows TypeScript to recognize the globally available gtag function
 * that's injected by the Google Analytics script
 */
declare global {
  interface Window {
    gtag: (
      command: string,
      event: string,
      params?: Record<string, unknown>,
    ) => void;
  }
}

/**
 * Track a custom event in Google Analytics
 * 
 * This function provides a type-safe way to send custom events to Google Analytics.
 * It safely checks for the existence of the gtag function before attempting to use it,
 * which prevents errors if the analytics script hasn't loaded or is blocked.
 * 
 * @example
 * // Track a simple event
 * trackEvent('button_click');
 * 
 * // Track an event with additional properties
 * trackEvent('purchase', { 
 *   currency: 'USD', 
 *   value: 49.99,
 *   items: [{ id: 'subscription_premium' }]
 * });
 * 
 * @param eventName - The name of the event to track
 * @param properties - Optional object containing additional event properties
 * @returns The result of the gtag call, or undefined if gtag is not available
 */
export default function trackEvent<T extends string>(
  eventName: T,
  properties?: Record<string, unknown>,
) {
  // Only call gtag if it exists (prevents errors if analytics is blocked or not loaded)
  return window.gtag && window.gtag("event", eventName, properties);
}
