import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react"

import { cn } from "@/lib/utils"

/**
 * Tons de accent rail disponíveis para `RecordRow`. Reservado para uso
 * semântico (estágio do pipeline, prioridade, status) — nunca decorativo.
 */
export type RecordRowAccent =
  | "none"
  | "primary"
  | "sky"
  | "violet"
  | "amber"
  | "emerald"
  | "rose"
  | "neutral"

const ACCENT_VAR: Record<Exclude<RecordRowAccent, "none">, string> = {
  primary: "var(--crm-tone-brand)",
  sky: "var(--crm-tone-info)",
  violet: "var(--crm-tone-violet)",
  amber: "var(--crm-tone-warn)",
  emerald: "var(--crm-tone-success)",
  rose: "var(--crm-tone-danger)",
  neutral: "var(--crm-tone-neutral)",
}

type DivProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "className">
type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "className"
>

type RecordRowBaseProps = {
  accent?: RecordRowAccent
  selected?: boolean
  density?: "default" | "compact"
  className?: string
  children?: ReactNode
}

type RecordRowInteractiveProps = RecordRowBaseProps &
  ButtonProps & {
    interactive: true
  }

type RecordRowStaticProps = RecordRowBaseProps &
  DivProps & {
    interactive?: false
  }

export type RecordRowProps = RecordRowInteractiveProps | RecordRowStaticProps

function accentStyle(accent: RecordRowAccent | undefined): CSSProperties {
  if (!accent || accent === "none") {
    return { ["--crm-accent-color" as string]: "transparent" }
  }
  return { ["--crm-accent-color" as string]: ACCENT_VAR[accent] }
}

function buildBaseClass(
  accent: RecordRowAccent,
  density: "default" | "compact",
  className: string | undefined,
) {
  const isCompact = density === "compact"
  return cn(
    "crm-surface-row group/record relative flex w-full min-w-0 items-center gap-3",
    "px-3 md:px-4",
    isCompact ? "py-2" : "py-2.5",
    accent !== "none" && "crm-accent-rail pl-4 md:pl-5",
    className,
  )
}

/**
 * Linha operacional usada em listas e tabelas modernizadas do CRM.
 * Substitui o padrão "GlassCard + Table row + zebra + border-b" por
 * uma row plana, com hover único e accent rail opcional.
 *
 * Não força layout interno: utilize os subcomponentes
 * Leading/Body/Columns/Trailing para compor.
 */
const RecordRowRoot = forwardRef<HTMLElement, RecordRowProps>(
  function RecordRowRoot(props, ref) {
    const accent = props.accent ?? "none"
    const selected = props.selected ?? false
    const density = props.density ?? "default"
    const baseClass = buildBaseClass(accent, density, props.className)
    const style = accentStyle(accent)

    if (props.interactive === true) {
      const {
        accent: _accent,
        selected: _selected,
        density: _density,
        className: _className,
        interactive: _interactive,
        children,
        type,
        ...rest
      } = props
      void _accent
      void _selected
      void _density
      void _className
      void _interactive

      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type={type ?? "button"}
          data-selected={selected || undefined}
          aria-pressed={selected || undefined}
          style={style}
          className={cn(
            baseClass,
            "cursor-pointer text-left outline-none",
            "focus-visible:ring-2 focus-visible:ring-primary/30",
          )}
          {...rest}
        >
          {children}
        </button>
      )
    }

    const {
      accent: _accent,
      selected: _selected,
      density: _density,
      className: _className,
      interactive: _interactive,
      children,
      ...rest
    } = props
    void _accent
    void _selected
    void _density
    void _className
    void _interactive

    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        data-selected={selected || undefined}
        aria-selected={selected || undefined}
        style={style}
        className={baseClass}
        {...rest}
      >
        {children}
      </div>
    )
  },
)

function RecordRowLeading({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

function RecordRowBody({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("min-w-0 flex-1", className)} {...rest}>
      {children}
    </div>
  )
}

function RecordRowTitle({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("crm-text-title truncate", className)} {...rest}>
      {children}
    </p>
  )
}

function RecordRowSubtitle({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("crm-text-subtitle truncate", className)} {...rest}>
      {children}
    </p>
  )
}

function RecordRowColumns({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "hidden shrink-0 items-center gap-6 md:flex",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

function RecordRowColumn({
  className,
  children,
  label,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { label?: ReactNode }) {
  return (
    <div
      className={cn("flex min-w-0 flex-col justify-center", className)}
      {...rest}
    >
      {label ? (
        <span className="crm-text-micro tracking-wide">{label}</span>
      ) : null}
      <span className="crm-text-meta text-foreground/80 truncate">
        {children}
      </span>
    </div>
  )
}

function RecordRowTrailing({
  className,
  children,
  revealOnHover = false,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { revealOnHover?: boolean }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2",
        revealOnHover &&
          "opacity-0 transition-opacity duration-150 group-hover/record:opacity-100 group-focus-within/record:opacity-100",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

type RecordRowComponent = typeof RecordRowRoot & {
  Leading: typeof RecordRowLeading
  Body: typeof RecordRowBody
  Title: typeof RecordRowTitle
  Subtitle: typeof RecordRowSubtitle
  Columns: typeof RecordRowColumns
  Column: typeof RecordRowColumn
  Trailing: typeof RecordRowTrailing
}

export const RecordRow = RecordRowRoot as RecordRowComponent
RecordRow.Leading = RecordRowLeading
RecordRow.Body = RecordRowBody
RecordRow.Title = RecordRowTitle
RecordRow.Subtitle = RecordRowSubtitle
RecordRow.Columns = RecordRowColumns
RecordRow.Column = RecordRowColumn
RecordRow.Trailing = RecordRowTrailing
