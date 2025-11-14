/**
 * FormButton Component
 *
 * A reusable button component specifically designed for form submissions that:
 * 1. Automatically displays a loading spinner when a form is being submitted
 * 2. Disables itself during form submission to prevent multiple submissions
 * 3. Extends the base Button component with form-specific behavior
 *
 * This component is used throughout the application for consistent form submission UX,
 * providing visual feedback to users during async operations.
 */
import { Loader2Icon } from "lucide-react";
import { useNavigation } from "react-router";

import { cn } from "../lib/utils";
import { Button } from "./ui/button";

/**
 * FormButton component for form submissions with loading state
 * 
 * This component enhances the base Button component with form submission awareness,
 * automatically showing a loading spinner and disabling the button during submission.
 * 
 * @param label - The text to display on the button when not submitting
 * @param className - Optional CSS classes to apply to the button
 * @param props - Additional button props passed to the underlying Button component
 * @returns A button component that shows loading state during form submission
 */
export default function FormButton({
  label,
  className,
  ...props
}: { label: string; className?: string } & React.ComponentProps<"button">) {
  // Get the current navigation state from React Router
  const navigation = useNavigation();
  
  // Determine if a form is currently being submitted
  const submitting = navigation.state === "submitting";
  
  return (
    <Button
      className={cn(className)}
      type="submit"
      disabled={submitting} // Disable the button during submission to prevent multiple clicks
      {...props}
    >
      {/* Show a spinning loader icon during submission, otherwise show the label */}
      {submitting ? <Loader2Icon className="size-4 animate-spin" /> : label}
    </Button>
  );
}
