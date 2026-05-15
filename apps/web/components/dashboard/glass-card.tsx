"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"

import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

type GlassCardProps = {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
  glow?: boolean
}

export function GlassCard({
  children,
  className,
  delay = 0,
  hover = true,
  glow = false,
}: GlassCardProps) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: easeOut }}
      whileHover={
        hover && !reduce
          ? {
              y: -4,
              transition: { duration: 0.25, ease: easeOut },
            }
          : undefined
      }
      className={cn(
        "glass-panel group/card relative overflow-hidden rounded-2xl",
        glow && "glass-panel-glow",
        hover && "glass-panel-interactive",
        className
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
        style={{
          background:
            "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 0%), oklch(0.62 0.17 252 / 0.06), transparent 40%)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-48 rounded-full bg-primary/8 blur-3xl"
        initial={false}
        animate={{ opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
      />
      {children}
    </motion.div>
  )
}
