"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CRM_SECTION_SUBTITLE } from "@/lib/crm/crm-layout-classes"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

type CrmPageHeaderProps = {
  badge?: string
  title: React.ReactNode
  description?: string
  primaryAction?: { label: string; onClick?: () => void }
  secondaryAction?: { label: string; onClick?: () => void }
  children?: React.ReactNode
  /** @deprecated Não altera mais o layout. */
  compact?: boolean
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
      initial={reduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: easeOut }}
      className="crm-page-header relative shrink-0"
    >
      <div className="flex flex-col gap-3">
        {badge ? (
          <div className="flex min-h-5 items-center">
            <span className="inline-flex rounded-md border border-primary/30 bg-primary/12 px-2 py-0.5 text-xs font-semibold leading-none text-primary">
              {badge}
            </span>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1 space-y-1.5">
            <h1 className="text-xl font-semibold leading-tight tracking-tight text-foreground">
              {title}
            </h1>
            {description ? (
              <p
                className={cn(
                  "max-w-2xl text-sm leading-relaxed",
                  CRM_SECTION_SUBTITLE,
                )}
              >
                {description}
              </p>
            ) : null}
          </div>

          {(children || secondaryAction || primaryAction) && (
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-0.5 sm:justify-end">
              {children}
              {secondaryAction ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0 text-sm"
                  onClick={secondaryAction.onClick}
                >
                  {secondaryAction.label}
                </Button>
              ) : null}
              {primaryAction ? (
                <Button
                  size="sm"
                  className="h-9 shrink-0 gap-1.5 text-sm shadow-md shadow-primary/15"
                  onClick={primaryAction.onClick}
                >
                  <Plus className="size-3.5" strokeWidth={1.5} />
                  {primaryAction.label}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </motion.header>
  )
}
