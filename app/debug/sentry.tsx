/**
 * Sentry Error Monitoring Debug Module
 *
 * This module provides a test page for verifying that the Sentry error monitoring integration
 * is working correctly. It allows developers and administrators to deliberately trigger a test
 * error and verify that it's being properly captured and reported to Sentry.
 *
 * The page includes:
 * - A simple UI with a button to trigger a test error
 * - An action function that throws an error when the form is submitted
 *
 * This is useful during development and after deployment to ensure that error monitoring
 * is functioning as expected without having to create actual error conditions in production code.
 * It helps verify the complete error reporting pipeline from client to Sentry dashboard.
 */
import type { Route } from "./+types/sentry";

import { Form } from "react-router";

import { Button } from "~/core/components/ui/button";

/**
 * Meta function for setting page metadata
 * 
 * This function sets the page title for the Sentry test page,
 * using the application name from environment variables.
 * 
 * @returns Array of metadata objects for the page
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Sentry Test | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Action function that deliberately throws an error
 * 
 * This function is called when the form is submitted. It intentionally throws
 * an error with a descriptive message to test that Sentry is properly capturing
 * and reporting errors from server-side actions.
 * 
 * The error should appear in the Sentry dashboard with the full stack trace and
 * any additional context that Sentry is configured to capture.
 * 
 * @throws Error - A test error to be captured by Sentry
 */
export function action() {
  throw new Error("This is a test error, you should see it in Sentry");
}

/**
 * Sentry Test Component
 * 
 * This component renders a simple interface for testing Sentry error monitoring integration.
 * It displays a button that triggers a test error when clicked by submitting a form that
 * calls the action function, which throws an error.
 * 
 * The component uses React Router's Form component to handle the form submission.
 * When the button is clicked, the action function is called, an error is thrown,
 * and Sentry should capture and report it.
 * 
 * @returns React component for testing Sentry error monitoring
 */
export default function TriggerError() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 px-5 py-10 md:px-10 md:py-20">
      <h1 className="text-2xl font-semibold">Sentry Test</h1>
      <p className="text-muted-foreground text-center">
        Test that the Sentry integration is working by triggering an error
        clicking the button below.
      </p>
      
      {/* Form that calls the action function which throws an error */}
      <Form method="post" className="mt-5">
        <Button>Trigger Error</Button>
      </Form>
    </div>
  );
}
