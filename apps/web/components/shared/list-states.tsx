"use client"

import { AlertCircle, Inbox, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
        "glass-panel flex flex-col items-center justify-center gap-3 rounded-[var(--if-radius-2xl)] p-8 text-center",
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
        "glass-panel flex min-h-[320px] items-center justify-center rounded-[var(--if-radius-2xl)]",
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

export type TableSkeletonProps = {
  rows?: number
  label?: React.ReactNode
  className?: string
}

export function TableSkeleton({
  rows = 6,
  label = "Carregando…",
  className,
}: TableSkeletonProps) {
  return (
    <div
      className={cn(
        "glass-panel space-y-3 rounded-[var(--if-radius-2xl)] p-5",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={typeof label === "string" ? label : "Carregando registros"}
    >
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="grid grid-cols-12 gap-3">
          <Skeleton className="col-span-3 h-9" />
          <Skeleton className="col-span-2 h-9" />
          <Skeleton className="col-span-2 h-9" />
          <Skeleton className="col-span-2 h-9" />
          <Skeleton className="col-span-2 h-9" />
          <Skeleton className="col-span-1 h-9" />
        </div>
      ))}
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
