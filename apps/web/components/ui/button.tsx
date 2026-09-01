import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap outline-none select-none transition-[color,background-color,box-shadow,transform,border-color] duration-200 ease-out focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--avila-navy-800)] text-[var(--avila-ivory)] shadow-none hover:bg-[var(--avila-navy-900)] hover:text-[var(--avila-ivory)] dark:bg-[var(--avila-navy-800)] dark:text-[var(--avila-ivory)] dark:hover:bg-[#16345e]",
        outline:
          "border-border/80 bg-background/60 backdrop-blur-sm hover:border-primary/25 hover:bg-muted/80 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/25 dark:hover:bg-input/45",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 hover:shadow-md aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-white/[0.06] hover:text-foreground aria-expanded:bg-white/[0.06] dark:hover:bg-white/[0.06]",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonPrimitive.Props & VariantProps<typeof buttonVariants>
>(function Button(
  { className, variant = "default", size = "default", type, ...props },
  ref,
) {
  const classes = cn(buttonVariants({ variant, size, className }))
  const resolvedType = type ?? "button"

  // Base UI Button always merges `type: "button"` after consumer props, which
  // breaks native form submission. Use a plain <button> for submit/reset.
  if (resolvedType === "submit" || resolvedType === "reset") {
    const { render: _render, style, ...nativeProps } = props
    const nativeStyle = typeof style === "function" ? undefined : style

    return (
      <button
        ref={ref}
        type={resolvedType}
        data-slot="button"
        className={classes}
        style={nativeStyle}
        {...(nativeProps as React.ComponentProps<"button">)}
      />
    )
  }

  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      type={resolvedType}
      className={classes}
      {...props}
    />
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }
