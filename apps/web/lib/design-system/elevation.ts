import { dsShadows } from "./shadows"

export const dsElevation = {
  flat: {
    shadow: dsShadows.none,
    className: "shadow-none",
  },
  surface: {
    shadow: dsShadows.xs,
    className: "shadow-if-xs",
  },
  raised: {
    shadow: dsShadows.sm,
    className: "shadow-if-sm",
  },
  overlay: {
    shadow: dsShadows.lg,
    className: "shadow-if-lg",
  },
  focus: {
    shadow: dsShadows.focus,
    className: "focus-visible:ring-3 focus-visible:ring-ring/40",
  },
} as const
