import { cn } from "@/lib/utils"

/** Hierarquia visual do builder: Canvas → L1 → L2 → Card */
export const builderSurfaces = {
  canvas: cn(
    "rounded-2xl border border-white/[0.06] bg-[var(--if-color-surface-canvas,var(--background))]/35",
    "p-[var(--if-space-5)] md:p-[var(--if-space-6)] lg:p-[var(--if-space-8)]",
  ),
  level1: cn(
    "rounded-2xl border border-white/[0.10] bg-white/[0.05]",
    "shadow-if-sm",
  ),
  level2: cn(
    "rounded-xl border border-white/[0.08] bg-white/[0.04]",
  ),
  card: cn(
    "group rounded-xl border border-white/[0.10] bg-white/[0.06]",
    "shadow-if-xs transition-[border-color,box-shadow,background-color]",
    "hover:border-white/[0.16] hover:bg-white/[0.08]",
  ),
  cardSelected: cn(
    "border-primary/45 bg-primary/[0.07] ring-1 ring-primary/25",
    "shadow-if-sm",
  ),
  sectionGap: "space-y-[var(--if-space-8)] md:space-y-[var(--if-space-10)]",
  fieldGap: "space-y-[var(--if-space-5)]",
} as const
