import { ifSpace } from "@repo/ui/tokens"

export const dsSpacing = {
  none: ifSpace[0],
  hairline: ifSpace.px,
  xs: ifSpace[1],
  sm: ifSpace[2],
  md: ifSpace[3],
  lg: ifSpace[4],
  xl: ifSpace[6],
  "2xl": ifSpace[8],
  "3xl": ifSpace[10],
  "4xl": ifSpace[12],
  "5xl": ifSpace[16],
  pageX: "var(--if-layout-page-x)",
  pageY: "var(--if-layout-page-y)",
  sectionGap: "var(--if-layout-section-gap)",
  controlGap: "var(--if-layout-control-gap)",
  pageActionsGap: "var(--if-layout-page-actions-gap)",
  pageActionsGroupGap: "var(--if-layout-page-actions-group-gap)",
  pageActionsPrimaryGap: "var(--if-layout-page-actions-primary-gap)",
  headerPaddingX: "var(--if-layout-header-padding-x)",
  headerPaddingRight: "var(--if-layout-header-padding-right)",
} as const

export type DsSpacingKey = keyof typeof dsSpacing
