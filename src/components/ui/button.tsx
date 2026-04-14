import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "rounded-[20px] bg-[#0F766E] text-white hover:bg-[#0F766E]/90 active:scale-[0.98]",
        outline:
          "rounded-[20px] border border-[#79747E] text-[#0F766E] hover:bg-[#F7F2FA] active:scale-[0.98]",
        secondary:
          "rounded-[20px] bg-[#E8DEF8] text-[#1D192B] hover:bg-[#E8DEF8]/80 active:scale-[0.98]",
        ghost:
          "rounded-full hover:bg-[#F3EDF7] hover:text-[#1D1B20] active:scale-[0.98]",
        destructive:
          "rounded-[20px] bg-[#B3261E] text-white hover:bg-[#B3261E]/90 active:scale-[0.98]",
        link: "text-[#0F766E] underline-offset-4 hover:underline",
        tonal:
          "rounded-[20px] bg-[#CCE8E4] text-[#00201D] hover:bg-[#CCE8E4]/80 active:scale-[0.98]",
      },
      size: {
        default:
          "h-10 px-6",
        xs: "h-7 px-3 text-xs",
        sm: "h-8 px-4 text-[0.8rem]",
        lg: "h-12 px-8 text-base",
        icon: "size-10 rounded-full",
        "icon-xs":
          "size-7 rounded-full",
        "icon-sm":
          "size-8 rounded-full",
        "icon-lg": "size-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
