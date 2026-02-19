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
import { POINT_PACKAGES } from "~/features/points/lib/packages";

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

  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo");

  const packageId = url.searchParams.get("package");
  const selectedPackage = POINT_PACKAGES.find((p) => p.id === packageId);
  if (!selectedPackage) {
    throw redirect(
      `/payments/failure?code=invalid-package&message=${encodeURIComponent("유효하지 않은 패키지입니다")}`,
    );
  }

  return {
    userId: user!.id,
    userName: user!.user_metadata.name,
    userEmail: user!.email,
    returnTo: returnTo?.startsWith("/") ? returnTo : null,
    package: {
      id: selectedPackage.id,
      price: selectedPackage.price,
      points: selectedPackage.points,
      bonusPoints: selectedPackage.bonusPoints,
      label: selectedPackage.label,
    },
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

  const [agreementStatus, setAgreementStatus] = useState<boolean>(true);
  const [canPay, setCanPay] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function initToss() {
      if (initedToss.current) return;
      initedToss.current = true;

      try {
        const clientKey = import.meta.env.VITE_TOSS_PAYMENTS_CLIENT_KEY;
        if (!clientKey) {
          throw new Error("VITE_TOSS_PAYMENTS_CLIENT_KEY가 설정되지 않았습니다");
        }

        const toss = await loadTossPayments(clientKey);

        widgets.current = await toss.widgets({
          customerKey: loaderData.userId,
        });

        await widgets.current.setAmount({
          value: loaderData.package.price,
          currency: "KRW",
        });

        const [, agreement] = await Promise.all([
          widgets.current.renderPaymentMethods({
            selector: "#toss-payment-methods",
            variantKey: "DEFAULT",
          }),
          widgets.current.renderAgreement({
            selector: "#toss-payment-agreement",
            variantKey: "AGREEMENT",
          }),
        ]);

        agreement.on("agreementStatusChange", ({ agreedRequiredTerms }) => {
          setAgreementStatus(agreedRequiredTerms);
        });

        setCanPay(true);
      } catch (error) {
        console.error("Toss 결제 초기화 실패:", error);
        setInitError(
          error instanceof Error ? error.message : "결제 수단을 불러오지 못했습니다",
        );
      }
    }

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

        orderId: crypto.randomUUID(),
        orderName: `냥젤리 ${loaderData.package.points.toLocaleString()}개`,
        customerEmail: loaderData.userEmail,
        customerName: loaderData.userName,
        metadata: {
          packageId: loaderData.package.id,
        },

        // Redirect URLs for payment completion (returnTo 있으면 결제 완료 후 복귀)
        successUrl:
          loaderData.returnTo != null
            ? `${window.location.origin}/payments/success?returnTo=${encodeURIComponent(loaderData.returnTo)}`
            : `${window.location.origin}/payments/success`,
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
  const pkg = loaderData.package;
  const totalJelly = pkg.points + pkg.bonusPoints;

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex w-full max-w-lg flex-col gap-6">
        {/* 패키지 정보 */}
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            냥젤리 {pkg.label} 패키지
          </h1>
          <p className="text-muted-foreground text-sm">
            {pkg.points.toLocaleString()}젤리
            {pkg.bonusPoints > 0 && (
              <span className="text-[#41C7BD]">
                {" "}+ 보너스 {pkg.bonusPoints.toLocaleString()}젤리
              </span>
            )}
          </p>
          <p className="text-lg font-bold">
            총 {totalJelly.toLocaleString()}젤리
          </p>
        </div>

        {/* Loading / Error indicator */}
        {!canPay ? (
          <div className="flex w-full flex-col items-center justify-center gap-2 py-6">
            {initError ? (
              <p className="text-destructive text-sm text-center">{initError}</p>
            ) : (
              <>
                <Loader2Icon className="text-muted-foreground size-10 animate-spin" />
                <span className="text-muted-foreground text-lg">
                  결제 수단을 불러오는 중...
                </span>
              </>
            )}
          </div>
        ) : null}

        {/* Toss 결제 위젯 */}
        <div
          className={cn(
            "flex w-full flex-col gap-5 transition-opacity duration-300",
            canPay ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="border-border w-full overflow-hidden rounded-2xl border">
            <div
              id="toss-payment-methods"
              className="bg-background overflow-hidden rounded-t-2xl"
            />
            <div
              id="toss-payment-agreement"
              className="bg-background overflow-hidden rounded-b-2xl"
            />
          </div>

          {canPay ? (
            <Button
              className="w-full rounded-2xl py-7.5 text-lg dark:bg-white"
              size={"lg"}
              onClick={handleClick}
              disabled={!agreementStatus}
            >
              {pkg.price.toLocaleString()}원 결제하기
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
