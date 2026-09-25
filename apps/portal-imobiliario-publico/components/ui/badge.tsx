import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full bg-[#E6E8EC] px-2.5 py-1 text-xs font-medium text-[#10294B]",
        className,
      )}
      {...props}
    />
  );
}
