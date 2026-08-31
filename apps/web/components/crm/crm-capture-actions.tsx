"use client"

import type { ReactNode } from "react"
import Link from "next/link"

import { useCanManage } from "@/components/auth/session-provider"
import { buttonVariants } from "@/components/ui/button"
import {
  CRM_CREATE_DEAL_HREF,
  hrefForLeadCreateIntent,
} from "@/lib/crm/crm-create-navigation"
import {
  hasAnyCrmCaptureAction,
  resolveCrmCaptureVisibility,
} from "@/lib/crm/crm-capture-visibility"
import type { LeadCreateIntent } from "@/lib/leads/lead-intent"
import { cn } from "@/lib/utils"

type CrmCaptureActionsProps = {
  insuranceEnabled?: boolean
  realEstateEnabled?: boolean
  /** When set (tela Leads), abre o dialog no lugar em vez de navegar. */
  onCreateLead?: (intent: LeadCreateIntent) => void
  /** When set (tela Pipeline), abre o dialog de negócio no lugar. */
  onCreateDeal?: () => void
  className?: string
}

/**
 * CTAs de captura do CRM — mesma ordem e mesmos destinos em
 * Dashboard, Leads e Pipeline:
 * 1. + Lead Seguro
 * 2. + Lead Imobiliário
 * 3. + Novo Negócio
 */
export function CrmCaptureActions({
  insuranceEnabled = true,
  realEstateEnabled = true,
  onCreateLead,
  onCreateDeal,
  className,
}: CrmCaptureActionsProps) {
  const canManageLeads = useCanManage("leads:view")
  const canManageCrm = useCanManage("crm:view")
  const visibility = resolveCrmCaptureVisibility({
    canManageLeads,
    canManageCrm,
  })

  if (!hasAnyCrmCaptureAction(visibility)) return null

  const outlineClass = cn(
    buttonVariants({ variant: "outline", size: "sm" }),
    "h-8",
  )
  const primaryClass = cn(buttonVariants({ size: "sm" }), "h-8")

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2",
        className,
      )}
      aria-label="Ações de captura do CRM"
    >
      {visibility.showLeadInsurance ? (
        <CaptureAction
          href={hrefForLeadCreateIntent("insurance")}
          className={outlineClass}
          disabled={!insuranceEnabled}
          onActivate={
            onCreateLead ? () => onCreateLead("insurance") : undefined
          }
        >
          + Lead Seguro
        </CaptureAction>
      ) : null}
      {visibility.showLeadRealEstate ? (
        <CaptureAction
          href={hrefForLeadCreateIntent("real-estate")}
          className={primaryClass}
          disabled={!realEstateEnabled}
          onActivate={
            onCreateLead ? () => onCreateLead("real-estate") : undefined
          }
        >
          + Lead Imobiliário
        </CaptureAction>
      ) : null}
      {visibility.showDeal ? (
        <CaptureAction
          href={CRM_CREATE_DEAL_HREF}
          className={primaryClass}
          onActivate={onCreateDeal}
        >
          + Novo Negócio
        </CaptureAction>
      ) : null}
    </div>
  )
}

function CaptureAction({
  href,
  className,
  disabled,
  onActivate,
  children,
}: {
  href: string
  className: string
  disabled?: boolean
  onActivate?: () => void
  children: ReactNode
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={cn(className, "pointer-events-none opacity-50")}
      >
        {children}
      </span>
    )
  }

  if (onActivate) {
    return (
      <button type="button" className={className} onClick={onActivate}>
        {children}
      </button>
    )
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
