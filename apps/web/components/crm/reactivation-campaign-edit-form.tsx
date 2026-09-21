"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  buildCampaignUpdatePayload,
  canEditReactivationCampaign,
} from "@/lib/crm/reactivation-campaigns"
import { updateReactivationCampaign } from "@/lib/data-access/modules/commercial-reactivation-campaigns/api"

type CampaignEditFields = {
  id: string
  name: string
  description: string | null
  ownerUserId: string
  ownerName: string
  status: string
}

export function ReactivationCampaignEditForm({
  campaign,
  onSaved,
}: {
  campaign: CampaignEditFields
  onSaved: (updated: {
    name: string
    description: string | null
    ownerUserId: string
    ownerName: string
  }) => Promise<void> | void
}) {
  const [name, setName] = useState(campaign.name)
  const [description, setDescription] = useState(campaign.description ?? "")
  const [ownerUserId, setOwnerUserId] = useState(campaign.ownerUserId)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canEditReactivationCampaign(campaign.status)) {
    return (
      <p className="text-sm text-muted-foreground" data-readonly="true">
        Campanha {campaign.status === "FINISHED" ? "encerrada" : "em andamento"}{" "}
        é somente leitura.
      </p>
    )
  }

  async function onSubmit() {
    const payload = buildCampaignUpdatePayload({
      name,
      description,
      ownerUserId,
    })
    if (payload.name.length < 3) {
      setError("Informe um nome com pelo menos 3 caracteres.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const updated = await updateReactivationCampaign(campaign.id, payload)
      await onSaved({
        name: updated.name,
        description: updated.description,
        ownerUserId: updated.ownerUserId,
        ownerName: updated.ownerName,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.06] p-4">
      <h2 className="mb-3 text-sm font-semibold">Editar campanha</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Nome *
          <input
            className="h-9 rounded-md border border-white/10 bg-transparent px-2 text-sm text-foreground"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Responsável (ID)
          <input
            className="h-9 rounded-md border border-white/10 bg-transparent px-2 text-sm text-foreground"
            value={ownerUserId}
            onChange={(event) => setOwnerUserId(event.target.value)}
            placeholder={campaign.ownerName}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:col-span-2">
          Descrição
          <textarea
            className="min-h-[4rem] rounded-md border border-white/10 bg-transparent px-2 py-1.5 text-sm text-foreground"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={onSubmit} disabled={busy}>
          Salvar alterações
        </Button>
      </div>
    </div>
  )
}
