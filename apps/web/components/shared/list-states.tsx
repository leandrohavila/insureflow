"use client"

import { AlertCircle, Inbox, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type StateIcon = React.ComponentType<{ className?: string }>

type StatePanelProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: StateIcon
  action?: React.ReactNode
  className?: string
  minHeightClassName?: string
}

function StatePanel({
  title,
  description,
  icon: Icon,
  action,
  className,
  minHeightClassName = "min-h-[260px]",
}: StatePanelProps) {
  return (
    <div
      className={cn(
        "glass-panel flex flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center",
        minHeightClassName,
        className,
      )}
    >
      {Icon ? <Icon className="size-8 text-muted-foreground" /> : null}
      {(title || description) && (
        <div>
          {title ? <p className="font-medium text-foreground">{title}</p> : null}
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      )}
      {action}
    </div>
  )
}

export type LoadingStateProps = {
  label?: React.ReactNode
  className?: string
}

export function LoadingState({
  label = "Carregando…",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "glass-panel flex min-h-[320px] items-center justify-center rounded-2xl",
        className,
      )}
    >
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {label}
      </div>
    </div>
  )
}

export type ErrorStateProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  retryLabel?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = "Não foi possível carregar os dados.",
  description,
  retryLabel = "Tentar novamente",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <StatePanel
      icon={AlertCircle}
      title={title}
      description={description}
      className={className}
      action={
        onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null
      }
    />
  )
}

export type EmptyStateProps = {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: StateIcon
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <StatePanel
      icon={icon}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  )
}
