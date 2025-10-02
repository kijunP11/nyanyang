/**
 * Google Analytics Debug Module
 *
 * This module provides a test page for verifying that the Google Analytics (GA4) integration
 * is working correctly. It allows developers and administrators to trigger a test event
 * and verify that it's being properly sent to Google Analytics.
 *
 * The page includes:
 * - A simple UI with a button to trigger a test event
 * - Visual feedback when the event is successfully triggered
 * - Loading state during event submission
 *
 * This is useful during development and after deployment to ensure that analytics
 * tracking is functioning as expected without having to perform actual user flows.
 */
import type { Route } from "./+types/analytics";

import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";
import { Form, useNavigation } from "react-router";

import { Button } from "~/core/components/ui/button";
import trackEvent from "~/core/lib/analytics.client";

/**
 * Meta function for setting page metadata
 * 
 * This function sets the page title for the Google Analytics test page,
 * using the application name from environment variables.
 * 
 * @returns Array of metadata objects for the page
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Google Tag Test | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Client action function for triggering a test analytics event
 * 
 * This function is called when the form is submitted. It uses the trackEvent
 * utility to send a test event to Google Analytics with some sample data,
 * including a timestamp. After sending the event, it returns a success response
 * that will be displayed to the user.
 * 
 * @returns Object indicating success status
 */
export async function clientAction() {
  // Send a test event to Google Analytics with timestamp
  trackEvent("test_event", {
    test: "test",
    time: new Date().toISOString(),
  });
  
  // Return success response to show confirmation message
  return {
    success: true,
  };
}

/**
 * Google Analytics Test Component
 * 
 * This component renders a simple interface for testing Google Analytics integration.
 * It displays a button that triggers a test event when clicked, shows a loading spinner
 * during submission, and displays a success message when the event is sent.
 * 
 * The component uses React Router's Form and useNavigation hooks to handle the form
 * submission and track the submission state for UI feedback.
 * 
 * @param actionData - Data returned from the clientAction function
 * @returns React component for testing Google Analytics
 */
export default function TriggerEvent({ actionData }: Route.ComponentProps) {
  // Get the current navigation state to show loading indicator
  const { state } = useNavigation();
  
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 px-5 py-10 md:px-10 md:py-20">
      <h1 className="text-2xl font-semibold">Google Tag Test</h1>
      <p className="text-muted-foreground text-center">
        Test that the Google Tag integration is working by clicking the button
        below.
      </p>
      
      {/* Form for triggering the test event */}
      <Form method="post" className="mt-5 flex w-xs justify-center">
        <Button
          disabled={state === "submitting"}
          type="submit"
          className="w-1/2"
        >
          {state === "submitting" ? (
            <>
              <LoaderCircleIcon className="size-4 animate-spin" />
            </>
          ) : (
            "Trigger Event"
          )}
        </Button>
      </Form>
      
      {/* Success message shown after event is triggered */}
      {actionData?.success && (
        <p className="text-muted-foreground flex items-center gap-2">
          <CheckCircle2Icon className="size-4 text-green-600" /> Event triggered
          successfully
        </p>
      )}
    </div>
  );
}
