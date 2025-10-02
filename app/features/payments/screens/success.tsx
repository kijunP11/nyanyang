/**
 * Payment Success Page Component
 *
 * This file implements the payment success page that verifies and processes
 * successful payments from Toss Payments. It demonstrates a complete payment
 * verification flow with proper security checks and database recording.
 *
 * Key features:
 * - Authentication protection to prevent unauthorized access
 * - Payment verification with the Toss Payments API
 * - Validation of payment parameters and response data
 * - Security checks for payment amount verification
 * - Database recording of verified payments
 * - Detailed success page with payment information
 */

import type { Route } from "./+types/success";

import { redirect } from "react-router";
import { z } from "zod";

import { requireAuthentication } from "~/core/lib/guards.server";
import adminClient from "~/core/lib/supa-admin-client.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Meta function for setting page metadata
 *
 * This function sets the page title for the payment success page,
 * indicating to the user that their payment has been completed successfully.
 *
 * @returns Array of metadata objects for the page
 */
export const meta: Route.MetaFunction = () => [
  {
    title: `Payment Complete | ${import.meta.env.VITE_APP_NAME}`,
  },
];

/**
 * Validation schema for URL parameters from Toss Payments redirect
 *
 * This schema defines the required parameters that Toss Payments includes
 * in the redirect URL after a successful payment:
 * - orderId: Unique identifier for the order
 * - paymentKey: Unique identifier for the payment transaction
 * - amount: Payment amount
 * - paymentType: Method of payment (card, transfer, etc.)
 */
const paramsSchema = z.object({
  orderId: z.string(),
  paymentKey: z.string(),
  amount: z.coerce.number(),
  paymentType: z.string(),
});

/**
 * Validation schema for Toss Payments API response
 *
 * This schema defines the expected structure of the response from the
 * Toss Payments confirmation API. It includes:
 * - Transaction identifiers (paymentKey, orderId)
 * - Order details (orderName)
 * - Payment status and timestamps
 * - Receipt information
 * - Payment amount and additional metadata
 */
const paymentResponseSchema = z.object({
  paymentKey: z.string(),
  orderId: z.string(),
  orderName: z.string(),
  status: z.string(),
  requestedAt: z.string(),
  approvedAt: z.string(),
  receipt: z.object({
    url: z.string(),
  }),
  totalAmount: z.number(),
  metadata: z.record(z.string()),
});

/**
 * Loader function for payment verification and processing
 *
 * This function handles the complete payment verification flow:
 * 1. Authenticates the user to prevent unauthorized access
 * 2. Validates URL parameters from Toss Payments redirect
 * 3. Verifies the payment with Toss Payments API
 * 4. Validates the payment amount to prevent fraud
 * 5. Records the verified payment in the database
 *
 * Security considerations:
 * - Requires authentication to access the success page
 * - Validates all payment parameters with Zod schemas
 * - Verifies payment with Toss Payments API using secret key
 * - Validates payment amount to prevent tampering
 * - Uses admin client for secure database operations
 *
 * @param request - The incoming HTTP request with payment parameters
 * @returns Object with payment data for the success page
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Create a server-side Supabase client with the user's session
  const [client] = makeServerClient(request);
  
  // Verify the user is authenticated, redirects to login if not
  await requireAuthentication(client);
  
  // Get the authenticated user's information
  const {
    data: { user },
  } = await client.auth.getUser();
  
  // Redirect to checkout if user is not found
  if (!user) {
    throw redirect("/payments/checkout");
  }
  
  // Extract and validate payment parameters from URL
  const url = new URL(request.url);
  const result = paramsSchema.safeParse(Object.fromEntries(url.searchParams));
  
  // Redirect to failure page if parameters are invalid
  if (!result.success) {
    return redirect(`/payments/failure?`);
  }
  
  // Prepare authorization header for Toss Payments API
  const encryptedSecretKey =
    "Basic " +
    Buffer.from(process.env.TOSS_PAYMENTS_SECRET_KEY + ":").toString("base64");

  // Verify payment with Toss Payments API
  const response = await fetch(
    "https://api.tosspayments.com/v1/payments/confirm",
    {
      method: "POST",
      body: JSON.stringify({
        orderId: result.data.orderId,
        amount: result.data.amount,
        paymentKey: result.data.paymentKey,
      }),
      headers: {
        Authorization: encryptedSecretKey,
        "Content-Type": "application/json",
      },
    },
  );
  
  // Parse API response
  const data = await response.json();
  
  // Handle API errors by redirecting to failure page with error details
  if (response.status !== 200 && data.code && data.message) {
    throw redirect(
      `/payments/failure?code=${encodeURIComponent(data.code)}&message=${encodeURIComponent(data.message)}`,
    );
  }
  
  // Validate API response structure
  const paymentResponse = paymentResponseSchema.safeParse(data);
  if (!paymentResponse.success) {
    throw redirect(
      `/payments/failure?code=${encodeURIComponent("validation-error")}&message=${encodeURIComponent("Invalid response from Toss")}`,
    );
  }
  
  // CRITICAL SECURITY CHECK: Validate payment amount
  // This prevents attackers from manipulating the payment amount
  // 🚨⚠️ In a production app, you would compare against the expected amount from your database
  if (paymentResponse.data.totalAmount !== 10_000) {
    throw redirect(
      `/payments/failure?code=${encodeURIComponent("validation-error")}&message=${encodeURIComponent("Invalid amount")}`,
    );
  }
  
  // Record the verified payment in the database
  await adminClient.from("payments").insert({
    payment_key: paymentResponse.data.paymentKey,
    order_id: paymentResponse.data.orderId,
    order_name: paymentResponse.data.orderName,
    total_amount: paymentResponse.data.totalAmount,
    receipt_url: paymentResponse.data.receipt.url,
    status: paymentResponse.data.status,
    approved_at: paymentResponse.data.approvedAt,
    requested_at: paymentResponse.data.requestedAt,
    metadata: paymentResponse.data.metadata,
    raw_data: data,
    user_id: user!.id,
  });
  
  // Return payment data for the success page
  return { data };
}

/**
 * Success component for displaying payment confirmation
 *
 * This component displays a confirmation page after a successful payment.
 * It shows:
 * 1. A product image (in this case, an NFT)
 * 2. A success message confirming payment verification
 * 3. The raw payment data received from Toss Payments API
 *
 * In a production application, this page would typically show more user-friendly
 * information such as order details, shipping information, and next steps.
 *
 * @param loaderData - Data from the loader containing payment information
 * @returns JSX element representing the payment success page
 */
export default function Success({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col items-center gap-20">
      {/* Main content grid - single column on mobile, two columns on desktop */}
      <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-2">
        {/* Product image section */}
        <div>
          <img
            src="/nft-2.jpg"
            alt="nft"
            className="w-full rounded-2xl object-cover"
          />
        </div>
        
        {/* Payment confirmation section */}
        <div className="flex flex-col items-start gap-10 overflow-x-scroll">
          {/* Success message */}
          <h1 className="text-center text-4xl font-semibold tracking-tight lg:text-5xl">
            Payment Complete
          </h1>
          
          {/* Explanation text */}
          <p className="text-muted-foreground text-lg font-medium">
            We have verified the payment with the Toss API.
            <br />
            <br />
            Here is the data we got from Toss.
          </p>
          
          {/* Raw payment data (for demonstration purposes) */}
          <pre className="break-all">
            {JSON.stringify(loaderData.data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
