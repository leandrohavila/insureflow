"use client"

import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  Filter,
  Kanban,
  List,
  Plus,
  SlidersHorizontal,
  Upload,
} from "lucide-react"

import { CrmMetrics } from "@/components/crm/crm-metrics"
import { PipelineBoard } from "@/components/crm/pipeline-board"
import { CrmDealsList } from "@/components/crm/crm-deals-list"
import { CrmActivityFeed } from "@/components/crm/crm-activity-feed"
import { CRMRightSidebar } from "@/components/crm/crm-right-sidebar"
import { CRMRightSidebarToggle } from "@/components/crm/crm-right-sidebar-toggle"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { PermissionGate } from "@/components/auth/permission-gate"
import { useCanManage } from "@/components/auth/session-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCrmDeals } from "@/lib/data-access/modules/crm"
import {
  CRM_FILTER_INPUT,
  CRM_PAGE_SHELL,
  CRM_TOOLBAR,
  crmViewToggleButton,
  CRM_VIEW_TOGGLE_WRAP,
} from "@/lib/crm/crm-layout-classes"
import { easeOut } from "@/lib/motion"

type ViewMode = "board" | "list"

export function CrmPage() {
  const [view, setView] = useState<ViewMode>("board")
  const reduce = useReducedMotion()
  const canManageCrm = useCanManage("crm:view")
  const dealsQuery = useCrmDeals()
  const deals = dealsQuery.data ?? []

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className={CRM_PAGE_SHELL}
    >
      <CrmPageHeader
        badge="Pipeline comercial"
        title={<span className="text-gradient-brand">CRM</span>}
        description="Leads, negócios e follow-ups em funil visual."
        compact
      >
        <PermissionGate permission="crm:manage">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm">
            <Upload className="size-3.5" strokeWidth={1.5} />
            Importar
          </Button>
          <Button size="sm" className="h-9 gap-1.5 text-sm shadow-md shadow-primary/15">
            <Plus className="size-3.5" strokeWidth={1.5} />
            Novo negócio
          </Button>
        </PermissionGate>
      </CrmPageHeader>

      <CrmMetrics deals={deals} />

      <CRMRightSidebar
        className="min-h-0 flex-1"
        sidebar={<CrmActivityFeed deals={deals} />}
        header={
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3, ease: easeOut }}
            className={CRM_TOOLBAR}
          >
            <div className="relative min-w-0 w-full flex-1 lg:max-w-sm">
              <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/45" />
              <Input
                placeholder="Filtrar negócios, empresas ou contatos…"
                className={CRM_FILTER_INPUT}
              />
            </div>
            <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-1.5 sm:w-auto">
              <CRMRightSidebarToggle />
              <Button variant="outline" size="sm" className="h-8 shrink-0 gap-1.5 text-sm">
                <SlidersHorizontal className="size-3.5" strokeWidth={1.5} />
                Filtros
              </Button>
              <div className={CRM_VIEW_TOGGLE_WRAP}>
                <button
                  type="button"
                  onClick={() => setView("board")}
                  className={crmViewToggleButton(view === "board")}
                >
                  <Kanban className="size-3.5" strokeWidth={1.5} />
                  Kanban
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={crmViewToggleButton(view === "list")}
                >
                  <List className="size-3.5" strokeWidth={1.5} />
                  Lista
                </button>
              </div>
            </div>
          </motion.div>
        }
      >
        <motion.div
          key={view}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easeOut }}
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        >
          {view === "board" ? (
            <PipelineBoard deals={deals} interactive={canManageCrm} />
          ) : (
            <CrmDealsList deals={deals} />
          )}
        </motion.div>
      </CRMRightSidebar>
    </motion.div>
  )
}
