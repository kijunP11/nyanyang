/**
 * Resend Email Client Module
 *
 * This module creates and exports a Resend email client for sending transactional emails
 * from the application. Resend is a modern email API service that provides reliable
 * email delivery with features like tracking, templates, and analytics.
 *
 * The client is configured with the RESEND_API_KEY environment variable and can be
 * used throughout the application for sending various types of emails, including:
 * - Verification emails for authentication
 * - Password reset emails
 * - Welcome emails
 * - Notification emails
 * - Marketing emails (with proper consent)
 *
 * This is used as part of the application's communication system to deliver
 * important messages to users via email.
 */
import { Resend } from "resend";

/**
 * Resend email client instance
 * 
 * This client is initialized with the RESEND_API_KEY from environment variables
 * and provides methods for sending emails through the Resend API.
 * 
 * @example
 * // Example usage in a server function
 * await resendClient.emails.send({
 *   from: 'onboarding@example.com',
 *   to: 'user@example.com',
 *   subject: 'Welcome to Our App',
 *   html: '<p>Thanks for signing up!</p>',
 * });
 */
const resendClient = new Resend(process.env.RESEND_API_KEY);

export default resendClient;
