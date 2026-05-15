"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { easeOut } from "@/lib/motion"

type CrmPageHeaderProps = {
  badge?: string
  title: React.ReactNode
  description: string
  primaryAction?: { label: string; onClick?: () => void }
  secondaryAction?: { label: string; onClick?: () => void }
  children?: React.ReactNode
}

export function CrmPageHeader({
  badge,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
}: CrmPageHeaderProps) {
  const reduce = useReducedMotion()

  return (
    <motion.header
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
    >
      <div className="space-y-3">
        {badge && (
          <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
            {badge}
          </span>
        )}
        <motion.div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
            {title}
          </h1>
          <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        </motion.div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {secondaryAction && (
          <Button variant="outline" size="sm" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
        {primaryAction && (
          <Button size="sm" className="gap-2 shadow-lg shadow-primary/20" onClick={primaryAction.onClick}>
            <Plus className="size-3.5" strokeWidth={1.5} />
            {primaryAction.label}
          </Button>
        )}
      </div>
    </motion.header>
  )
}
