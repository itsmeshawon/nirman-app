import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-[var(--m3-outline)] bg-transparent px-4 py-2 text-base transition-all outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:border-[2px] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-[var(--destructive)] md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
