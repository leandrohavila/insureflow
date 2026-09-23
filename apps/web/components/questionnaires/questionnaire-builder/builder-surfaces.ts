import { cn } from "@/lib/utils"

/**
 * Hierarquia visual do builder.
 * Template (destaque) → Seção (card) → Campo (linha leve).
 */
export const builderSurfaces = {
  canvas: cn(
    "rounded-2xl border border-white/[0.05] bg-black/15",
    "p-[var(--if-space-5)] md:p-[var(--if-space-6)] lg:p-[var(--if-space-8)]",
  ),
  section: cn(
    "relative overflow-hidden rounded-2xl border border-white/[0.14] bg-white/[0.045]",
    "shadow-if-sm",
  ),
  sectionHeader: cn(
    "border-b border-white/[0.08] bg-white/[0.055]",
    "px-[var(--if-space-5)] py-[var(--if-space-4)] md:px-[var(--if-space-6)] md:py-[var(--if-space-5)]",
  ),
  sectionBody: cn(
    "px-[var(--if-space-4)] py-[var(--if-space-5)] md:px-[var(--if-space-6)] md:py-[var(--if-space-6)]",
  ),
  field: cn(
    "relative rounded-xl border border-transparent bg-transparent",
    "px-[var(--if-space-3)] py-[var(--if-space-4)]",
    "transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out",
    "hover:border-white/[0.08] hover:bg-white/[0.04]",
  ),
  fieldSelected: cn(
    "border-primary/30 border-l-2 border-l-primary bg-primary/[0.06]",
  ),
  fieldDragging: "z-20 border-primary/35 bg-background/90 opacity-40 shadow-if-lg",
  dropTarget: "ring-2 ring-primary/55 ring-offset-2 ring-offset-background",
  dropLine:
    "pointer-events-none absolute inset-x-3 -top-[9px] z-10 h-0.5 rounded-full bg-primary shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary)_30%,transparent)]",
  dragHandle: cn(
    "inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground",
    "transition-colors duration-150",
    "hover:bg-white/[0.12] hover:text-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
    "cursor-grab touch-none active:scale-95 active:cursor-grabbing",
    "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
  ),
  sectionGap:
    "flex flex-col gap-[var(--if-space-10)] md:gap-[var(--if-space-12)]",
  fieldGap: "flex flex-col gap-[var(--if-space-4)] md:gap-[var(--if-space-5)]",
  level1: cn(
    "rounded-2xl border border-white/[0.10] bg-white/[0.05]",
    "shadow-if-sm",
  ),
  level2: cn("rounded-xl border border-white/[0.08] bg-white/[0.04]"),
  card: cn(
    "group rounded-xl border border-white/[0.10] bg-white/[0.06]",
    "shadow-if-xs transition-[border-color,box-shadow,background-color] duration-200",
    "hover:border-white/[0.16] hover:bg-white/[0.08]",
  ),
  cardSelected: cn(
    "border-primary/45 bg-primary/[0.07] ring-1 ring-primary/25",
    "shadow-if-sm",
  ),
} as const
