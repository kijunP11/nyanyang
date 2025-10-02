/**
 * FormSuccess Component
 *
 * A reusable component for displaying success messages after form submissions.
 * This component renders a success message with a consistent styling and
 * visual indicator (check-circle icon) to clearly communicate successful actions to users.
 *
 * Used throughout the application to provide consistent success feedback in forms,
 * including:
 * - Successful form submissions
 * - Successful authentication actions
 * - Successful data updates
 * - Confirmation of completed operations
 */
import { CheckCircle2Icon } from "lucide-react";

/**
 * FormSuccess component for displaying success messages
 * 
 * This component renders a success message with a check-circle icon in green,
 * providing consistent visual feedback for successful operations throughout the application.
 * 
 * @param message - The success message to display
 * @returns A component that displays the success message with consistent styling
 */
export default function FormSuccess({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-green-500">
      {/* Check-circle icon to visually indicate success */}
      <CheckCircle2Icon className="size-4" />
      {/* The success message text */}
      <p>{message}</p>
    </div>
  );
}
