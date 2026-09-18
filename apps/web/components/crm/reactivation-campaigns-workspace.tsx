"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { PermissionGate } from "@/components/auth/permission-gate"
import { Button, buttonVariants } from "@/components/ui/button"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { FilterChip } from "@/components/crm/primitives"
import { CRM_PAGE_SHELL } from "@/lib/crm/crm-layout-classes"
import { queryKeys } from "@/lib/data-access/query-keys"
import {
  createReactivationCampaign,
  fetchReactivationCampaigns,
  type CampaignStatus,
} from "@/lib/data-access/modules/commercial-reactivation-campaigns/api"
import { cn } from "@/lib/utils"

const STATUS_FILTERS: { id: CampaignStatus | ""; label: string }[] = [
  { id: "", label: "Todas" },
  { id: "DRAFT", label: "Rascunho" },
  { id: "IN_PROGRESS", label: "Em andamento" },
  { id: "FINISHED", label: "Encerrada" },
]

function statusLabel(status: CampaignStatus) {
  if (status === "DRAFT") return "Rascunho"
  if (status === "IN_PROGRESS") return "Em andamento"
  return "Encerrada"
}

function formatDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return parsed.toLocaleDateString("pt-BR")
}

export function ReactivationCampaignsWorkspace() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<CampaignStatus | "">("")
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: queryKeys.commercialReactivationCampaigns.list({ status }),
    queryFn: () =>
      fetchReactivationCampaigns({
        status: status || undefined,
        limit: 100,
      }),
  })

  const items = query.data?.data ?? []

  async function onCreate() {
    if (name.trim().length < 3) {
      setError("Informe um nome com pelo menos 3 caracteres.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const created = await createReactivationCampaign({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.commercialReactivationCampaigns.all,
      })
      router.push(`/crm/campaigns/reactivation/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar campanha.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={CRM_PAGE_SHELL}>
      <CrmPageHeader
        badge="CRM · Comercial"
        title="Campanhas de Reativação"
        description="Selecione grupos de leads perdidos e opere a lista de contato — sem disparo automático."
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((item) => (
            <FilterChip
              key={item.id || "all"}
              isActive={status === item.id}
              label={item.label}
              onClick={() => setStatus(item.id)}
            />
          ))}
        </div>
        <PermissionGate permission="crm:manage">
          <Button size="sm" onClick={() => setCreating((value) => !value)}>
            {creating ? "Cancelar" : "Nova campanha"}
          </Button>
        </PermissionGate>
      </div>

      {creating ? (
        <div className="mb-4 rounded-xl border border-white/[0.06] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Nome *
              <input
                className="h-9 rounded-md border border-white/10 bg-transparent px-2 text-sm text-foreground"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Reativação Q3 — Sem retorno"
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
            <Button onClick={onCreate} disabled={busy}>
              Criar campanha
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Criação</th>
              <th className="px-3 py-2">Responsável</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Contatados</th>
              <th className="px-3 py-2">Reativados</th>
              <th className="px-3 py-2">Taxa</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-muted-foreground">
                  Carregando campanhas…
                </td>
              </tr>
            ) : null}
            {!query.isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-muted-foreground">
                  Nenhuma campanha nesta visão.
                </td>
              </tr>
            ) : null}
            {items.map((item) => (
              <tr key={item.id} className="border-t border-white/[0.04]">
                <td className="px-3 py-2 font-medium">{item.name}</td>
                <td className="px-3 py-2 tabular-nums">
                  {formatDate(item.createdAt)}
                </td>
                <td className="px-3 py-2">{item.ownerName}</td>
                <td className="px-3 py-2 tabular-nums">{item.totalLeads}</td>
                <td className="px-3 py-2 tabular-nums">{item.contacted}</td>
                <td className="px-3 py-2 tabular-nums">{item.reactivated}</td>
                <td className="px-3 py-2 tabular-nums">
                  {item.conversionRate.toFixed(1)}%
                </td>
                <td className="px-3 py-2">{statusLabel(item.status)}</td>
                <td className="px-3 py-2">
                  <Link
                    href={`/crm/campaigns/reactivation/${item.id}`}
                    className={cn(
                      buttonVariants({ size: "sm", variant: "ghost" }),
                    )}
                  >
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
