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
  type CrmCaptureModule,
} from "@/lib/crm/crm-capture-visibility"
import type { LeadCreateIntent } from "@/lib/leads/lead-intent"
import { cn } from "@/lib/utils"

type CrmCaptureActionsProps = {
  module?: CrmCaptureModule
  insuranceEnabled?: boolean
  realEstateEnabled?: boolean
  insuranceLabel?: string
  realEstateLabel?: string
  dealLabel?: string
  /** When set (tela Leads / Imobiliário), abre o dialog no lugar em vez de navegar. */
  onCreateLead?: (intent: LeadCreateIntent) => void
  /** When set (tela Pipeline), abre o dialog de negócio no lugar. */
  onCreateDeal?: () => void
  /** Ação secundária alinhada aos leads (ex.: Importar no Pipeline). */
  leading?: ReactNode
  className?: string
  /** Pipeline usa os botões claros de 36px. Os demais módulos mantêm o compacto. */
  appearance?: "default" | "crm"
}

function captureClasses(appearance: "default" | "crm") {
  if (appearance === "crm") {
    return {
      primary: cn(buttonVariants({ variant: "crmPrimary" })),
      secondary: cn(buttonVariants({ variant: "crmSecondary" })),
    }
  }
  return {
    primary: cn(buttonVariants({ variant: "create" })),
    secondary: cn(buttonVariants({ variant: "outline" })),
  }
}

/**
 * CTAs de captura — Dashboard, Pipeline e Leads Imobiliários.
 * Criar lead ou negócio usa a variante de sucesso. Gold não é peso funcional.
 */
export function CrmCaptureActions({
  module = "crm",
  insuranceEnabled = true,
  realEstateEnabled = true,
  insuranceLabel = "+ Lead Seguro",
  realEstateLabel = "+ Lead Imobiliário",
  dealLabel = "+ Novo Negócio",
  onCreateLead,
  onCreateDeal,
  leading,
  className,
  appearance = "default",
}: CrmCaptureActionsProps) {
  const canManageLeads = useCanManage("leads:view")
  const canManageCrm = useCanManage("crm:view")
  const visibility = resolveCrmCaptureVisibility({
    canManageLeads,
    canManageCrm,
    module,
  })

  if (!hasAnyCrmCaptureAction(visibility) && !leading) return null

  const classes = captureClasses(appearance)
  const leadClass = module === "crm" ? classes.secondary : classes.primary
  const dealClass = module === "crm" ? classes.primary : classes.secondary

  const insuranceAction = visibility.showLeadInsurance ? (
    <CaptureAction
      href={hrefForLeadCreateIntent("insurance")}
      className={leadClass}
      disabled={!insuranceEnabled}
      onActivate={
        onCreateLead ? () => onCreateLead("insurance") : undefined
      }
    >
      {insuranceLabel}
    </CaptureAction>
  ) : null
  const realEstateAction = visibility.showLeadRealEstate ? (
    <CaptureAction
      href={hrefForLeadCreateIntent("real-estate")}
      className={leadClass}
      disabled={!realEstateEnabled}
      onActivate={
        onCreateLead ? () => onCreateLead("real-estate") : undefined
      }
    >
      {realEstateLabel}
    </CaptureAction>
  ) : null
  const dealAction = visibility.showDeal ? (
    <CaptureAction
      href={CRM_CREATE_DEAL_HREF}
      className={dealClass}
      onActivate={onCreateDeal}
    >
      {dealLabel}
    </CaptureAction>
  ) : null

  if (appearance === "crm") {
    const secondaryGroup =
      leading || insuranceAction || realEstateAction ? (
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          {leading}
          {insuranceAction}
          {realEstateAction}
        </div>
      ) : null

    return (
      <div
        className={cn(
          "flex min-w-0 max-w-full flex-wrap items-center justify-end gap-x-[var(--if-layout-page-actions-gap)] gap-y-2",
          className,
        )}
        aria-label="Ações de captura do CRM"
      >
        {secondaryGroup}
        {dealAction}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2",
        className,
      )}
      aria-label="Ações de captura do CRM"
    >
      {leading}
      {insuranceAction}
      {realEstateAction}
      {dealAction}
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
