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
import { useResponsiveSidebar } from "@/lib/hooks/use-responsive-sidebar"

type CRMRightSidebarProps = {
  children: ReactNode
  sidebar: ReactNode
  /** Full-width row above the main/sidebar grid (filters, toggles). */
  header?: ReactNode
  /** Conteúdo shrink-0 acima do grid (títulos, KPIs locais) — não compete com a altura do pipeline. */
  prelude?: ReactNode
  /** Toolbar com margem inferior reduzida. */
  toolbarDense?: boolean
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
  className,
}: CRMRightSidebarProps) {
  const state = useResponsiveSidebar()
  const { isInlineOpen, isDrawerOpen, setDrawerOpen, mode } = state

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

        <OperationalWorkspaceGrid asideOpen={isInlineOpen}>
          <OperationalWorkspaceMain>{children}</OperationalWorkspaceMain>

          {isInlineOpen ? (
            <OperationalWorkspaceAside aria-label="Contexto operacional">
              <SidebarPanels>{sidebar}</SidebarPanels>
            </OperationalWorkspaceAside>
          ) : null}
        </OperationalWorkspaceGrid>

        {mode === "compact" && (
          <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent
              side="right"
              className="flex w-[min(100vw-1rem,340px)] max-w-[320px] flex-col gap-0 border-white/10 bg-background p-0 sm:max-w-[320px]"
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
