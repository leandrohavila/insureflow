"use client"

import { useEffect, useState } from "react"

import { FormSelect } from "@/components/design-system"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/data-access"
import { useLeadLossReasons } from "@/lib/data-access/modules/lead-loss-reasons"
import type { Lead } from "@/lib/data-access/modules/leads"
import {
  buildMarkLeadLostInput,
  canMarkLeadAsLost,
  resolveActiveLossReason,
  type MarkLeadLostInput,
} from "@/lib/leads/lead-mark-lost"

type LeadMarkLostSectionProps = {
  lead: Lead
  pending: boolean
  onMarkLost: (input: MarkLeadLostInput) => Promise<void>
}

export function LeadMarkLostSection({
  lead,
  pending,
  onMarkLost,
}: LeadMarkLostSectionProps) {
  const reasonsQuery = useLeadLossReasons(true)
  const reasons = reasonsQuery.data ?? []
  const [reasonId, setReasonId] = useState("")
  const [lossError, setLossError] = useState<unknown>(null)
  const [confirming, setConfirming] = useState(false)
  const selected = resolveActiveLossReason(reasons, reasonId)
  const canConfirm = Boolean(selected) && !pending && !confirming

  useEffect(() => {
    setReasonId("")
    setLossError(null)
    setConfirming(false)
  }, [lead.id, lead.status])

  async function confirm() {
    if (!selected || pending || confirming) return
    const input = buildMarkLeadLostInput(selected.id)
    if (!input) return
    setLossError(null)
    setConfirming(true)
    try {
      await onMarkLost(input)
    } catch (error) {
      setLossError(error)
    } finally {
      setConfirming(false)
    }
  }

  if (!canMarkLeadAsLost(lead)) {
    if (lead.status === "lost") {
      return (
        <section className="rounded-lg border border-white/10 p-3">
          <h3 className="text-sm font-medium">Lead perdido</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {lead.lostReason ? lead.lostReason : "Motivo não informado"}
            {lead.reactivationEnabled && lead.reactivationDays
              ? ` · reativação em ${lead.reactivationDays} dias`
              : lead.reactivationEnabled === false
                ? " · sem reativação"
                : ""}
          </p>
        </section>
      )
    }

    return (
      <section className="rounded-lg border border-white/10 p-3">
        <h3 className="text-sm font-medium">Lead convertido</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {lead.dealId
            ? "Este lead já está vinculado a um negócio. A perda fica no fluxo do pipeline."
            : "Este lead já está convertido. A perda não se aplica a este cadastro."}
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-3 rounded-lg border border-white/10 p-3">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Marcar como perdido</h3>
        <p className="text-xs text-muted-foreground">
          Escolha um motivo ativo. A confirmação só segue com o motivo
          selecionado e usa a atualização já existente do lead.
        </p>
      </div>
      <label className="space-y-2">
        <span className="text-sm font-medium">Motivo de perda</span>
        <FormSelect
          value={reasonId}
          aria-label="Motivo de perda"
          disabled={pending || reasonsQuery.isLoading}
          onChange={(event) => {
            setReasonId(event.target.value)
            setLossError(null)
          }}
          options={[
            { value: "", label: "Motivo de perda (obrigatório)" },
            ...reasons.map((reason) => ({
              value: reason.id,
              label: reason.reactivationEnabled
                ? `${reason.name} · reativação em ${reason.reactivationDays} dias`
                : `${reason.name} · sem reativação`,
            })),
          ]}
        />
      </label>
      {selected ? (
        <p className="text-xs text-muted-foreground">
          {selected.reactivationEnabled
            ? `A agenda recebe a reativação prevista em ${selected.reactivationDays} dias, conforme o motivo.`
            : "Este motivo não agenda reativação."}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {reasonsQuery.isSuccess && reasons.length === 0
            ? "Nenhum motivo de perda ativo. Cadastre um em Configurações > Motivos de perda."
            : "Selecione um motivo para confirmar."}
        </p>
      )}
      {lossError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {getErrorMessage(
            lossError,
            "Não foi possível marcar o lead como perdido",
          )}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        disabled={!canConfirm}
        onClick={() => {
          void confirm()
        }}
      >
        {confirming ? "Marcando…" : "Marcar como perdido"}
      </Button>
    </section>
  )
}
