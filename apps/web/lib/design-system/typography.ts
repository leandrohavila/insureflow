import { ifTypography } from "@repo/ui/tokens"

export const dsTypography = {
  family: {
    sans: "var(--font-geist-sans)",
    mono: "var(--font-geist-mono)",
  },
  size: ifTypography.fontSize,
  lineHeight: ifTypography.lineHeight,
  tracking: ifTypography.letterSpacing,
  weight: ifTypography.fontWeight,
  role: {
    pageTitle:
      "text-xl font-semibold leading-tight tracking-tight text-foreground md:text-2xl",
    sectionTitle: "text-base font-semibold tracking-tight text-foreground",
    body: "text-sm leading-relaxed text-foreground",
    muted: "text-sm leading-relaxed text-muted-foreground",
    meta: "text-xs leading-normal text-muted-foreground",
    micro:
      "text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground",
  },
} as const
