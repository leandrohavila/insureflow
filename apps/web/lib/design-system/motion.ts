import { ifMotion } from "@repo/ui/tokens"

export const dsMotion = {
  duration: {
    fast: ifMotion.duration.fast,
    normal: ifMotion.duration.base,
    slow: ifMotion.duration.slow,
    hover: "var(--if-duration-hover)",
    modal: "var(--if-duration-modal)",
    drawer: "var(--if-duration-drawer)",
    toast: "var(--if-duration-toast)",
  },
  ease: {
    standard: ifMotion.ease.standard,
    out: ifMotion.ease.outExpo,
  },
  transition: {
    interactive:
      "transition-[color,background-color,border-color,box-shadow,transform] duration-[var(--if-duration-hover)] ease-out",
    surface:
      "transition-[background-color,border-color,box-shadow] duration-[var(--if-duration-base)] ease-out",
  },
} as const
