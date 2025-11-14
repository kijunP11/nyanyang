/**
 * Contact Form Page with CAPTCHA Integration
 *
 * This module implements a contact form with dual CAPTCHA protection using both
 * HCaptcha and Turnstile (Cloudflare). It demonstrates how to integrate multiple
 * CAPTCHA providers for enhanced protection against automated submissions.
 *
 * The form includes:
 * - Basic contact information fields (name, email, message)
 * - Server-side validation using Zod schemas
 * - CAPTCHA verification with both HCaptcha and Turnstile
 * - Email sending via Resend API
 * - Form state management and user feedback
 *
 * This implementation serves as a demonstration of how to implement robust
 * form protection and validation in a production application.
 */
import type { Route } from "./+types/contact-us";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useEffect, useRef, useState } from "react";
import { Form, data } from "react-router";
import Turnstile, { useTurnstile } from "react-turnstile";
import { toast } from "sonner";
import { z } from "zod";

import FormButton from "~/core/components/form-button";
import FormErrors from "~/core/components/form-error";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";
import resendClient from "~/core/lib/resend-client.server";

/**
 * Meta function for setting page metadata
 *
 * This function sets the page title for the Contact Us page,
 * using the application name from environment variables.
 *
 * @returns Array of metadata objects for the page
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Contact Us | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Validates a Turnstile CAPTCHA token with Cloudflare's API
 *
 * This function sends the token received from the client-side Turnstile widget
 * to Cloudflare's verification endpoint to confirm that the user successfully
 * completed the CAPTCHA challenge.
 *
 * The verification process:
 * 1. Sends the token and secret key to Cloudflare's verification endpoint
 * 2. Parses the JSON response to determine if the token is valid
 * 3. Returns a boolean indicating success or failure
 * 4. Handles errors gracefully, logging them and returning false
 *
 * @param token - The token received from the client-side Turnstile widget
 * @returns Promise resolving to a boolean indicating if the token is valid
 */
async function isTurnstileTokenValid(token: string) {
  try {
    // Cloudflare's verification endpoint
    const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    // Send verification request to Cloudflare
    const result = await fetch(url, {
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Parse response and return success status
    const outcome = await result.json();
    return outcome.success;
  } catch (error) {
    // Log error and return false on failure
    console.error(error);
    return false;
  }
}

/**
 * Validates an HCaptcha token with HCaptcha's API
 *
 * This function sends the token received from the client-side HCaptcha widget
 * to HCaptcha's verification endpoint to confirm that the user successfully
 * completed the CAPTCHA challenge.
 *
 * The verification process:
 * 1. Sends the token and secret key to HCaptcha's verification endpoint
 * 2. Parses the JSON response to determine if the token is valid
 * 3. Returns a boolean indicating success or failure
 * 4. Handles errors gracefully, logging them and returning false
 *
 * @param token - The token received from the client-side HCaptcha widget
 * @returns Promise resolving to a boolean indicating if the token is valid
 */
async function isHcaptchaTokenValid(token: string) {
  try {
    // HCaptcha's verification endpoint
    const url = "https://api.hcaptcha.com/siteverify";

    // Send verification request to HCaptcha
    // Note: HCaptcha requires form-urlencoded format unlike Turnstile
    const result = await fetch(url, {
      body: new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET_KEY!,
        response: token,
      }),
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Parse response and return success status
    const outcome = await result.json();
    return outcome.success;
  } catch (error) {
    // Log error and return false on failure
    console.error(error);
    return false;
  }
}

/**
 * Validation schema for contact form submissions
 *
 * This schema defines the required fields and validation rules for the contact form:
 * - name: Required, must be at least 1 character
 * - email: Required, must be a valid email format
 * - message: Required, must be at least 1 character
 * - hcaptcha: Required, must contain a valid HCaptcha token
 * - turnstile: Required, must contain a valid Turnstile token
 *
 * The schema is used with Zod's safeParse method to validate form submissions
 * before processing them further.
 */
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
  hcaptcha: z.string().min(1),
  turnstile: z.string().min(1),
});

