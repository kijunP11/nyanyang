/**
 * Checkout Page Component
 *
 * This file implements a payment checkout page with Toss Payments integration.
 * It demonstrates how to integrate a third-party payment processor, handle user
 * authentication requirements, and manage the payment flow securely.
 *
 * Key features:
 * - Authentication-protected checkout page
 * - Integration with Toss Payments SDK
 * - Dynamic payment widget rendering
 * - Payment agreement handling
 * - Secure payment processing with metadata
 */
import type { Route } from "./+types/checkout";

import {
  type TossPaymentsWidgets,
  loadTossPayments,
} from "@tosspayments/tosspayments-sdk";
import { Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { redirect } from "react-router";

import { Button } from "~/core/components/ui/button";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { cn } from "~/core/lib/utils";

/**
 * Meta function for setting page metadata
 *
 * This function sets the page title for the checkout page and forces a light color scheme.
 * The light color scheme is necessary because the Toss Payments iframe has styling issues
 * in dark mode, ensuring a consistent user experience during the payment process.
 *
 * @returns Array of metadata objects for the page
 */
export const meta: Route.MetaFunction = () => {
  return [
    { title: `Checkout | ${import.meta.env.VITE_APP_NAME}` },
    {
      name: "color-scheme", // We have to do this because the Toss iframe looks bad in dark mode.
      content: "light",
    },
  ];
};

/**
 * Loader function for authentication and user data fetching
 *
 * This function performs several important security and data preparation steps:
 * 1. Creates a server-side Supabase client with the user's session
 * 2. Verifies the user is authenticated (redirects to login if not)
 * 3. Retrieves the user's profile information needed for the payment process
 * 4. Returns user data for the checkout component
 *
 * Security considerations:
 * - Uses requireAuthentication to ensure only logged-in users can access checkout
 * - Double-checks user existence even after authentication check
 * - Only returns necessary user information for the payment process
 *
 * @param request - The incoming HTTP request containing session information
 * @returns Object with user ID, name, and email for payment processing
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

  // Return only the necessary user information for payment processing
  return {
    userId: user!.id,
    userName: user!.user_metadata.name,
    userEmail: user!.email,
  };
}

/**
 * Checkout component for handling payment processing
 *
 * This component integrates with the Toss Payments SDK to provide a complete
 * payment experience. It handles initializing the payment widgets, rendering
 * payment methods, managing user agreements, and processing the payment request.
 *
 * @param loaderData - User data from the loader function (ID, name, email)
 * @returns JSX element representing the checkout page
 */
export default function Checkout({ loaderData }: Route.ComponentProps) {
  // References to track Toss Payments widgets and initialization status
  const widgets = useRef<TossPaymentsWidgets | null>(null);
  const initedToss = useRef<boolean>(false);

  // State for tracking payment agreement status and payment readiness
  const [agreementStatus, setAgreementStatus] = useState<boolean>(true);
  const [canPay, setCanPay] = useState<boolean>(false);

  /**
   * Effect for initializing Toss Payments SDK and rendering payment widgets
   *
   * This effect runs once on component mount and performs the following steps:
   * 1. Loads the Toss Payments SDK with the client key
   * 2. Initializes the payment widgets with the user's ID as the customer key
   * 3. Sets the payment amount (10,000 KRW)
   * 4. Renders the payment method selection and agreement widgets
   * 5. Sets up event listeners for agreement status changes
   */
  useEffect(() => {
    async function initToss() {
      // Prevent multiple initializations
      if (initedToss.current) return;
      initedToss.current = true;

      // Load Toss Payments SDK with client key from environment variables
      const toss = await loadTossPayments(
        import.meta.env.VITE_TOSS_PAYMENTS_CLIENT_KEY,
      );

      // Initialize widgets with user ID as customer key for tracking
      widgets.current = await toss.widgets({
        customerKey: loaderData.userId,
      });

      // Set the payment amount and currency
      await widgets.current.setAmount({
        value: 10_000,
        currency: "KRW",
      });

      // Render payment method selection and agreement widgets in parallel
      const [paymentMethods, agreement] = await Promise.all([
        widgets.current.renderPaymentMethods({
          selector: "#toss-payment-methods",
          variantKey: "DEFAULT",
        }),
        widgets.current.renderAgreement({
          selector: "#toss-payment-agreement",
          variantKey: "AGREEMENT",
        }),
      ]);

      // Listen for changes in agreement status to enable/disable payment button
      agreement.on("agreementStatusChange", ({ agreedRequiredTerms }) => {
        setAgreementStatus(agreedRequiredTerms);
      });

      // Enable the payment button once everything is loaded
      setCanPay(true);
    }

    // Initialize Toss Payments
    initToss();
  }, []);
  /**
   * Handle payment button click
   *
   * This function initiates the payment process when the user clicks the payment button.
   * It performs the following steps:
   * 1. Ensures light mode for the payment iframe
   * 2. Requests payment through the Toss Payments SDK
   * 3. Provides order details, customer information, and metadata
   * 4. Sets up success and failure redirect URLs
   * 5. Handles any errors that occur during the payment process
   */
  const handleClick = async () => {
    try {
      // Force light mode for the payment iframe to ensure proper display
      const metaTags = document.querySelectorAll('meta[name="color-scheme"]');
      metaTags.forEach((tag) => {
        tag.setAttribute("content", "light");
      });

      // Request payment through Toss Payments SDK
      await widgets.current?.requestPayment({
        // Display payment in an iframe rather than a popup
        windowTarget: "iframe",

        // Generate a unique order ID
        // 🚨⚠️ In a production app, this should come from your database
        // If you had a 'shopping cart' you would bring the order id from the shopping cart
        orderId: crypto.randomUUID(),

        // Order details
        orderName: `Supabase Beagle NFT`,

        // Customer information from authenticated user
        customerEmail: loaderData.userEmail,
        customerName: loaderData.userName,

        // Additional metadata about the order
        // 🚨⚠️ This would typically contain product IDs or other order details
        metadata: {
          nftId: "beagle-nft-#123",
        },

        // Redirect URLs for payment completion
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/failure`,
      });
    } catch (error) {
      console.error(error);
    }
  };
  /**
   * Render the checkout page with product details and payment widgets
   *
   * The checkout page layout consists of:
   * 1. Product image and details section (left side on desktop)
   * 2. Payment processing section (right side on desktop)
   *    - Loading indicator while payment widgets initialize
   *    - Payment method selection widget
   *    - Terms and conditions agreement widget
   *    - Payment button (disabled until agreement is accepted)
   */
  return (
    <div className="flex flex-col items-center gap-20">
      {/* Main product and payment grid - single column on mobile, two columns on desktop */}
      <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-2">
        {/* Product image section */}
        <div>
          <img
            src="/nft.jpg"
            alt="nft"
            className="h-full w-full rounded-2xl object-cover"
          />
        </div>

        {/* Product details and payment section */}
        <div className="flex flex-col items-start gap-10">
          {/* Product title */}
          <h1 className="text-center text-4xl font-semibold tracking-tight lg:text-5xl">
            Beagle NFT
          </h1>

          {/* Demo information */}
          <p className="text-muted-foreground text-lg font-medium">
            This is a page to demo the Toss Payments integration.
            <br />
            You aren't actually buying anything.
          </p>

          {/* Loading indicator while payment widgets initialize */}
          {!canPay ? (
            <div className="flex w-full flex-col items-center justify-center gap-2">
              <Loader2Icon className="text-muted-foreground size-10 animate-spin" />
              <span className="text-muted-foreground text-lg">
                결제 수단을 불러오는 중...
              </span>
            </div>
          ) : null}

          {/* Payment widgets container - fades in when ready */}
          <div
            className={cn(
              "flex w-full flex-col gap-5 transition-opacity duration-300",
              canPay ? "opacity-100" : "opacity-0",
            )}
          >
            {/* Container for Toss payment widgets */}
            <div className="border-border w-full overflow-hidden rounded-2xl border md:p-4">
              {/* Payment methods widget - rendered by Toss SDK */}
              <div
                id="toss-payment-methods"
                className="bg-background overflow-hidden rounded-t-2xl"
              />

              {/* Payment agreement widget - rendered by Toss SDK */}
              <div
                id="toss-payment-agreement"
                className="bg-background overflow-hidden rounded-b-2xl"
              />
            </div>

            {/* Payment button - disabled until agreement is accepted */}
            {canPay ? (
              <Button
                className="w-full rounded-2xl py-7.5 text-lg dark:bg-white"
                size={"lg"}
                onClick={handleClick}
                disabled={!agreementStatus}
              >
                Buy for 10,000원
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
