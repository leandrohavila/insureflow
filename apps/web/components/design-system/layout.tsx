import type { ComponentProps, ReactNode } from "react"

import { dsLayout, type ContentContainerVariant } from "@/lib/design-system"
import { cn } from "@/lib/utils"

export type { ContentContainerVariant }
export type PageContainerProps = ComponentProps<"main"> & {
  /** Padding vertical mínimo + overflow hidden para páginas com workspace fill. */
  fillHeight?: boolean
}
export type ContentContainerProps = ComponentProps<"div"> & {
  variant?: ContentContainerVariant
}
export type SectionProps = ComponentProps<"section">

export function PageContainer({
  className,
  fillHeight,
  ...props
}: PageContainerProps) {
  return (
    <main
      className={cn(
        fillHeight ? dsLayout.page.operationalFill.className : dsLayout.page.className,
        className,
      )}
      {...props}
    />
  )
}

export function ContentContainer({
  variant = "reading",
  className,
  ...props
}: ContentContainerProps) {
  return (
    <div
      className={cn(dsLayout.content.variants[variant].className, className)}
      {...props}
    />
  )
}

export function Section({ className, ...props }: SectionProps) {
  return <section className={cn(dsLayout.section.className, className)} {...props} />
}

export type StackGap = "sm" | "md" | "lg" | "xl" | "2xl"

export type StackProps = ComponentProps<"div"> & {
  gap?: StackGap
}

const stackGap = {
  sm: "gap-[var(--if-space-2)]",
  md: "gap-[var(--if-space-3)]",
  lg: "gap-[var(--if-space-4)]",
  xl: "gap-[var(--if-space-6)]",
  "2xl": "gap-[var(--if-space-8)]",
} as const

export function Stack({ gap = "lg", className, ...props }: StackProps) {
  return (
    <div
      className={cn("flex min-w-0 w-full flex-col", stackGap[gap], className)}
      {...props}
    />
  )
}

export type InlineProps = ComponentProps<"div"> & {
  align?: "start" | "center" | "end"
  justify?: "start" | "between" | "end"
  wrap?: boolean
}

const inlineAlign = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
} as const

const inlineJustify = {
  start: "justify-start",
  between: "justify-between",
  end: "justify-end",
} as const

export function Inline({
  align = "center",
  justify = "start",
  wrap = true,
  className,
  ...props
}: InlineProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 gap-[var(--if-layout-control-gap)]",
        inlineAlign[align],
        inlineJustify[justify],
        wrap && "flex-wrap",
        className,
      )}
      {...props}
    />
  )
}

export type GridColumns = "auto" | "2" | "3" | "4" | "5"

export type GridProps = ComponentProps<"div"> & {
  columns?: GridColumns
  children: ReactNode
}

const gridColumns = {
  auto: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
} as const

export function Grid({ columns = "auto", className, ...props }: GridProps) {
  return (
    <div
      className={cn(
        "grid w-full gap-[var(--if-space-4)]",
        gridColumns[columns],
        className,
      )}
      {...props}
    />
  )
}
