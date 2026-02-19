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

import { eq, sql } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { redirect, useNavigate } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { payments } from "~/features/payments/schema";
import { POINT_PACKAGES } from "~/features/points/lib/packages";
import { pointTransactions, userPoints } from "~/features/points/schema";

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
  metadata: z.object({ packageId: z.string() }).passthrough(),
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
  const returnTo = url.searchParams.get("returnTo");
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
  
  // 패키지 검증: metadata의 packageId로 서버 상수 조회
  const packageId = paymentResponse.data.metadata.packageId;
  const selectedPackage = POINT_PACKAGES.find((p) => p.id === packageId);
  if (!selectedPackage) {
    throw redirect(
      `/payments/failure?code=invalid-package&message=${encodeURIComponent("유효하지 않은 패키지입니다")}`,
    );
  }

  // 금액 검증: Toss 응답 금액이 패키지 가격과 일치하는지 확인
  if (paymentResponse.data.totalAmount !== selectedPackage.price) {
    throw redirect(
      `/payments/failure?code=amount-mismatch&message=${encodeURIComponent("결제 금액이 일치하지 않습니다")}`,
    );
  }

  const totalJelly = selectedPackage.points + selectedPackage.bonusPoints;
  const safeReturnTo = returnTo?.startsWith("/") ? returnTo : null;

  // 중복 적립 방지: 동일 order_id가 이미 처리된 경우
  const [existingPayment] = await drizzle
    .select({ payment_id: payments.payment_id })
    .from(payments)
    .where(eq(payments.order_id, paymentResponse.data.orderId))
    .limit(1);

  if (existingPayment) {
    return {
      returnTo: safeReturnTo,
      totalJelly,
      packageLabel: selectedPackage.label,
    };
  }

  // Drizzle 트랜잭션: payments 삽입 + user_points upsert + point_transactions 기록
  await drizzle.transaction(async (tx) => {
    await tx.insert(payments).values({
      payment_key: paymentResponse.data.paymentKey,
      order_id: paymentResponse.data.orderId,
      order_name: paymentResponse.data.orderName,
      total_amount: paymentResponse.data.totalAmount,
      receipt_url: paymentResponse.data.receipt.url,
      status: paymentResponse.data.status,
      approved_at: new Date(paymentResponse.data.approvedAt),
      requested_at: new Date(paymentResponse.data.requestedAt),
      metadata: paymentResponse.data.metadata,
      raw_data: data,
      user_id: user!.id,
    });

    const [updatedPoints] = await tx
      .insert(userPoints)
      .values({
        user_id: user!.id,
        current_balance: totalJelly,
        total_earned: totalJelly,
        total_spent: 0,
      })
      .onConflictDoUpdate({
        target: userPoints.user_id,
        set: {
          current_balance: sql`${userPoints.current_balance} + ${totalJelly}`,
          total_earned: sql`${userPoints.total_earned} + ${totalJelly}`,
          updated_at: new Date(),
        },
      })
      .returning();

    await tx.insert(pointTransactions).values({
      user_id: user!.id,
      amount: totalJelly,
      balance_after: updatedPoints.current_balance,
      type: "charge",
      reason: `냥젤리 구매: ${selectedPackage.label} (${selectedPackage.points.toLocaleString()} + 보너스 ${selectedPackage.bonusPoints.toLocaleString()})`,
      reference_id: `payment:${paymentResponse.data.orderId}`,
    });
  });

  return {
    returnTo: safeReturnTo,
    totalJelly,
    packageLabel: selectedPackage.label,
  };
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
  const navigate = useNavigate();

  useEffect(() => {
    const returnTo = loaderData.returnTo;
    if (returnTo) {
      const timer = setTimeout(() => navigate(returnTo), 3000);
      return () => clearTimeout(timer);
    }
  }, [loaderData.returnTo, navigate]);

  return (
    <div className="flex flex-col items-center gap-10 py-20">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-[#E8FAF8]">
          <CheckCircle2 className="size-10 text-[#41C7BD]" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          젤리 충전 완료
        </h1>

        <p className="text-muted-foreground text-lg">
          <span className="text-foreground font-bold">
            {loaderData.totalJelly.toLocaleString()}젤리
          </span>
          가 충전되었습니다.
        </p>

        <p className="text-muted-foreground text-sm">
          {loaderData.packageLabel} 패키지
        </p>

        {loaderData.returnTo && (
          <p className="text-muted-foreground text-sm">
            3초 후 이전 페이지로 이동합니다...
          </p>
        )}
      </div>
    </div>
  );
}
