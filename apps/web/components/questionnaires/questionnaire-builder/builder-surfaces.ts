import { cn } from "@/lib/utils"

/**
 * Hierarquia visual do builder no canvas claro da Ávila.
 * Template (destaque) → Seção (card) → Campo (linha leve).
 */
export const builderPortalClass =
  "questionnaire-builder avila-crm-canvas border-[#d6cfc4] bg-[var(--avila-paper)] text-[var(--avila-navy-900)] shadow-[0_16px_40px_-24px_rgb(16_41_75/0.35)]"

export const builderSurfaces = {
  canvas: cn(
    "rounded-2xl border border-[#e4ddd2] bg-[var(--avila-paper)]",
    "shadow-[0_1px_2px_rgb(16_41_75/0.04)]",
    "p-[var(--if-space-5)] md:p-[var(--if-space-6)]",
  ),
  section: cn(
    "relative overflow-hidden rounded-2xl border border-[#e4ddd2] bg-[var(--avila-paper)]",
    "shadow-[0_1px_2px_rgb(16_41_75/0.04),0_10px_24px_-18px_rgb(16_41_75/0.18)]",
  ),
  sectionHeader: cn(
    "border-b border-[#e4ddd2] bg-[var(--avila-ivory)]",
    "px-[var(--if-space-5)] py-[var(--if-space-4)]",
  ),
  sectionBody: cn(
    "px-[var(--if-space-4)] py-[var(--if-space-4)] md:px-[var(--if-space-5)]",
  ),
  field: cn(
    "relative rounded-xl border border-transparent bg-transparent",
    "px-[var(--if-space-3)] py-[var(--if-space-3)]",
    "transition-[background-color,border-color,box-shadow] duration-200 ease-out",
    "hover:border-[#e4ddd2] hover:bg-[var(--avila-ivory)]",
  ),
  fieldSelected: cn(
    "border-[#e4ddd2] border-l-2 border-l-[var(--avila-gold-600)] bg-[color-mix(in_srgb,var(--avila-gold-600)_12%,var(--avila-paper))]",
  ),
  fieldDragging: "z-20 border-[#d6cfc4] bg-[var(--avila-paper)] opacity-40 shadow-if-lg",
  dropTarget: "ring-2 ring-[var(--avila-gold-600)] ring-offset-2 ring-offset-[var(--avila-paper)]",
  dropLine:
    "pointer-events-none absolute inset-x-3 -top-[9px] z-10 h-0.5 rounded-full bg-[var(--avila-gold-600)]",
  dragHandle: cn(
    "inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[#5c6578]",
    "transition-colors duration-150",
    "hover:bg-[#ebe5dc] hover:text-[var(--avila-navy-900)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--avila-gold-600)]",
    "cursor-grab touch-none active:scale-95 active:cursor-grabbing",
    "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
  ),
  sectionGap: "flex flex-col gap-[var(--if-space-4)] md:gap-[var(--if-space-5)]",
  fieldGap: "flex flex-col gap-[var(--if-space-3)]",
  level1: cn(
    "rounded-2xl border border-[#e4ddd2] bg-[var(--avila-paper)]",
    "shadow-[0_1px_2px_rgb(16_41_75/0.04),0_12px_28px_-20px_rgb(16_41_75/0.2)]",
  ),
  level2: cn("rounded-xl border border-[#e4ddd2] bg-[var(--avila-ivory)]"),
  card: cn(
    "group rounded-xl border border-[#e4ddd2] bg-[var(--avila-paper)]",
    "shadow-[0_1px_2px_rgb(16_41_75/0.04)] transition-[border-color,box-shadow,background-color] duration-200",
    "hover:border-[#d6cfc4] hover:bg-[var(--avila-ivory)]",
  ),
  cardSelected: cn(
    "border-[var(--avila-gold-600)] bg-[color-mix(in_srgb,var(--avila-gold-600)_10%,var(--avila-paper))] ring-1 ring-[var(--avila-gold-600)]",
    "shadow-[0_1px_2px_rgb(16_41_75/0.05)]",
  ),
} as const
