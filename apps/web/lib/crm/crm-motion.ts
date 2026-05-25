import type { Transition, Variants } from "framer-motion"

import { easeOut } from "@/lib/motion"

/**
 * CRM Motion System V2 — tokens e presets Framer unificados.
 * Referência: Linear / Attio — rápido, sutil, sem animação “marketing”.
 */

/** Durations (ms) — espelham CSS `--crm-motion-*` em crm-operational.css */
export const CRM_MOTION_MS = {
  instant: 80,
  fast: 120,
  base: 180,
  slow: 260,
  sheet: 320,
} as const

export const CRM_EASE = {
  out: easeOut,
  /** Cubic-bezier operacional padrão do CRM (CSS `--crm-ease-out`) */
  cssOut: [0.16, 1, 0.3, 1] as const,
} as const

export const crmTransition = {
  fast: { duration: CRM_MOTION_MS.fast / 1000, ease: CRM_EASE.out },
  base: { duration: CRM_MOTION_MS.base / 1000, ease: CRM_EASE.out },
  slow: { duration: CRM_MOTION_MS.slow / 1000, ease: CRM_EASE.out },
  sheet: { duration: CRM_MOTION_MS.sheet / 1000, ease: CRM_EASE.out },
} satisfies Record<string, Transition>

export const crmSpring = {
  snappy: { type: "spring", stiffness: 480, damping: 36, mass: 0.75 },
  soft: { type: "spring", stiffness: 280, damping: 30, mass: 0.85 },
} satisfies Record<string, Transition>

/** Entrada de página / seção operacional */
export const crmPageEnter: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: crmTransition.base,
  },
}

/** Lista inbox — slide sutil horizontal */
export const crmRowEnter = (index: number, reduce = false): Transition =>
  reduce
    ? { duration: 0 }
    : {
        delay: Math.min(index * 0.025, 0.12),
        ...crmTransition.fast,
      }

/** Toast / feedback operacional */
export const crmToastEnter: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: crmSpring.snappy,
  },
  exit: {
    opacity: 0,
    y: 6,
    transition: crmTransition.fast,
  },
}

/** Stagger de seções (agenda, tasks) */
export const crmSectionEnter = (delay = 0, reduce = false): Transition =>
  reduce
    ? { duration: 0 }
    : { delay, ...crmTransition.base }