/**
 * Action handler for processing contact form submissions
 *
 * This function processes form submissions from the contact page. It follows these steps:
 * 1. Extracts and validates form data using the Zod schema
 * 2. Verifies both CAPTCHA tokens with their respective services
 * 3. Sends an email to the admin with the contact information
 * 4. Returns appropriate success or error responses
 *
 * Security considerations:
 * - Validates all form fields to prevent invalid data
 * - Verifies CAPTCHA tokens to prevent spam and automated submissions
 * - Uses server-side validation to prevent client-side bypass
 * - Handles errors gracefully with appropriate status codes
 *
 * @param request - The incoming HTTP request with form data
 * @returns JSON response indicating success or error with appropriate details
 */
export async function action({ request }: Route.ActionArgs) {
  // Extract form data from the request
  const formData = await request.formData();

  // Validate form data using the Zod schema
  const result = schema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    // Return validation errors if the form data is invalid
    return data(
      { fieldErrors: result.error.flatten().fieldErrors, success: false },
      { status: 400 },
    );
  }

  // Extract validated data
  const { name, email, message, hcaptcha, turnstile } = result.data;

  // Verify both CAPTCHA tokens in parallel
  const [validTurnstile, validHcaptcha] = await Promise.all([
    isTurnstileTokenValid(turnstile),
    isHcaptchaTokenValid(hcaptcha),
  ]);

  // Return error if either CAPTCHA verification fails
  if (!validTurnstile || !validHcaptcha) {
    return data(
      {
        errors: {
          hcaptcha: !validHcaptcha ? ["Invalid captcha, please try again"] : [],
          turnstile: !validTurnstile
            ? ["Invalid captcha, please try again"]
            : [],
        },
        success: false,
      },
      { status: 400 },
    );
  }

  // Send email to admin with contact information
  const { error } = await resendClient.emails.send({
    from: "Supaplate <hello@supaplate.com>",
    to: [process.env.ADMIN_EMAIL!],
    subject: "New contact from Supaplate",
    html: `
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Message:</b> ${message}</p>
    `,
  });

  // Handle email sending errors
  if (error) {
    return data({ error, success: false }, { status: 500 });
  }

  // Return success response
  return {
    success: true,
    error: null,
  };
}

/**
 * Contact Us Form Component
 * 
 * This component renders a contact form with dual CAPTCHA protection.
 * It manages form state, CAPTCHA tokens, and provides user feedback
 * based on the form submission results.
 * 
 * @param actionData - Data returned from the action function after form submission
 */
