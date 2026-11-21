"use client"

import { PanelRight } from "lucide-react"

import { useCRMRightSidebar } from "@/components/crm/crm-right-sidebar-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CRMRightSidebarToggleProps = {
  className?: string
  appearance?: "default" | "crm"
}

export function CRMRightSidebarToggle({
  className,
  appearance = "default",
}: CRMRightSidebarToggleProps) {
  const { showToggle, isOpen, toggle, hydrated } = useCRMRightSidebar()

  if (!showToggle) return null

  return (
    <Button
      type="button"
      variant={appearance === "crm" ? "crmSecondary" : isOpen ? "secondary" : "outline"}
      size={appearance === "crm" ? "default" : "sm"}
      className={cn("shrink-0 gap-2", appearance === "default" && "h-8", className)}
      onClick={toggle}
      aria-expanded={isOpen}
      aria-controls="crm-right-sidebar"
      aria-label={isOpen ? "Recolher atividades" : "Abrir atividades"}
      disabled={!hydrated}
    >
      <PanelRight className="size-3.5" strokeWidth={1.5} />
      Atividades
    </Button>
  )
}
