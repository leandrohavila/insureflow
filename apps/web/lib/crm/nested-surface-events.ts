import type { KeyboardEvent, MouseEvent, PointerEvent } from "react"

/**
 * Dialogs portaled inside deal/lead sheets still bubble synthetic events through
 * the React tree — pointer/keyboard reach parent sheet/card handlers.
 */
export function isolateKeyboardEvent(event: KeyboardEvent<HTMLElement>) {
  // Let the dialog primitive handle dismiss; do not block default behavior.
  if (event.key === "Escape") return
  event.stopPropagation()
}

export const isolateNestedSurfaceKeyboard = {
  onKeyDown: isolateKeyboardEvent,
  onKeyUp: isolateKeyboardEvent,
  onKeyPress: isolateKeyboardEvent,
} as const

export const isolateNestedSurfacePointer = {
  onPointerDown: (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation()
  },
  onClick: (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
  },
} as const

/** Pointer + keyboard isolation for nested CRM surfaces (sheets, cards). */
export const isolateNestedSurfaceEvents = {
  ...isolateNestedSurfacePointer,
  ...isolateNestedSurfaceKeyboard,
} as const
