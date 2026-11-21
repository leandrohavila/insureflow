"use client"

import type { ReactNode } from "react"

import { CRMRightSidebarContext } from "@/components/crm/crm-right-sidebar-context"
import {
  OperationalWorkspace,
  OperationalWorkspaceAside,
  OperationalWorkspaceAsideBody,
  OperationalWorkspaceGrid,
  OperationalWorkspaceMain,
  OperationalWorkspaceToolbar,
} from "@/components/design-system"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  CRM_RIGHT_SIDEBAR_WIDTH_PX,
  useResponsiveSidebar,
} from "@/lib/hooks/use-responsive-sidebar"

type CRMRightSidebarProps = {
  children: ReactNode
  sidebar: ReactNode
  /** Full-width row above the main/sidebar grid (filters, toggles). */
  header?: ReactNode
  /** Conteúdo shrink-0 acima do grid (títulos, KPIs locais) — não compete com a altura do pipeline. */
  prelude?: ReactNode
  /** Toolbar com margem inferior reduzida. */
  toolbarDense?: boolean
  /**
   * No Pipeline, o painel só ocupa coluna a partir de 1600px.
   * Abaixo disso abre como overlay e a preferência de abertura continua salva.
   */
  overlayBelowWide?: boolean
  className?: string
}

function SidebarPanels({ children }: { children: ReactNode }) {
  return (
    <OperationalWorkspaceAsideBody id="crm-right-sidebar">
      {children}
    </OperationalWorkspaceAsideBody>
  )
}

/**
 * Painel lateral do CRM (atividades / contexto).
 * Composição via OperationalWorkspace do Design System.
 */
export function CRMRightSidebar({
  children,
  sidebar,
  header,
  prelude,
  toolbarDense = false,
  overlayBelowWide = false,
  className,
}: CRMRightSidebarProps) {
  const state = useResponsiveSidebar()
  const {
    isInlineOpen,
    isDrawerOpen,
    setDrawerOpen,
    setOpen,
    mode,
    collapsed,
    hydrated,
  } = state
  const kanbanOverlay = overlayBelowWide && mode === "notebook"
  const asideInline = !kanbanOverlay && mode !== "compact" && isInlineOpen
  const sheetOpen = kanbanOverlay ? hydrated && !collapsed : isDrawerOpen

  return (
    <CRMRightSidebarContext.Provider value={state}>
      <OperationalWorkspace className={className}>
        {header ? (
          <OperationalWorkspaceToolbar dense={toolbarDense}>
            {header}
          </OperationalWorkspaceToolbar>
        ) : null}

        {prelude ? (
          <div className="w-full min-w-0 shrink-0">{prelude}</div>
        ) : null}

        <OperationalWorkspaceGrid
          asideOpen={!kanbanOverlay && mode !== "compact"}
          asideWidthPx={asideInline ? CRM_RIGHT_SIDEBAR_WIDTH_PX : 0}
          className={cn(
            "motion-safe:transition-[grid-template-columns] motion-safe:duration-200 motion-safe:ease-out",
            !kanbanOverlay && mode !== "compact" && !isInlineOpen && "!gap-0 min-[1366px]:!gap-0",
          )}
        >
          <OperationalWorkspaceMain>{children}</OperationalWorkspaceMain>

          {!kanbanOverlay && mode !== "compact" ? (
            <OperationalWorkspaceAside
              aria-label="Atividades"
              aria-hidden={!isInlineOpen}
              className={cn(
                !isInlineOpen && "pointer-events-none opacity-0",
              )}
            >
              <SidebarPanels>{sidebar}</SidebarPanels>
            </OperationalWorkspaceAside>
          ) : null}
        </OperationalWorkspaceGrid>

        {(mode === "compact" || kanbanOverlay) && (
          <Sheet
            open={sheetOpen}
            onOpenChange={(open) => {
              if (kanbanOverlay) {
                setOpen(open)
                return
              }
              setDrawerOpen(open)
            }}
          >
            <SheetContent
              side="right"
              className="avila-crm-canvas flex w-[min(100vw-1rem,380px)] max-w-none flex-col gap-0 border-border bg-[var(--avila-ivory)] p-0 sm:max-w-[380px]"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Contexto operacional</SheetTitle>
                <SheetDescription>
                  Próximas ações e atividades do módulo
                </SheetDescription>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-6 pt-12">
                <SidebarPanels>{sidebar}</SidebarPanels>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </OperationalWorkspace>
    </CRMRightSidebarContext.Provider>
  )
}
