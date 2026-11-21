import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Filtros compartilhados do CRM: 36px, pill, 8px entre itens,
 * navy quando selecionado e branco com borda #D6CFC4 quando não.
 * Agenda, Leads e Pipeline usam o mesmo controle.
 * O padding usa `!` porque o reset `* { padding: 0 }` de globals.css
 * fica fora de camada e venceria o utilitário.
 */
/** Campo de filtro claro: 36px, borda e texto da paleta Ávila. */
export const crmFilterFieldClass =
  "h-9! rounded-lg border-[#D6CFC4]! bg-white! px-3! text-sm! text-[#10294B]! shadow-none placeholder:text-[#5C6578] dark:bg-white!"

export function crmFilterChipClass(pressed: boolean) {
  return cn(
    "inline-flex h-9 min-h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border px-3.5! text-[0.8125rem] leading-none font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[#10294B]/30 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
    pressed
      ? "border-[#10294B] bg-[#10294B] text-[#F6F1E8]"
      : "border-[#D6CFC4] bg-white text-[#10294B] hover:border-[#C09048] hover:bg-[#FBF6EF]",
  )
}

export function CrmFilterGroup({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex min-w-0 max-w-full flex-wrap items-center gap-[var(--if-layout-button-gap)]",
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Card branco dos filtros: borda #D6CFC4, padding de 12px (igual a Leads). */
export const crmFilterCardClass =
  "rounded-xl border border-[#D6CFC4] bg-white p-3! text-[#10294B] shadow-[0_1px_2px_rgb(16_41_75/0.04)] [&_label>span]:text-[#5C6578]"

/**
 * Padding do `StatCard` light/compact. O `p-*` interno do card não tem `!`
 * e o reset global o zera, então o padding precisa ser reforçado aqui.
 */
export const crmStatCardClass = "px-4! py-3!"

export type CrmBadgeTone = "neutral" | "info" | "success" | "warn" | "danger"

const crmBadgeTones: Record<CrmBadgeTone, string> = {
  neutral: "bg-[#F3EEE6] text-[#10294B]",
  info: "bg-[#E7EEF6] text-[#1D3F68]",
  success: "bg-[#E7F3EA] text-[#1F6B3A]",
  warn: "bg-[#F8EFDF] text-[#8A6230]",
  danger: "bg-[#F8E8E6] text-[#9F2D2D]",
}

/** Badge de status com as mesmas cores dos badges da Agenda. */
export function crmBadgeClass(tone: CrmBadgeTone) {
  return cn(
    "inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5! text-xs leading-none font-semibold",
    crmBadgeTones[tone],
  )
}

export function CrmBadge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: CrmBadgeTone }) {
  return <span className={cn(crmBadgeClass(tone), className)} {...props} />
}

export function CrmFilterChip({
  pressed,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { pressed: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={cn(crmFilterChipClass(pressed), className)}
      {...props}
    />
  )
}
