import * as React from "react";

import { cn } from "~/core/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[#A7EADD] focus-visible:ring-[#D3F4EF] focus-visible:ring-[4px]",
        "aria-invalid:border-[#FDA29B] aria-invalid:ring-[4px] aria-invalid:ring-[#FEE4E2] dark:aria-invalid:border-[#FDA29B] dark:aria-invalid:ring-[#FEE4E2]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
