import { ifSemantic } from "@repo/ui/tokens"

export const dsColors = {
  semantic: ifSemantic,
  surface: {
    app: "var(--background)",
    card: "var(--card)",
    panel: "color-mix(in oklch, var(--card) 86%, transparent)",
    raised: "color-mix(in oklch, var(--card) 94%, white 2%)",
    overlay: "color-mix(in oklch, var(--popover) 96%, transparent)",
  },
  border: {
    subtle: "color-mix(in oklch, var(--border) 70%, transparent)",
    default: "var(--border)",
    strong: "color-mix(in oklch, var(--border) 80%, var(--foreground) 12%)",
  },
  state: {
    success: ifSemantic.success,
    warning: ifSemantic.warning,
    danger: ifSemantic.destructive,
    info: ifSemantic.info,
  },
} as const
