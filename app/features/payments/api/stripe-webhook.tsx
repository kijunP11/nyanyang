/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events for payment processing.
 *
 * Key features:
 * - Verifies webhook signature
 * - Handles checkout.session.completed event
 * - Credits points to user account
 * - Creates payment and transaction records
 *
 * @module stripe-webhook
 */

import type { Route } from "./+types/stripe-webhook";

import Stripe from "stripe";
import { data } from "react-router";

import drizzle from "~/core/db/drizzle-client.server";
import { eq } from "drizzle-orm";

import { userPoints, pointTransactions } from "../../points/schema";
import { payments } from "../schema";

/**
 * Initializes and returns a Stripe client instance.
 *
 * Uses lazy initialization to avoid errors if the environment variable is missing.
 * The Stripe client is configured with the latest API version.
 *
 * @returns {Stripe} Configured Stripe client instance
 * @throws {Error} If STRIPE_SECRET_KEY environment variable is not set
 *
 * @example
 * ```typescript
 * const stripe = getStripeClient();
 * const event = stripe.webhooks.constructEvent(body, signature, secret);
 * ```
 */
function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-10-29.clover",
  });
}

/**
 * Retrieves the Stripe webhook secret from environment variables.
 *
 * This secret is used to verify webhook signatures to ensure the webhook
 * events are genuinely from Stripe and not from a malicious source.
 *
 * @returns {string} The Stripe webhook secret
 * @throws {Error} If STRIPE_WEBHOOK_SECRET environment variable is not set
 *
 * @example
 * ```typescript
 * const secret = getWebhookSecret();
 * const event = stripe.webhooks.constructEvent(body, signature, secret);
 * ```
 */
function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");
  }
  return secret;
}

/**
 * Action handler for processing Stripe webhook events.
 *
 * This endpoint receives and processes webhook events from Stripe. It verifies
 * the webhook signature to ensure authenticity, then handles specific event types
 * to update the application state accordingly.
 *
 * Currently handles the following event types:
 * - `checkout.session.completed`: Processes successful payment and credits points
 *
 * For successful checkout events, this function:
 * 1. Verifies the webhook signature
 * 2. Extracts user and payment metadata
 * 3. Creates or updates user points balance
 * 4. Creates point transaction record
 * 5. Creates payment record for auditing
 *
 * @param {Route.ActionArgs} args - The route action arguments
 * @param {Request} args.request - The incoming HTTP request from Stripe
 * @returns {Promise<Response>} JSON response confirming receipt or error details
 *
 * @throws {Error} Returns 405 if request method is not POST
 * @throws {Error} Returns 400 if webhook signature is missing or invalid
 * @throws {Error} Returns 400 if required metadata is missing from the event
 * @throws {Error} Returns 500 if database operations or webhook processing fails
 *
 * @example
 * ```typescript
 * // Stripe webhook event structure
 * {
 *   "type": "checkout.session.completed",
 *   "data": {
 *     "object": {
 *       "id": "cs_test_...",
 *       "metadata": {
 *         "user_id": "uuid",
 *         "package": "medium",
 *         "points": "5000"
 *       },
 *       "amount_total": 490000,
 *       "payment_intent": "pi_...",
 *       "customer_email": "user@example.com"
 *     }
 *   }
 * }
 *
 * // Success Response (200)
 * {
 *   "received": true
 * }
 *
 * // Error Response (400)
 * {
 *   "error": "Missing metadata"
 * }
 * ```
 */
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Get Stripe client and webhook secret
    const stripe = getStripeClient();
    const webhookSecret = getWebhookSecret();

    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return data({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return data({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Extract metadata
        const userId = session.metadata?.user_id;
        const packageType = session.metadata?.package;
        const pointsStr = session.metadata?.points;

        if (!userId || !pointsStr) {
          console.error("Missing metadata in webhook:", session.metadata);
          return data({ error: "Missing metadata" }, { status: 400 });
        }

        const pointsToAdd = parseInt(pointsStr);
        const db = drizzle;

        // Get or create user points record
        let [userPointsRecord] = await db
          .select()
          .from(userPoints)
          .where(eq(userPoints.user_id, userId))
          .limit(1);

        if (!userPointsRecord) {
          [userPointsRecord] = await db
            .insert(userPoints)
            .values({
              user_id: userId,
              current_balance: 0,
              total_earned: 0,
              total_spent: 0,
            })
            .returning();
        }

        // Calculate new balance
        const newBalance = userPointsRecord.current_balance + pointsToAdd;
        const newTotalEarned = userPointsRecord.total_earned + pointsToAdd;

        // Update user points
        await db
          .update(userPoints)
          .set({
            current_balance: newBalance,
            total_earned: newTotalEarned,
          })
          .where(eq(userPoints.user_id, userId));

        // Create point transaction record
        await db.insert(pointTransactions).values({
          user_id: userId,
          amount: pointsToAdd,
          balance_after: newBalance,
          type: "charge",
          reason: `Stripe payment - ${packageType} package`,
          reference_id: session.id,
        });

        // Create payment record
        await db.insert(payments).values({
          payment_key: session.payment_intent as string || session.id,
          order_id: session.id,
          order_name: `Point Package - ${packageType}`,
          total_amount: (session.amount_total || 0) / 100, // Convert from cents
          metadata: {
            package: packageType,
            points: pointsToAdd,
            provider: "stripe",
          },
          raw_data: session,
          receipt_url: session.url || "",
          status: "approved",
          user_id: userId,
          approved_at: new Date(),
          requested_at: new Date(session.created * 1000),
        });

        console.log(`Successfully credited ${pointsToAdd} points to user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return data({ received: true });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return data({ error: "Webhook processing failed" }, { status: 500 });
  }
}
