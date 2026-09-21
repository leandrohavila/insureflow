"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { PermissionGate } from "@/components/auth/permission-gate"
import { Button, buttonVariants } from "@/components/ui/button"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { ReactivationCampaignEditForm } from "@/components/crm/reactivation-campaign-edit-form"
import { FilterChip } from "@/components/crm/primitives"
import { CRM_PAGE_SHELL } from "@/lib/crm/crm-layout-classes"
import {
  canEditReactivationCampaign,
  COMMERCIAL_AUTO_REFRESH_MS,
  REACTIVATION_CAMPAIGNS_PATH,
} from "@/lib/crm/reactivation-campaigns"
import { queryKeys } from "@/lib/data-access/query-keys"
import { fetchLeadLossReasons } from "@/lib/data-access/modules/lead-loss-reasons/api"
import {
  addCampaignLeads,
  finishReactivationCampaign,
  fetchReactivationCampaign,
  previewCampaignLeads,
  reactivateCampaignLead,
  removeCampaignLead,
  startReactivationCampaign,
  updateCampaignLead,
  type CampaignLeadContactStatus,
} from "@/lib/data-access/modules/commercial-reactivation-campaigns/api"
import { cn } from "@/lib/utils"

const LOST_DAYS = [30, 60, 90, 180] as const

const CONTACT_LABELS: Record<CampaignLeadContactStatus, string> = {
  NOT_STARTED: "Não iniciado",
  IN_PROGRESS: "Em andamento",
  NO_RESPONSE: "Sem retorno",
  INTERESTED: "Interessado",
  REACTIVATED: "Reativado",
  CLOSED: "Encerrado",
}

function formatDate(value: string | null) {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return parsed.toLocaleDateString("pt-BR")
}

function statusCampaignLabel(status: string) {
  if (status === "DRAFT") return "Rascunho"
  if (status === "IN_PROGRESS") return "Em andamento"
  return "Encerrada"
}

