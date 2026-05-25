"use client"

import { PanelRight } from "lucide-react"

import { useCRMRightSidebar } from "@/components/crm/crm-right-sidebar-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CRMRightSidebarToggleProps = {
  className?: string
}

export function CRMRightSidebarToggle({
  className,
}: CRMRightSidebarToggleProps) {
  const { showToggle, isOpen, toggle, hydrated } = useCRMRightSidebar()

  if (!showToggle) return null

  return (
    <Button
      type="button"
      variant={isOpen ? "secondary" : "outline"}
      size="sm"
      className={cn("shrink-0 gap-2", className)}
      onClick={toggle}
      aria-expanded={isOpen}
      aria-controls="crm-right-sidebar"
      aria-label={isOpen ? "Recolher painel de contexto" : "Abrir painel de contexto"}
      disabled={!hydrated}
    >
      <PanelRight className="size-3.5" strokeWidth={1.5} />
      Contexto
    </Button>
  )
}
