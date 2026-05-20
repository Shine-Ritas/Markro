import * as React from "react";

import { formControlClass } from "@/lib/form-control";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        formControlClass,
        "field-sizing-content flex min-h-16 w-full rounded-lg border px-2.5 py-2 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_1px_oklch(0.62_0.22_25/40%),0_0_16px_oklch(0.62_0.22_25/15%)]",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
