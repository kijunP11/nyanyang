/**
 * Payments History Page Component
 *
 * This file implements a payment history page that displays a user's past payments.
 * It demonstrates how to fetch and display payment records from the database,
 * with proper authentication protection and data formatting.
 *
 * Key features:
 * - Authentication protection to prevent unauthorized access
 * - Database query for user-specific payment history
 * - Responsive table layout for payment records
 * - Empty state handling with call-to-action
 * - Proper formatting of currency and dates
 */

import type { Route } from "./+types/payments";

import { Link } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Card } from "~/core/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/core/components/ui/table";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getPayments } from "../queries"; // Database query function for payments

/**
 * Meta function for setting page metadata
 *
 * This function sets the page title for the payments history page,
 * indicating to the user that they are viewing their payment history.
 *
 * @returns Array of metadata objects for the page
 */
export const meta: Route.MetaFunction = () => {
  return [{ title: `Payments | ${import.meta.env.VITE_APP_NAME}` }];
};

/**
 * Loader function for fetching payment history
 *
 * This function performs several key operations:
 * 1. Authenticates the user to prevent unauthorized access
 * 2. Retrieves the authenticated user's information
 * 3. Fetches the user's payment history from the database
 * 4. Returns the payment data for display in the component
 *
 * Security considerations:
 * - Requires authentication to access payment history
 * - Only returns payments belonging to the authenticated user
 * - Uses type-safe database query function
 *
 * @param request - The incoming HTTP request with session information
 * @returns Object with the user's payment history
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
  
  // Fetch the user's payment history from the database
  // Note: Only fetches payments belonging to the authenticated user
  const payments = await getPayments(client, { userId: user!.id });
  
  // Return payment data for the component
  return { payments };
}

/**
 * Payments component for displaying payment history
 *
 * This component displays a user's payment history in a responsive table format.
 * It handles two main states:
 * 1. Empty state - When the user has no payment history
 * 2. Data state - When the user has payment records to display
 *
 * The table includes key payment information:
 * - Order ID for reference
 * - Payment status
 * - Product name
 * - Payment amount (formatted as currency)
 * - Payment date (localized format)
 * - Link to payment receipt
 *
 * @param loaderData - Data from the loader containing payment history
 * @returns JSX element representing the payments history page
 */
export default function Payments({ loaderData }: Route.ComponentProps) {
  // Extract payment history from loader data
  const { payments } = loaderData;
  
  return (
    <div className="flex w-full flex-col items-center gap-10 pt-0 pb-8">
      {/* Card container for payment history */}
      <Card className="w-full max-w-screen-xl p-8">
        {/* Handle empty state when no payments exist */}
        {payments.length === 0 ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-lg">No payments found.</p>
            <Button asChild>
              <Link to="/payments/checkout">Make a test payment &rarr;</Link>
            </Button>
          </div>
        ) : (
          /* Payment history table */
          <Table>
            <TableCaption>A list of your recent payments.</TableCaption>
            
            {/* Table header with column titles */}
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Order ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Receipt</TableHead>
              </TableRow>
            </TableHeader>
            
            {/* Table body with payment records */}
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.payment_id}>
                  {/* Order ID column */}
                  <TableCell className="font-medium">
                    {payment.order_id}
                  </TableCell>
                  
                  {/* Payment status column */}
                  <TableCell>{payment.status}</TableCell>
                  
                  {/* Product name column */}
                  <TableCell>{payment.order_name}</TableCell>
                  
                  {/* Amount column with currency formatting */}
                  <TableCell>
                    {payment.total_amount.toLocaleString("en-US", {
                      style: "currency",
                      currency: "KRW",
                    })}
                  </TableCell>
                  
                  {/* Date column with localized formatting */}
                  <TableCell>
                    {new Date(payment.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </TableCell>
                  
                  {/* Receipt link column */}
                  <TableCell>
                    <Link
                      to={payment.receipt_url}
                      target="_blank"
                      className="hover:underline"
                    >
                      View receipt &rarr;
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
