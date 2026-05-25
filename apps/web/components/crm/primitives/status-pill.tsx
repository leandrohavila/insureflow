import type { ComponentType, HTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/utils"

export type StatusPillTone =
  | "neutral"
  | "brand"
  | "info"
  | "success"
  | "warn"
  | "danger"
  | "violet"

export type StatusPillVariant = "soft" | "outline" | "solid" | "ghost"

export type StatusPillSize = "xs" | "sm"

type StatusPillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: StatusPillTone
  variant?: StatusPillVariant
  size?: StatusPillSize
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>
  /** Renderiza um dot circular antes do label (independente de `icon`). */
  dot?: boolean
  children?: ReactNode
}

const TONE_STYLES: Record<
  StatusPillTone,
  { soft: string; outline: string; solid: string; ghost: string; dot: string }
> = {
  neutral: {
    soft: "bg-white/[0.05] text-foreground/75 ring-white/10",
    outline: "border-white/10 text-foreground/70",
    solid: "bg-foreground/85 text-background ring-foreground/10",
    ghost: "text-foreground/65",
    dot: "bg-foreground/45",
  },
  brand: {
    soft: "bg-primary/14 text-primary ring-primary/25",
    outline: "border-primary/30 text-primary",
    solid: "bg-primary text-primary-foreground ring-primary/40",
    ghost: "text-primary",
    dot: "bg-primary",
  },
  info: {
    soft: "bg-sky-500/12 text-sky-300 ring-sky-500/25",
    outline: "border-sky-400/30 text-sky-300",
    solid: "bg-sky-500 text-white ring-sky-500/35",
    ghost: "text-sky-300",
    dot: "bg-sky-400",
  },
  success: {
    soft: "bg-emerald-500/12 text-emerald-300 ring-emerald-500/25",
    outline: "border-emerald-400/30 text-emerald-300",
    solid: "bg-emerald-500 text-white ring-emerald-500/35",
    ghost: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  warn: {
    soft: "bg-amber-500/12 text-amber-200 ring-amber-500/25",
    outline: "border-amber-400/30 text-amber-200",
    solid: "bg-amber-500 text-amber-950 ring-amber-500/35",
    ghost: "text-amber-200",
    dot: "bg-amber-400",
  },
  danger: {
    soft: "bg-rose-500/12 text-rose-300 ring-rose-500/25",
    outline: "border-rose-400/30 text-rose-300",
    solid: "bg-rose-500 text-white ring-rose-500/35",
    ghost: "text-rose-300",
    dot: "bg-rose-400",
  },
  violet: {
    soft: "bg-violet-500/12 text-violet-200 ring-violet-500/25",
    outline: "border-violet-400/30 text-violet-200",
    solid: "bg-violet-500 text-white ring-violet-500/35",
    ghost: "text-violet-200",
    dot: "bg-violet-400",
  },
}

const SIZE_STYLES: Record<
  StatusPillSize,
  { wrap: string; icon: string; dot: string }
> = {
  xs: {
    wrap: "h-5 px-1.5 text-[10px] font-medium",
    icon: "size-3",
    dot: "size-1.5",
  },
  sm: {
    wrap: "h-6 px-2 text-[11px] font-medium",
    icon: "size-3 -ml-0.5",
    dot: "size-1.5",
  },
}

const VARIANT_BASE: Record<StatusPillVariant, string> = {
  soft: "ring-1",
  outline: "border bg-transparent",
  solid: "ring-1",
  ghost: "bg-transparent",
}

/**
 * Pill semântico unificado do CRM v2.
 *
 * Substitui o uso disperso de Badge/badge customizado para lifecycle,
 * status de questionário, due labels e severity de follow-up. Cores são
 * semânticas (info/success/warn/danger/violet/brand) — nunca decorativas.
 */
export function StatusPill({
  tone = "neutral",
  variant = "soft",
  size = "xs",
  icon: Icon,
  dot,
  className,
  children,
  ...rest
}: StatusPillProps) {
  const toneStyles = TONE_STYLES[tone]
  const sizeStyles = SIZE_STYLES[size]
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md leading-none whitespace-nowrap",
        VARIANT_BASE[variant],
        toneStyles[variant],
        sizeStyles.wrap,
        className,
      )}
      {...rest}
    >
      {dot ? (
        <span
          aria-hidden
          className={cn(
            "rounded-full",
            sizeStyles.dot,
            toneStyles.dot,
          )}
        />
      ) : null}
      {Icon ? <Icon className={sizeStyles.icon} strokeWidth={1.75} /> : null}
      {children}
    </span>
  )
}
