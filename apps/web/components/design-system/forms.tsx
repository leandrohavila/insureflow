import { cloneElement, isValidElement, type ComponentProps, type ReactNode } from "react"

import { cn } from "@/lib/utils"

export const formSelectClassName =
  "flex h-9 w-full min-w-0 truncate rounded-md border border-input bg-popover px-3 py-1 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"

export type FormSelectOption = {
  label: string
  value: string
}

export type FormSelectProps = Omit<ComponentProps<"select">, "children"> & {
  options: FormSelectOption[]
}

export function FormSelect({ options, className, ...props }: FormSelectProps) {
  return (
    <select className={cn(formSelectClassName, className)} {...props}>
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="bg-popover text-popover-foreground"
        >
          {option.label}
        </option>
      ))}
    </select>
  )
}

export type FormLayoutProps = ComponentProps<"div"> & {
  columns?: "1" | "2"
}

export function FormLayout({ columns = "2", className, ...props }: FormLayoutProps) {
  return (
    <div
      className={cn(
        "grid gap-[var(--if-space-4)]",
        columns === "2" && "sm:grid-cols-2",
        className,
      )}
      {...props}
    />
  )
}

export type FormFieldProps = ComponentProps<"div"> & {
  label: ReactNode
  htmlFor?: string
  helpText?: ReactNode
  error?: ReactNode
  hint?: ReactNode
  required?: boolean
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

export function FormField({
  label,
  htmlFor,
  helpText,
  error,
  hint,
  required,
  loading,
  disabled,
  fullWidth,
  className,
  children,
  ...props
}: FormFieldProps) {
  const description = error ?? helpText ?? hint
  const descriptionId = htmlFor && description ? `${htmlFor}-description` : undefined
  const control = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children, {
        "aria-describedby": descriptionId ?? children.props["aria-describedby"],
        "aria-invalid": error ? true : children.props["aria-invalid"],
        "aria-required": required ? true : children.props["aria-required"],
        disabled: disabled ? true : children.props.disabled,
      })
    : children

  return (
    <div
      className={cn(
        "grid gap-[var(--if-space-2)]",
        fullWidth && "sm:col-span-2",
        disabled && "opacity-[var(--if-opacity-disabled)]",
        className,
      )}
      data-loading={loading || undefined}
      data-disabled={disabled || undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium leading-none text-muted-foreground"
      >
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>
      {control}
      {description ? (
        <p
          id={descriptionId}
          className={cn(
            "text-xs leading-relaxed",
            error ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}
