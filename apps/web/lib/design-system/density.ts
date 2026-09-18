export type DsDensity = "compact" | "comfortable"

export const dsDensity = {
  default: "compact" as DsDensity,
  compact: {
    controlHeight: "2.25rem",
    inputHeight: "2.5rem",
    tableRowMinHeight: "2.75rem",
    cardPadding: "var(--if-space-5)",
    pageDensityClass: "gap-[var(--if-layout-section-gap)]",
  },
  comfortable: {
    controlHeight: "2.5rem",
    inputHeight: "2.75rem",
    tableRowMinHeight: "3rem",
    cardPadding: "var(--if-space-6)",
    pageDensityClass: "gap-[var(--if-space-8)]",
  },
} as const
