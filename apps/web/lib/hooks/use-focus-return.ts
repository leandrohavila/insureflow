"use client"

import { useCallback, useRef } from "react"

/**
 * Captura o foco antes de abrir overlay e restaura ao fechar.
 * Foundation para sheets, dialogs e command palette (Fase 3).
 */
export function useFocusReturn() {
  const triggerRef = useRef<HTMLElement | null>(null)

  const captureFocus = useCallback(() => {
    const active = document.activeElement
    triggerRef.current =
      active instanceof HTMLElement ? active : null
  }, [])

  const restoreFocus = useCallback(() => {
    const target = triggerRef.current
    triggerRef.current = null
    if (!target?.isConnected) return
    requestAnimationFrame(() => {
      target.focus({ preventScroll: true })
    })
  }, [])

  return { captureFocus, restoreFocus }
}
