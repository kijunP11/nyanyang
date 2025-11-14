/**
 * Fetcher Form Button Component
 *
 * A specialized button component designed for use with React Router's useFetcher hook.
 * Unlike the standard FormButton which uses useNavigation to automatically detect form
 * submission state, this component accepts a submitting prop that can be controlled
 * by the parent component using a fetcher's state.
 *
 * This component is useful for forms that need to submit data without causing a full
 * navigation, such as background data updates, optimistic UI updates, or forms within
 * modals that shouldn't cause page transitions.
 *
 * Features:
 * - Displays a loading spinner when in submitting state
 * - Disables the button during submission to prevent multiple clicks
 * - Extends the base Button component with fetcher-specific behavior
 * - Allows manual control of the submitting state
 *
 * Example usage with useFetcher:
 * - Create a fetcher with useFetcher()
 * - Track submission state with fetcher.state
 * - Use inside fetcher.Form component
 * - Pass submitting state to control loading indicator
 */
import { Loader2Icon } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./ui/button";

/**
 * A button component specifically designed for use with React Router's useFetcher
 *
 * This component displays a loading spinner when in the submitting state and
 * automatically disables itself to prevent multiple submissions. It's ideal for
 * forms that need to submit data without causing a full navigation.
 *
 * @param label - The text to display on the button when not submitting
 * @param className - Optional CSS classes to apply to the button
 * @param submitting - Boolean indicating if the form is currently submitting
 * @param props - Additional button props passed to the underlying Button component
 */
export default function FetcherFormButton({
  label,
  className,
  submitting,
  ...props
}: {
  label: string;
  className?: string;
  submitting: boolean;
} & React.ComponentProps<"button">) {
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
