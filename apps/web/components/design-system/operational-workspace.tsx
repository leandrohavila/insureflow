import type { ComponentProps, CSSProperties } from "react"

import {
  dsOperationalWorkspace,
  DS_OPERATIONAL_ASIDE_WIDTH_PX,
} from "@/lib/design-system"
import { cn } from "@/lib/utils"

export type OperationalPageLayoutProps = ComponentProps<"div"> & {
  /** `dense` reduz gaps verticais para maximizar área operacional (Kanban). */
  density?: "default" | "dense"
}

/** Coluna da página operacional: Header · KPIs · Workspace (flex:1). */
export function OperationalPageLayout({
  density = "default",
  className,
  ...props
}: OperationalPageLayoutProps) {
  return (
    <div
      className={cn(
        density === "dense"
          ? dsOperationalWorkspace.pageDense.className
          : dsOperationalWorkspace.page.className,
        className,
      )}
      {...props}
    />
  )
}

export type OperationalWorkspaceMetricsProps = ComponentProps<"div">

/** Faixa de KPIs/indicadores — shrink-0, não compete por altura. */
export function OperationalWorkspaceMetrics({
  className,
  ...props
}: OperationalWorkspaceMetricsProps) {
  return (
    <div
      className={cn(dsOperationalWorkspace.metrics.className, className)}
      {...props}
    />
  )
}

export type OperationalWorkspaceProps = ComponentProps<"div">

/** Área operacional — preenche altura restante abaixo de header e KPIs. */
export function OperationalWorkspace({
  className,
  ...props
}: OperationalWorkspaceProps) {
  return (
    <div
      className={cn(dsOperationalWorkspace.root.className, className)}
      {...props}
    />
  )
}

export type OperationalWorkspaceToolbarProps = ComponentProps<"div"> & {
  dense?: boolean
}

/** Toolbar/filtros acima do grid operacional. */
export function OperationalWorkspaceToolbar({
  dense = false,
  className,
  ...props
}: OperationalWorkspaceToolbarProps) {
  return (
    <div
      className={cn(
        dense
          ? dsOperationalWorkspace.toolbarDense.className
          : dsOperationalWorkspace.toolbar.className,
        className,
      )}
      {...props}
    />
  )
}

export type OperationalWorkspaceGridProps = ComponentProps<"div"> & {
  asideOpen?: boolean
  asideWidthPx?: number
}

/** Grid principal + lateral — mesma altura via items-stretch. */
export function OperationalWorkspaceGrid({
  asideOpen = true,
  asideWidthPx = DS_OPERATIONAL_ASIDE_WIDTH_PX,
  className,
  style,
  ...props
}: OperationalWorkspaceGridProps) {
  return (
    <div
      className={cn(
        dsOperationalWorkspace.grid.className,
        asideOpen
          ? dsOperationalWorkspace.grid.gapOpen
          : dsOperationalWorkspace.grid.gapClosed,
        className,
      )}
      style={
        asideOpen
          ? ({
              gridTemplateColumns: `minmax(0, 1fr) ${asideWidthPx}px`,
              ...style,
            } as CSSProperties)
          : style
      }
      {...props}
    />
  )
}

export type OperationalWorkspaceMainProps = ComponentProps<"div">

/** Painel principal (pipeline, tabela, lista). */
export function OperationalWorkspaceMain({
  className,
  ...props
}: OperationalWorkspaceMainProps) {
  return (
    <div
      className={cn(dsOperationalWorkspace.main.className, className)}
      {...props}
    />
  )
}

export type OperationalWorkspaceAsideProps = ComponentProps<"aside">

/** Painel lateral inline — height:100%, flex column. */
export function OperationalWorkspaceAside({
  className,
  ...props
}: OperationalWorkspaceAsideProps) {
  return (
    <aside
      className={cn(dsOperationalWorkspace.aside.className, className)}
      {...props}
    />
  )
}

export type OperationalWorkspaceAsideBodyProps = ComponentProps<"div"> & {
  scroll?: boolean
}

/** Corpo do painel lateral — scroll vertical opcional. */
export function OperationalWorkspaceAsideBody({
  scroll = true,
  className,
  children,
  id,
  ...props
}: OperationalWorkspaceAsideBodyProps) {
  return (
    <div className={cn(dsOperationalWorkspace.asideInner.className, className)}>
      <div
        id={id}
        className={cn(scroll && dsOperationalWorkspace.asideScroll.className)}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}

/** Aliases oficiais da Sprint 4.6 (documentação / migração). */
export {
  OperationalWorkspace as CRMWorkspace,
  OperationalWorkspaceGrid as CRMWorkspaceGrid,
  OperationalWorkspaceMain as CRMWorkspacePipeline,
  OperationalWorkspaceAside as CRMWorkspaceSidebar,
  OperationalWorkspaceToolbar as CRMWorkspaceHeader,
  OperationalWorkspaceMetrics as CRMWorkspaceMetrics,
}

export type CRMWorkspaceProps = OperationalWorkspaceProps
export type CRMWorkspaceGridProps = OperationalWorkspaceGridProps
export type CRMWorkspacePipelineProps = OperationalWorkspaceMainProps
export type CRMWorkspaceSidebarProps = OperationalWorkspaceAsideProps
export type CRMWorkspaceHeaderProps = OperationalWorkspaceToolbarProps
export type CRMWorkspaceMetricsProps = OperationalWorkspaceMetricsProps
