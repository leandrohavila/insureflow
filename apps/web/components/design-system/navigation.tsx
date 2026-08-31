import type { ComponentProps, ReactNode } from "react"

import { actionIcons, dsLayout, dsTypography } from "@/lib/design-system"
import { cn } from "@/lib/utils"

import { formSelectClassName } from "./forms"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type PageHeaderProps = Omit<ComponentProps<"header">, "title"> & {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  breadcrumbs?: ReactNode
  actions?: ReactNode
  /** Remove descrição e reduz ritmo vertical — páginas operacionais CRM. */
  compact?: boolean
}

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  compact = false,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        compact ? dsLayout.pageHeader.compact.className : dsLayout.pageHeader.className,
        className,
      )}
      {...props}
    >
      {breadcrumbs ? (
        <nav className={dsTypography.role.meta} aria-label="Breadcrumb">
          {breadcrumbs}
        </nav>
      ) : null}
      {!compact && eyebrow ? (
        <div className={dsTypography.role.micro}>{eyebrow}</div>
      ) : null}
      <div className={dsLayout.pageHeader.titleRow.className}>
        <div className={cn(dsLayout.pageHeader.content.className, compact && "space-y-0")}>
          <h1 className={cn(dsTypography.role.pageTitle, compact && "text-xl")}>{title}</h1>
          {!compact && description ? (
            <p className={cn(dsTypography.role.muted, "max-w-[var(--if-layout-reading-prose-max)]")}>
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className={dsLayout.pageHeader.actions.className}>{actions}</div>
        ) : null}
      </div>
    </header>
  )
}

export type PageActionsProps = ComponentProps<"div">

export function PageActions({ className, ...props }: PageActionsProps) {
  return <div className={cn(dsLayout.pageActions.className, className)} {...props} />
}

export type PageActionsGroupVariant = "default" | "primary"

export type PageActionsGroupProps = ComponentProps<"div"> & {
  variant?: PageActionsGroupVariant
}

export function PageActionsGroup({
  variant = "default",
  className,
  ...props
}: PageActionsGroupProps) {
  return (
    <div
      className={cn(
        variant === "primary"
          ? dsLayout.pageActionsGroupPrimary.className
          : dsLayout.pageActionsGroup.className,
        className,
      )}
      {...props}
    />
  )
}

export type ToolbarProps = ComponentProps<"div"> & {
  leading?: ReactNode
  trailing?: ReactNode
}

export function Toolbar({ leading, trailing, className, children, ...props }: ToolbarProps) {
  return (
    <div className={cn(dsLayout.toolbar.className, className)} {...props}>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-[var(--if-layout-control-gap)]">
        {leading}
        {children}
      </div>
      {trailing ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-[var(--if-layout-control-gap)]">
          {trailing}
        </div>
      ) : null}
    </div>
  )
}

export type FilterBarProps = ToolbarProps & {
  activeCount?: number
  onClear?: () => void
  clearLabel?: string
}

export function FilterBar({
  activeCount = 0,
  onClear,
  clearLabel = "Limpar filtros",
  trailing,
  className,
  children,
  ...props
}: FilterBarProps) {
  const clearAction =
    onClear && activeCount > 0 ? (
      <Button type="button" variant="ghost" size="sm" onClick={onClear}>
        {clearLabel}
      </Button>
    ) : null

  return (
    <div className={cn(dsLayout.filterBar.className, className)} {...props}>
      {children}
      {trailing}
      {clearAction}
    </div>
  )
}

export type FilterSearchProps = Omit<ComponentProps<typeof Input>, "type"> & {
  label?: string
  /** Quando false, o campo não expande — útil para filtros secundários (ex.: origem). */
  grow?: boolean
  containerClassName?: string
}

const SearchIcon = actionIcons.search

export function FilterSearch({
  label = "Buscar",
  grow = true,
  containerClassName,
  className,
  ...props
}: FilterSearchProps) {
  return (
    <label
      className={cn(
        "relative block min-w-0",
        grow ? "min-w-[12rem] flex-1 basis-[16rem]" : "shrink-0",
        containerClassName,
      )}
    >
      <span className="sr-only">{label}</span>
      <SearchIcon
        className="pointer-events-none absolute left-[var(--if-space-3)] top-1/2 size-[var(--if-icon-md)] -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        className={cn("h-[var(--if-control-height-md)] w-full pl-[var(--if-space-10)]", className)}
        type="search"
        {...props}
      />
    </label>
  )
}

export type FilterSelectOption = {
  label: string
  value: string
}

export type FilterSelectProps = Omit<ComponentProps<"select">, "children"> & {
  label: string
  options: FilterSelectOption[]
}

export function FilterSelect({
  label,
  options,
  className,
  ...props
}: FilterSelectProps) {
  return (
    <label className="grid gap-[var(--if-space-1)]">
      <span className="sr-only">{label}</span>
      <select
        className={cn(
          formSelectClassName,
          "h-[var(--if-control-height-md)] min-w-[var(--if-control-min-width)] rounded-[var(--if-radius-md)] border-input/80 bg-popover px-[var(--if-space-3)]",
          className,
        )}
        aria-label={label}
        {...props}
      >
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
    </label>
  )
}
