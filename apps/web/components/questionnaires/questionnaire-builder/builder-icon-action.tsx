"use client"

import { memo, type ReactNode } from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type BuilderIconActionProps = {
  label: string
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
  children: ReactNode
}

export const BuilderIconAction = memo(function BuilderIconAction({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: BuilderIconActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation()
              onClick()
            }}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground",
              "transition-colors duration-150",
              "hover:bg-white/[0.12] hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              "disabled:pointer-events-none disabled:opacity-40",
              destructive && "hover:bg-destructive/15 hover:text-destructive",
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
})
