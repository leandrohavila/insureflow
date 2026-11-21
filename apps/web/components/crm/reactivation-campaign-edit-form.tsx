"use client"

import { useState } from "react"
import { SquarePen } from "lucide-react"

import {
  CrmFormDrawer,
  CrmFormDrawerBody,
  CrmFormDrawerCancel,
  CrmFormDrawerFooter,
  CrmFormDrawerHeader,
  CrmFormDrawerSection,
  CrmFormDrawerSubmit,
  crmDrawerInputClass,
} from "@/components/crm/crm-form-drawer"
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
  presentation = "inline",
  onCancel,
}: {
  campaign: CampaignEditFields
  onSaved: (updated: {
    name: string
    description: string | null
    ownerUserId: string
    ownerName: string
  }) => Promise<void> | void
  /** `drawer` usa o `CrmFormDrawer` compartilhado; `inline` mantém o card da página de detalhe. */
  presentation?: "inline" | "drawer"
  /** Obrigatório no modo `drawer`: fecha o drawer sem salvar. */
  onCancel?: () => void
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

  if (presentation === "drawer") {
    return (
      <CrmFormDrawer
        open
        onOpenChange={(open) => {
          if (!open && !busy) onCancel?.()
        }}
      >
        <form
          className="flex h-full min-h-0 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            void onSubmit()
          }}
        >
          <CrmFormDrawerHeader
            icon={SquarePen}
            title="Editar campanha"
            description={campaign.name}
          />
          <CrmFormDrawerBody className="gap-4 px-5! py-4!">
            <CrmFormDrawerSection title="Dados da campanha" className="gap-4 p-4!">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-[#5C6578]">
                  Nome *
                </span>
                <input
                  className={crmDrawerInputClass}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-[#5C6578]">
                  Responsável (ID)
                </span>
                <input
                  className={crmDrawerInputClass}
                  value={ownerUserId}
                  onChange={(event) => setOwnerUserId(event.target.value)}
                  placeholder={campaign.ownerName}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-[#5C6578]">
                  Descrição
                </span>
                <textarea
                  className="min-h-[5.5rem] w-full rounded-lg border border-[#D6CFC4] bg-white px-3! py-2! text-sm text-[#10294B] outline-none placeholder:text-[#5C6578] focus-visible:border-[#10294B] focus-visible:ring-2 focus-visible:ring-[#10294B]/20"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>
            </CrmFormDrawerSection>
            {error ? (
              <p
                className="rounded-xl border border-[#E5C2BE] bg-[#F8E8E6] px-3! py-2! text-sm font-medium text-[#9F2D2D]"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </CrmFormDrawerBody>
          <CrmFormDrawerFooter>
            <CrmFormDrawerCancel disabled={busy} onClick={() => onCancel?.()} />
            <CrmFormDrawerSubmit pending={busy}>
              Salvar alterações
            </CrmFormDrawerSubmit>
          </CrmFormDrawerFooter>
        </form>
      </CrmFormDrawer>
    )
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
