import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { formControlClass } from "@/lib/form-control";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        formControlClass,
        "h-8 w-full min-w-0 rounded-lg border px-2.5 py-1 text-base outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed md:text-sm aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_1px_oklch(0.62_0.22_25/40%),0_0_16px_oklch(0.62_0.22_25/15%)]",
        className
      )}
      {...props}
    />
  );
}

export { Input };
