"use client"

import { useEffect } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { X } from "lucide-react"

import { crmToastEnter } from "@/lib/crm/crm-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ActionToastProps = {
  open: boolean
  message: string
  actionLabel?: string
  onAction?: () => void
  onDismiss: () => void
  autoHideMs?: number
  className?: string
  tone?: "neutral" | "success"
}

export function ActionToast({
  open,
  message,
  actionLabel,
  onAction,
  onDismiss,
  autoHideMs = 8000,
  className,
  tone = "neutral",
}: ActionToastProps) {
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!open || !autoHideMs) return
    const timer = window.setTimeout(onDismiss, autoHideMs)
    return () => window.clearTimeout(timer)
  }, [autoHideMs, onDismiss, open])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="status"
          initial={reduce ? false : "hidden"}
          animate="visible"
          exit="exit"
          variants={crmToastEnter}
          className={cn(
            "crm-action-toast fixed right-4 bottom-4 z-[100] flex max-w-sm items-start gap-3 rounded-xl border p-4 backdrop-blur-xl sm:right-6 sm:bottom-6",
            tone === "success" && "crm-action-toast--success",
            className,
          )}
        >
          <p className="flex-1 text-sm leading-relaxed text-foreground">{message}</p>
          <div className="flex shrink-0 items-center gap-2">
            {actionLabel && onAction ? (
              <Button size="sm" onClick={onAction}>
                {actionLabel}
              </Button>
            ) : null}
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="crm-focus-ring text-muted-foreground"
              onClick={onDismiss}
              aria-label="Fechar aviso"
            >
              <X className="size-4" />
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
