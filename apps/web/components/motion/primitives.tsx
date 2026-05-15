"use client"

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion"

import { cn } from "@/lib/utils"
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  springSnappy,
} from "@/lib/motion"

type MotionDivProps = HTMLMotionProps<"div">

export function FadeIn({
  children,
  className,
  delay = 0,
  ...props
}: MotionDivProps & { delay?: number }) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      animate="visible"
      variants={fadeInUp}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function Stagger({
  children,
  className,
  ...props
}: MotionDivProps) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      animate="visible"
      variants={staggerContainer}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
  variants,
  ...props
}: MotionDivProps & { variants?: Variants }) {
  return (
    <motion.div
      variants={variants ?? staggerItem}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function HoverLift({
  children,
  className,
  ...props
}: MotionDivProps) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -3 }}
      whileTap={reduce ? undefined : { scale: 0.995 }}
      transition={springSnappy}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function GlassPanel({
  children,
  className,
  glow = false,
  ...props
}: MotionDivProps & { glow?: boolean }) {
  return (
    <motion.div
      className={cn(
        "glass-panel relative overflow-hidden rounded-2xl",
        glow && "glass-panel-glow",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
