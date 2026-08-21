import { ifShadow } from "@repo/ui/tokens"

export const dsShadows = {
  none: "none",
  xs: ifShadow.xs,
  sm: ifShadow.sm,
  md: ifShadow.md,
  lg: ifShadow.lg,
  xl: ifShadow.xl,
  focus: ifShadow.focus,
} as const
