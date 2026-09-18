import { ifRadius } from "@repo/ui/tokens"

export const dsRadius = {
  control: ifRadius.md,
  card: ifRadius["2xl"],
  panel: ifRadius["3xl"],
  modal: ifRadius["3xl"],
  pill: ifRadius.full,
  focus: ifRadius.md,
} as const

export type DsRadiusKey = keyof typeof dsRadius
