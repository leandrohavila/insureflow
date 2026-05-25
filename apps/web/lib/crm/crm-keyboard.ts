/**
 * Foundation de atalhos CRM V2 — Fase 3 (command palette / power users).
 * Apenas constantes e helpers; registro de listeners fica nos consumidores.
 */

export const CRM_KEYBOARD = {
  /** Fechar overlay (sheet, dialog, picker) — Radix já trata ESC nos portais. */
  escape: "Escape",
  /** Submit em formulários operacionais. */
  submit: "Enter",
  /** Command palette (reservado Fase 3). */
  commandPalette: "k",
  /** Busca omnibox (reservado Fase 3). */
  search: "/",
} as const

export type CrmKeyboardShortcutId = "commandPalette" | "search"

export const CRM_KEYBOARD_SHORTCUTS: Record<
  CrmKeyboardShortcutId,
  { key: string; meta: boolean; label: string }
> = {
  commandPalette: {
    key: "k",
    meta: true,
    label: "Paleta de comandos",
  },
  search: {
    key: "/",
    meta: false,
    label: "Busca rápida",
  },
}

/** Ignora atalhos quando o foco está em campo editável. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  return target.isContentEditable
}
