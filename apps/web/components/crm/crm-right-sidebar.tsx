"use client"

import type { ReactNode } from "react"

import { CRMRightSidebarContext } from "@/components/crm/crm-right-sidebar-context"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  CRM_RIGHT_SIDEBAR_WIDTH_PX,
  useResponsiveSidebar,
} from "@/lib/hooks/use-responsive-sidebar"
import { cn } from "@/lib/utils"

type CRMRightSidebarProps = {
  children: ReactNode
  sidebar: ReactNode
  /** Full-width row above the main/sidebar grid (filters, toggles). */
  header?: ReactNode
  className?: string
}

function SidebarPanels({ children }: { children: ReactNode }) {
  return (
    <div
      id="crm-right-sidebar"
      className="flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-y-contain [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10"
    >
      {children}
    </div>
  )
}

export function CRMRightSidebar({
  children,
  sidebar,
  header,
  className,
}: CRMRightSidebarProps) {
  const state = useResponsiveSidebar()
  const { isInlineOpen, isDrawerOpen, setDrawerOpen, mode } = state

  return (
    <CRMRightSidebarContext.Provider value={state}>
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          className,
        )}
      >
        {header ? (
          <div className="mb-2 min-w-0 shrink-0">{header}</div>
        ) : null}
        <div
          className={cn(
            "grid min-h-0 min-w-0 flex-1 overflow-hidden",
            isInlineOpen ? "gap-4 min-[1366px]:gap-5" : "grid-cols-1",
          )}
          style={
            isInlineOpen
              ? {
                  gridTemplateColumns: `minmax(0, 1fr) ${CRM_RIGHT_SIDEBAR_WIDTH_PX}px`,
                }
              : undefined
          }
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>

          {isInlineOpen && (
            <aside
              className="hidden min-h-0 min-w-0 shrink-0 overflow-hidden min-[1366px]:block"
              aria-label="Contexto do CRM"
            >
              <div className="flex h-full min-h-0 flex-col overflow-hidden">
                <SidebarPanels>{sidebar}</SidebarPanels>
              </div>
            </aside>
          )}
        </div>

        {mode === "compact" && (
          <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent
              side="right"
              className="flex w-[min(100vw-1rem,340px)] max-w-[320px] flex-col gap-0 border-white/10 bg-background p-0 sm:max-w-[320px]"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Contexto do CRM</SheetTitle>
                <SheetDescription>
                  Próximas ações e atividades do pipeline
                </SheetDescription>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-6 pt-12">
                <SidebarPanels>{sidebar}</SidebarPanels>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </CRMRightSidebarContext.Provider>
  )
}
