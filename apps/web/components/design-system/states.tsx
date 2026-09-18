"use client"

import type { ComponentType, ReactNode } from "react"
import { AlertCircle, Construction, Inbox, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import { AppCard } from "./cards"
import { PageContainer } from "./layout"

type StateIcon = ComponentType<{ className?: string }>

export type EmptyStateProps = {
  title: ReactNode
  description?: ReactNode
  icon?: StateIcon
  action?: ReactNode
  className?: string
  tone?: "neutral" | "danger"
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
  tone = "neutral",
}: EmptyStateProps) {
  return (
    <AppCard
      className={cn(
        "flex min-h-[var(--if-state-min-height)] flex-col items-center justify-center gap-[var(--if-space-3)] text-center",
        tone === "danger" && "border-destructive/30 bg-destructive/10",
        className,
      )}
      padding="spacious"
    >
      <Icon
        className={cn(
          "size-[var(--if-icon-lg)]",
          tone === "danger" ? "text-destructive" : "text-muted-foreground",
        )}
        aria-hidden
      />
      <div className="space-y-[var(--if-space-1)]">
        <p className="font-medium text-foreground">{title}</p>
        {description ? (
          <p className="max-w-[var(--if-layout-reading-prose-max)] text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </AppCard>
  )
}

export type PlaceholderPageProps = {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export function PlaceholderPage({
  title,
  description = "Estamos preparando esta área do InsureFlow.",
  action,
}: PlaceholderPageProps) {
  return (
    <PageContainer className="items-center justify-center">
      <EmptyState
        icon={Construction}
        title={title}
        description={description}
        action={action}
        className="w-full max-w-[var(--if-layout-reading-prose-max)]"
      />
    </PageContainer>
  )
}

export type LoadingStateProps = {
  label?: ReactNode
  className?: string
}

export function LoadingState({ label = "Carregando…", className }: LoadingStateProps) {
  return (
    <AppCard
      className={cn("flex min-h-[var(--if-state-min-height)] items-center justify-center", className)}
      padding="spacious"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-[var(--if-space-3)] text-sm text-muted-foreground">
        <Loader2 className="size-[var(--if-icon-md)] animate-spin" aria-hidden />
        {label}
      </div>
    </AppCard>
  )
}

export type SkeletonStateProps = {
  rows?: number
  className?: string
  label?: ReactNode
}

export function SkeletonState({
  rows = 4,
  className,
  label = "Carregando conteúdo",
}: SkeletonStateProps) {
  return (
    <AppCard
      className={cn("space-y-[var(--if-space-3)]", className)}
      role="status"
      aria-live="polite"
      aria-label={typeof label === "string" ? label : undefined}
    >
      {typeof label === "string" ? null : <span className="sr-only">{label}</span>}
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-[var(--if-skeleton-row-height)] w-full"
          aria-hidden
        />
      ))}
    </AppCard>
  )
}

export type ErrorStateProps = {
  title?: ReactNode
  description?: ReactNode
  retryLabel?: string
  onRetry?: () => void
}

export function ErrorState({
  title = "Não foi possível carregar os dados.",
  description,
  retryLabel = "Tentar novamente",
  onRetry,
}: ErrorStateProps) {
  return (
    <EmptyState
      tone="danger"
      icon={AlertCircle}
      title={title}
      description={description}
      action={
        onRetry ? (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null
      }
    />
  )
}
