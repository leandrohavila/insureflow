import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-md border border-border bg-background px-3 text-base text-[#000C24] outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-11 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}
