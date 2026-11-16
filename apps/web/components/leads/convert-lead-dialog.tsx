"use client"

import { Briefcase, Loader2, X } from "lucide-react"

import { CommercialWarningBanner } from "@/components/crm/commercial-warning-banner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getErrorMessage } from "@/lib/data-access"
import type { Lead } from "@/lib/data-access/modules/leads"
import { useLeadContext } from "@/lib/data-access/modules/leads"

type ConvertLeadDialogProps = {
  lead: Lead | null
  open: boolean
  pending?: boolean
  error?: unknown
  onOpenChange: (open: boolean) => void
  onConvert: (lead: Lead) => void | Promise<void>
  onContinueQuestionnaire: (lead: Lead) => void
}

export function ConvertLeadDialog({
  lead,
  open,
  pending,
  error,
  onOpenChange,
  onConvert,
  onContinueQuestionnaire,
}: ConvertLeadDialogProps) {
  const contextQuery = useLeadContext(open && lead ? lead.id : null)
  const hasDraftWarning = Boolean(
    contextQuery.data?.warnings.some(
      (warning) => warning.code === "draft_questionnaire",
    ),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="avila-lead-surface w-[min(28rem,calc(100%-2rem))] gap-0 border-border bg-[var(--avila-ivory)] p-0! text-[var(--avila-navy-900)] shadow-xl sm:max-w-md">
        <DialogHeader className="px-6! pt-5! pr-14! pb-2!">
          <DialogTitle className="text-lg font-semibold tracking-tight text-[var(--avila-navy-900)]">
            Converter em negócio
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-[#5c6578]">
            {lead
              ? `Converter ${lead.name} em negócio do CRM?`
              : "Confirme a conversão do lead."}
          </DialogDescription>
        </DialogHeader>

        {contextQuery.isLoading ? (
          <p className="flex items-center gap-2 px-6! pb-3! text-sm text-[#5c6578]">
            <Loader2 className="size-4 animate-spin" />
            Verificando questionários…
          </p>
        ) : null}

        {hasDraftWarning ? (
          <div className="px-6! pb-3!">
            <CommercialWarningBanner
              tone="warning"
              title="Existe questionário em rascunho para este lead."
              description="Você pode converter mesmo assim ou retomar o preenchimento antes."
            />
          </div>
        ) : null}

        {error ? (
          <p className="mx-6! mb-3! rounded-lg border border-destructive/30 bg-destructive/10 px-3! py-2! text-sm text-destructive">
            {getErrorMessage(error, "Não foi possível converter o lead.")}
          </p>
        ) : null}

        <DialogFooter className="mx-0! mt-2! mb-0! flex-row! flex-wrap justify-end! gap-3! border-t border-[#d6cfc4] bg-white px-6! py-4! sm:flex-row! sm:justify-end! sm:gap-3!">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
            Cancelar
          </Button>
          {hasDraftWarning && lead ? (
            <Button
              type="button"
              variant="secondary"
              className="px-4!"
              disabled={pending}
              onClick={() => {
                onContinueQuestionnaire(lead)
                onOpenChange(false)
              }}
            >
              Continuar preenchimento
            </Button>
          ) : null}
          <Button
            type="button"
            variant="convert"
            disabled={
              pending || !lead || (contextQuery.isLoading && !contextQuery.isError)
            }
            onClick={() => {
              if (pending || !lead) return
              void onConvert(lead)
            }}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Convertendo…
              </>
            ) : (
              <>
                <Briefcase className="size-4" />
                {hasDraftWarning ? "Converter mesmo assim" : "Converter"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
