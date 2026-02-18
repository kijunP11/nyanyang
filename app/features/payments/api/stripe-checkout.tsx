/**
 * Stripe Checkout Session API
 *
 * Creates a Stripe checkout session for point purchases.
 *
 * Key features:
 * - Creates Stripe checkout session
 * - Supports multiple point packages
 * - Returns checkout URL for redirect
 *
 * @module stripe-checkout
 */
import type { Route } from "./+types/stripe-checkout";

import { data } from "react-router";
import Stripe from "stripe";
import { z } from "zod";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

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
 * const session = await stripe.checkout.sessions.create({...});
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
 * Available point packages with their pricing and details.
 *
 * Each package contains:
 * - points: Number of points to be credited (base + bonus)
 * - price: Price in KRW (Korean Won)
 * - name: Display name in Korean
 *
 * @constant
 * @type {Record<string, {points: number, price: number, name: string}>}
 */
const POINT_PACKAGES = {
  starter: { points: 2000, price: 2000, name: "스타터 패키지" },
  basic: { points: 5000, price: 4900, name: "베이직 패키지" }, // 4900 + 100 bonus
  standard: { points: 10000, price: 9600, name: "스탠다드 패키지" }, // 9600 + 400 bonus
  premium: { points: 30000, price: 28000, name: "프리미엄 패키지" }, // 28000 + 2000 bonus
  pro: { points: 50000, price: 46000, name: "프로 패키지" }, // 46000 + 4000 bonus
  mega: { points: 100000, price: 90000, name: "메가 패키지" }, // 90000 + 10000 bonus
} as const;

/**
 * Zod schema for validating incoming checkout request body.
 *
 * Ensures that the package parameter is one of the valid point package types.
 *
 * @constant
 * @type {z.ZodObject}
 */
const bodySchema = z.object({
  package: z.enum(["starter", "basic", "standard", "premium", "pro", "mega"]),
});

/**
 * Action handler for creating a Stripe checkout session.
 *
 * This endpoint creates a new Stripe checkout session for purchasing point packages.
 * It requires authentication and only accepts POST requests. The checkout session
 * includes metadata about the user, selected package, and points to be credited
 * upon successful payment.
 *
 * @param {Route.ActionArgs} args - The route action arguments
 * @param {Request} args.request - The incoming HTTP request
 * @returns {Promise<Response>} JSON response containing checkout URL and session ID, or error details
 *
 * @throws {Error} Returns 401 if user is not authenticated
 * @throws {Error} Returns 405 if request method is not POST
 * @throws {Error} Returns 400 if request body is invalid
 * @throws {Error} Returns 500 if Stripe session creation fails
 *
 * @example
 * ```typescript
 * // Request
 * POST /api/payments/stripe-checkout
 * {
 *   "package": "medium"
 * }
 *
 * // Success Response (200)
 * {
 *   "success": true,
 *   "checkout_url": "https://checkout.stripe.com/...",
 *   "session_id": "cs_test_..."
 * }
 *
 * // Error Response (400)
 * {
 *   "error": "Invalid request",
 *   "details": {
 *     "package": ["Invalid enum value. Expected 'small' | 'medium' | 'large' | 'mega'"]
 *   }
 * }
 * ```
 */
export async function action({ request }: Route.ActionArgs) {
  // Create Supabase client and require authentication
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  // Get authenticated user
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  // Validate request method (POST only)
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405, headers });
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const { success, data: validData, error } = bodySchema.safeParse(body);

    if (!success) {
      return data(
        { error: "Invalid request", details: error.flatten().fieldErrors },
        { status: 400, headers },
      );
    }

    const packageInfo = POINT_PACKAGES[validData.package];

    // Get Stripe client
    const stripe = getStripeClient();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "krw",
            product_data: {
              name: packageInfo.name,
              description: `${packageInfo.points.toLocaleString()} 포인트`,
            },
            unit_amount: packageInfo.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.VITE_SUPABASE_URL || "http://localhost:5173"}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_SUPABASE_URL || "http://localhost:5173"}/payments/failure`,
      metadata: {
        user_id: user.id,
        package: validData.package,
        points: packageInfo.points.toString(),
      },
      customer_email: user.email,
    });

    return data(
      {
        success: true,
        checkout_url: session.url,
        session_id: session.id,
      },
      { headers },
    );
  } catch (err) {
    console.error("Error creating Stripe checkout session:", err);
    return data(
      { error: "Failed to create checkout session" },
      { status: 500, headers },
    );
  }
}
