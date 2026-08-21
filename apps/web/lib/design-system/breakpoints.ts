export const dsBreakpoints = {
  desktop: "1280px",
  notebook: "1024px",
  tablet: "768px",
  mobile: "640px",
} as const

export const dsMedia = {
  desktop: `(min-width: ${dsBreakpoints.desktop})`,
  notebook: `(min-width: ${dsBreakpoints.notebook})`,
  tablet: `(min-width: ${dsBreakpoints.tablet})`,
  mobile: `(min-width: ${dsBreakpoints.mobile})`,
} as const
