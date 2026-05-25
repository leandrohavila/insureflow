"use client"

import { Loader2 } from "lucide-react"

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
import type { Lead } from "@/lib/data-access/modules/leads"
import { useLeadContext } from "@/lib/data-access/modules/leads"

type ConvertLeadDialogProps = {
  lead: Lead | null
  open: boolean
  pending?: boolean
  onOpenChange: (open: boolean) => void
  onConvert: (lead: Lead) => void | Promise<void>
  onContinueQuestionnaire: (lead: Lead) => void
}

export function ConvertLeadDialog({
  lead,
  open,
  pending,
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
      <DialogContent className="border-white/[0.08] bg-background/95 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Converter em negócio</DialogTitle>
          <DialogDescription>
            {lead
              ? `Converter ${lead.name} em negócio do CRM?`
              : "Confirme a conversão do lead."}
          </DialogDescription>
        </DialogHeader>

        {contextQuery.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Verificando questionários…
          </p>
        ) : null}

        {hasDraftWarning ? (
          <CommercialWarningBanner
            tone="warning"
            title="Existe questionário em rascunho para este lead."
            description="Você pode converter mesmo assim ou retomar o preenchimento antes."
          />
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          {hasDraftWarning && lead ? (
            <Button
              type="button"
              variant="secondary"
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
            ) : hasDraftWarning ? (
              "Converter mesmo assim"
            ) : (
              "Converter"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