export default function ContactUs({ actionData }: Route.ComponentProps) {
  // State for storing CAPTCHA tokens from both providers
  const [hcaptchaToken, setHcaptchaToken] = useState<string>("");
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  
  // State to control when to render CAPTCHA widgets (prevents SSR issues)
  const [renderCaptchas, setRenderCaptchas] = useState<boolean>(false);
  
  // References to interact with CAPTCHA widgets and form
  const hcaptchaRef = useRef<HCaptcha>(null); // Reference to HCaptcha widget for resetting
  const turnstile = useTurnstile(); // Hook for Turnstile widget interactions
  const formRef = useRef<HTMLFormElement>(null); // Reference to the form element
  
  /**
   * Effect for handling form submission results
   * 
   * This effect runs whenever actionData changes (after form submission).
   * It handles:
   * 1. Resetting both CAPTCHA widgets
   * 2. Clearing CAPTCHA tokens
   * 3. Showing success or error messages
   * 4. Resetting the form on successful submission
   */
  useEffect(() => {
    if (!actionData) return;
    
    // Reset both CAPTCHA widgets and their tokens
    turnstile.reset();
    hcaptchaRef.current?.resetCaptcha();
    setHcaptchaToken("");
    setTurnstileToken("");
    
    // Handle successful submission
    if (actionData?.success) {
      // Show success message
      toast.success("Email sent successfully");
      
      // Reset form and remove focus from inputs
      formRef.current?.reset();
      formRef.current?.querySelectorAll("input").forEach((input) => {
        input.blur();
      });
    } 
    // Handle error in submission
    else if ("error" in actionData && actionData.error) {
      toast.error(actionData.error.message);
    }
  }, [actionData]);
  
  /**
   * Effect for delayed rendering of CAPTCHA widgets
   * 
   * This effect runs once on component mount and enables CAPTCHA rendering.
   * The delayed rendering prevents hydration mismatches and other SSR issues
   * that can occur with third-party CAPTCHA widgets.
   */
  useEffect(() => {
    setRenderCaptchas(true);
  }, []);
  /**
   * Render the contact form with dual CAPTCHA protection
   * 
   * The component renders:
   * 1. A header section with title and description
   * 2. A form with name, email, and message fields
   * 3. Two CAPTCHA widgets (HCaptcha and Turnstile)
   * 4. A submit button that is disabled until both CAPTCHAs are verified
   * 5. Error messages for field validation and CAPTCHA verification
   */
  return (
    <div className="flex flex-col items-center gap-20">
      {/* Header section */}
      <div>
        <h1 className="text-center text-3xl font-semibold tracking-tight md:text-5xl">
          Contact Us
        </h1>
        <p className="text-muted-foreground mt-2 text-center font-medium md:text-lg">
          This is a page to demo HCaptcha and Turnstile captchas.
        </p>
      </div>

      {/* Contact form */}
      <Form
        method="post"
        ref={formRef}
        className="flex w-full max-w-2xl flex-col gap-5"
      >
        {/* Name field */}
        <div className="flex flex-col items-start space-y-2">
          <Label htmlFor="name" className="flex flex-col items-start gap-1">
            Name
          </Label>
          <Input
            id="name"
            name="name"
            required
            type="text"
            placeholder="Enter your name"
          />
          {/* Display name field validation errors if any */}
          {actionData &&
          "fieldErrors" in actionData &&
          actionData.fieldErrors?.name ? (
            <FormErrors errors={actionData.fieldErrors.name} />
          ) : null}
        </div>

        {/* Email field */}
        <div className="flex flex-col items-start space-y-2">
          <Label htmlFor="email" className="flex flex-col items-start gap-1">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            required
            type="email"
            placeholder="Enter your email"
          />
          {/* Display email field validation errors if any */}
          {actionData &&
          "fieldErrors" in actionData &&
          actionData.fieldErrors?.email ? (
            <FormErrors errors={actionData.fieldErrors.email} />
          ) : null}
        </div>

        {/* Message field */}
        <div className="flex flex-col items-start space-y-2">
          <Label htmlFor="message" className="flex flex-col items-start gap-1">
            Message
          </Label>
          <Textarea
            id="message"
            name="message"
            required
            placeholder="Enter your message"
            className="h-32 resize-none"
          />
          {/* Display message field validation errors if any */}
          {actionData &&
          "fieldErrors" in actionData &&
          actionData.fieldErrors?.message ? (
            <FormErrors errors={actionData.fieldErrors.message} />
          ) : null}
        </div>

        {/* Hidden fields for CAPTCHA tokens */}
        <input type="hidden" name="hcaptcha" value={hcaptchaToken} required />
        <input type="hidden" name="turnstile" value={turnstileToken} required />

        {/* CAPTCHA widgets - only rendered after initial mount to prevent SSR issues */}
        {renderCaptchas ? (
          <div className="flex flex-col items-center justify-between gap-5 md:flex-row md:gap-0">
            {/* HCaptcha widget */}
            <div>
              <HCaptcha
                sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
                onVerify={(token) => {
                  setHcaptchaToken(token);
                }}
                ref={hcaptchaRef}
              />
              {/* Display HCaptcha verification errors if any */}
              {actionData &&
              "errors" in actionData &&
              actionData.errors?.hcaptcha ? (
                <FormErrors
                  key="hcaptcha"
                  errors={actionData.errors.hcaptcha}
                />
              ) : null}
            </div>

            {/* Turnstile widget */}
            <div>
              <Turnstile
                sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                onVerify={(token) => {
                  setTurnstileToken(token);
                }}
              />
              {/* Display Turnstile verification errors if any */}
              {actionData &&
              "errors" in actionData &&
              actionData.errors?.turnstile ? (
                <FormErrors
                  key="turnstile"
                  errors={actionData.errors.turnstile}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Informational note about the dual CAPTCHA implementation */}
        <span className="text-center text-sm text-amber-500">
          Note: This is a demo, you will not render two captchas at the same
          time.
          <br />
          You will have to choose between HCaptcha and Turnstile.
        </span>

        {/* Submit button - disabled until both CAPTCHAs are verified */}
        <FormButton
          type="submit"
          className="w-full"
          disabled={!hcaptchaToken || !turnstileToken}
          label="Send"
        />
      </Form>
    </div>
  );
}
