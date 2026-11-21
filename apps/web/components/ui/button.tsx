import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const actionFocus =
  "focus-visible:border-[var(--avila-action-focus)] focus-visible:ring-3 focus-visible:ring-[var(--avila-action-focus)]/45"

const primaryAction = `bg-[var(--avila-action-primary)] text-[var(--avila-action-primary-foreground)] shadow-none hover:bg-[var(--avila-action-primary-hover)] hover:text-[var(--avila-action-primary-foreground)] ${actionFocus}`
const successAction = `bg-[var(--avila-action-success)] text-[var(--avila-action-success-foreground)] shadow-none hover:bg-[var(--avila-action-success-hover)] hover:text-[var(--avila-action-success-foreground)] ${actionFocus}`
const infoAction = `bg-[var(--avila-action-info)] text-[var(--avila-action-info-foreground)] shadow-none hover:bg-[var(--avila-action-info-hover)] hover:text-[var(--avila-action-info-foreground)] ${actionFocus}`
const dangerAction = `bg-[var(--avila-action-danger)] text-[var(--avila-action-danger-foreground)] shadow-none hover:bg-[var(--avila-action-danger-hover)] hover:text-[var(--avila-action-danger-foreground)] focus-visible:border-[var(--avila-action-danger)] focus-visible:ring-3 focus-visible:ring-[var(--avila-action-danger)]/35`

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap outline-none select-none transition-[color,background-color,box-shadow,transform,border-color,filter] duration-200 ease-out active:not-aria-[haspopup]:translate-y-px active:not-aria-[haspopup]:brightness-95 disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-[var(--avila-action-disabled)] disabled:text-[var(--avila-action-disabled-foreground)] disabled:opacity-100 disabled:shadow-none aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: primaryAction,
        primary: primaryAction,
        convert: primaryAction,
        success: successAction,
        create: successAction,
        save: successAction,
        contact: successAction,
        info: infoAction,
        edit: infoAction,
        view: infoAction,
        schedule: infoAction,
        import: infoAction,
        export: infoAction,
        whatsapp:
          `bg-[var(--avila-action-whatsapp)] text-[var(--avila-action-whatsapp-foreground)] shadow-none hover:bg-[var(--avila-action-whatsapp-hover)] hover:text-[var(--avila-action-whatsapp-foreground)] ${actionFocus}`,
        warning:
          `bg-[var(--avila-action-warning)] text-[var(--avila-action-warning-foreground)] shadow-none hover:bg-[var(--avila-action-warning-hover)] hover:text-[var(--avila-action-warning-foreground)] focus-visible:border-[var(--avila-action-warning)] focus-visible:ring-3 focus-visible:ring-[var(--avila-action-warning)]/35`,
        danger: dangerAction,
        delete: dangerAction,
        outline:
          "border-border bg-background text-foreground shadow-none hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "border-border bg-secondary text-secondary-foreground shadow-none hover:bg-muted hover:text-foreground aria-expanded:bg-muted",
        ghost:
          "bg-transparent text-foreground hover:bg-foreground/10 hover:text-foreground aria-expanded:bg-foreground/10",
        crmPrimary:
          "rounded-full border-[#10294B] bg-[#10294B] text-white shadow-none hover:border-[#0c2448] hover:bg-[#0c2448] hover:text-white focus-visible:border-[#10294B] focus-visible:ring-2 focus-visible:ring-[#10294B]/30",
        crmSecondary:
          "rounded-full border-[#D6CFC4] bg-white text-[#10294B] shadow-none hover:border-[#C09048] hover:bg-[#FBF6EF] hover:text-[#10294B] focus-visible:border-[#10294B] focus-visible:ring-2 focus-visible:ring-[#10294B]/30",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-2 px-3.5! has-data-[icon=inline-end]:pr-3! has-data-[icon=inline-start]:pl-3!",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2! text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5! has-data-[icon=inline-start]:pl-1.5! [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-[min(var(--radius-md),12px)] px-3! text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2.5! has-data-[icon=inline-start]:pl-2.5! [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-4! has-data-[icon=inline-end]:pr-3.5! has-data-[icon=inline-start]:pl-3.5!",
        icon: "size-9",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-10",
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
    void _render
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