export function ReactivationCampaignDetailWorkspace({
  campaignId,
}: {
  campaignId: string
}) {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [lossReasonId, setLossReasonId] = useState("")
  const [source, setSource] = useState("")
  const [ownerUserId, setOwnerUserId] = useState("")
  const [company, setCompany] = useState("")
  const [lostDays, setLostDays] = useState<30 | 60 | 90 | 180 | "">("")
  const [previewTotal, setPreviewTotal] = useState<number | null>(null)

  const query = useQuery({
    queryKey: queryKeys.commercialReactivationCampaigns.detail(campaignId),
    queryFn: () => fetchReactivationCampaign(campaignId),
    refetchInterval: COMMERCIAL_AUTO_REFRESH_MS,
  })

  const reasonsQuery = useQuery({
    queryKey: ["lead-loss-reasons", "active"],
    queryFn: () => fetchLeadLossReasons(true),
  })

  const campaign = query.data

  async function refresh() {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.commercialReactivationCampaigns.detail(campaignId),
    })
    await queryClient.invalidateQueries({
      queryKey: queryKeys.commercialReactivationCampaigns.all,
    })
  }

  function selectionFilters() {
    return {
      lossReasonId: lossReasonId || undefined,
      source: source.trim() || undefined,
      ownerUserId: ownerUserId || undefined,
      company: company.trim() || undefined,
      lostDays: lostDays || undefined,
    }
  }

  async function onPreview() {
    setBusy(true)
    setError(null)
    try {
      const result = await previewCampaignLeads(campaignId, selectionFilters())
      setPreviewTotal(result.total)
      setMessage(`${result.total} leads encontrados`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na prévia.")
    } finally {
      setBusy(false)
    }
  }

  async function onAddLeads() {
    setBusy(true)
    setError(null)
    try {
      const result = await addCampaignLeads(campaignId, selectionFilters())
      setMessage(`${result.added} leads adicionados (total ${result.total}).`)
      setPreviewTotal(null)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao adicionar leads.")
    } finally {
      setBusy(false)
    }
  }

  async function onStart() {
    setBusy(true)
    setError(null)
    try {
      await startReactivationCampaign(campaignId)
      setMessage("Campanha iniciada.")
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao iniciar.")
    } finally {
      setBusy(false)
    }
  }

  async function onFinish() {
    setBusy(true)
    setError(null)
    try {
      await finishReactivationCampaign(campaignId)
      setMessage("Campanha encerrada.")
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao encerrar.")
    } finally {
      setBusy(false)
    }
  }

  async function onContactStatus(
    campaignLeadId: string,
    contactStatus: CampaignLeadContactStatus,
  ) {
    setBusy(true)
    setError(null)
    try {
      await updateCampaignLead(campaignId, campaignLeadId, { contactStatus })
      await refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao atualizar contato.",
      )
    } finally {
      setBusy(false)
    }
  }

  async function onReactivate(campaignLeadId: string) {
    setBusy(true)
    setError(null)
    try {
      await reactivateCampaignLead(campaignId, campaignLeadId, {
        notes: "Reativado pela campanha",
      })
      setMessage("Lead reativado e movido ao funil ativo.")
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao reativar.")
    } finally {
      setBusy(false)
    }
  }

  async function onRemove(campaignLeadId: string, leadName: string) {
    setBusy(true)
    setError(null)
    try {
      await removeCampaignLead(campaignId, campaignLeadId)
      setMessage(`Lead ${leadName} removido da campanha.`)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao remover lead.")
    } finally {
      setBusy(false)
    }
  }

  if (query.isLoading) {
    return (
      <div className={CRM_PAGE_SHELL}>
        <p className="text-sm text-muted-foreground">Carregando campanha…</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className={CRM_PAGE_SHELL}>
        <p className="text-sm text-destructive">Campanha não encontrada.</p>
        <Link href={REACTIVATION_CAMPAIGNS_PATH} className="text-sm underline">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <div className={CRM_PAGE_SHELL}>
      <CrmPageHeader
        badge="CRM · Comercial"
        title={campaign.name}
        description={
          campaign.description ||
          "Lista operacional de leads perdidos para contato humano."
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>Status: {statusCampaignLabel(campaign.status)}</span>
        <span>·</span>
        <span>Responsável: {campaign.ownerName}</span>
        <span>·</span>
        <Link href={REACTIVATION_CAMPAIGNS_PATH} className="underline">
          Voltar à lista
        </Link>
      </div>

      {canEditReactivationCampaign(campaign.status) ? (
        <div className="mb-4">
          <PermissionGate permission="crm:manage">
            <ReactivationCampaignEditForm
              campaign={campaign}
              onSaved={async () => {
                await refresh()
              }}
            />
          </PermissionGate>
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Total leads" value={campaign.totalLeads} />
        <Kpi label="Contatados" value={campaign.contacted} />
        <Kpi label="Reativados" value={campaign.reactivated} />
        <Kpi
          label="Taxa conversão"
          valueLabel={`${campaign.conversionRate.toFixed(1)}%`}
        />
      </div>

      {message ? (
        <p
          className="mb-3 rounded-md border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
          role="status"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <PermissionGate permission="crm:manage">
        <div className="mb-4 flex flex-wrap gap-2">
          {campaign.status === "DRAFT" ? (
            <Button size="sm" disabled={busy} onClick={onStart}>
              Iniciar campanha
            </Button>
          ) : null}
          {campaign.status !== "FINISHED" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={onFinish}
            >
              Encerrar
            </Button>
          ) : null}
        </div>
      </PermissionGate>

      {campaign.status !== "FINISHED" ? (
        <section className="mb-6 rounded-xl border border-white/[0.06] p-4">
          <h2 className="mb-3 text-sm font-semibold">Seleção de leads</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {LOST_DAYS.map((days) => (
              <FilterChip
                key={days}
                isActive={lostDays === days}
                label={`${days} dias`}
                onClick={() =>
                  setLostDays((current) => (current === days ? "" : days))
                }
              />
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Motivo da perda
              <select
                className="h-9 rounded-md border border-white/10 bg-transparent px-2 text-sm text-foreground"
                value={lossReasonId}
                onChange={(event) => setLossReasonId(event.target.value)}
              >
                <option value="">Todos</option>
                {(reasonsQuery.data ?? []).map((reason) => (
                  <option key={reason.id} value={reason.id}>
                    {reason.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Origem
              <input
                className="h-9 rounded-md border border-white/10 bg-transparent px-2 text-sm text-foreground"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="site, indicação…"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Empresa
              <input
                className="h-9 rounded-md border border-white/10 bg-transparent px-2 text-sm text-foreground"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Razão social / fantasia"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Responsável (ID)
              <input
                className="h-9 rounded-md border border-white/10 bg-transparent px-2 text-sm text-foreground"
                value={ownerUserId}
                onChange={(event) => setOwnerUserId(event.target.value)}
                placeholder="ownerUserId"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={onPreview}>
              Buscar leads
            </Button>
            <PermissionGate permission="crm:manage">
              <Button size="sm" disabled={busy} onClick={onAddLeads}>
                Adicionar leads à campanha
              </Button>
            </PermissionGate>
            {previewTotal !== null ? (
              <span className="text-sm text-muted-foreground">
                {previewTotal} leads encontrados
              </span>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Telefone</th>
              <th className="px-3 py-2">Motivo perda</th>
              <th className="px-3 py-2">Data perda</th>
              <th className="px-3 py-2">Responsável</th>
              <th className="px-3 py-2">Status contato</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {campaign.leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-muted-foreground">
                  Nenhum lead nesta campanha.
                </td>
              </tr>
            ) : null}
            {campaign.leads.map((row) => (
              <tr key={row.id} className="border-t border-white/[0.04]">
                <td className="px-3 py-2 font-medium">{row.name}</td>
                <td className="px-3 py-2 tabular-nums">{row.phone || "—"}</td>
                <td className="px-3 py-2">{row.lossReasonName || "—"}</td>
                <td className="px-3 py-2 tabular-nums">
                  {formatDate(row.lostAt)}
                </td>
                <td className="px-3 py-2">{row.ownerName || "—"}</td>
                <td className="px-3 py-2">
                  {CONTACT_LABELS[row.contactStatus]}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <Link
                      href={`/leads?lead=${row.leadId}`}
                      className={cn(
                        buttonVariants({ size: "sm", variant: "ghost" }),
                      )}
                    >
                      Abrir Lead
                    </Link>
                    <PermissionGate permission="leads:manage">
                      {row.contactStatus !== "REACTIVATED" &&
                      campaign.status !== "FINISHED" ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() =>
                              onContactStatus(row.id, "IN_PROGRESS")
                            }
                          >
                            Registrar contato
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() =>
                              onContactStatus(row.id, "INTERESTED")
                            }
                          >
                            Interessado
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => onReactivate(row.id)}
                          >
                            Reativado
                          </Button>
                        </>
                      ) : null}
                    </PermissionGate>
                    <PermissionGate permission="crm:manage">
                      {campaign.status !== "FINISHED" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => onRemove(row.id, row.name)}
                        >
                          Remover
                        </Button>
                      ) : null}
                    </PermissionGate>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Kpi({
  label,
  value,
  valueLabel,
}: {
  label: string
  value?: number
  valueLabel?: string
}) {
  return (
    <div className="rounded-md border border-white/[0.06] px-3 py-2">
      <p className="text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold tabular-nums">
        {valueLabel ?? value ?? 0}
      </p>
    </div>
  )
}
