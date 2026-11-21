"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Megaphone, Plus } from "lucide-react"

import { PermissionGate } from "@/components/auth/permission-gate"
import {
  CrmBadge,
  CrmFilterChip,
  CrmFilterGroup,
  crmFilterCardClass,
  type CrmBadgeTone,
} from "@/components/crm/crm-controls"
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
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { ReactivationCampaignEditForm } from "@/components/crm/reactivation-campaign-edit-form"
import { DataTable, type DataTableColumn } from "@/components/design-system"
import { Button, buttonVariants } from "@/components/ui/button"
import { CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL } from "@/lib/crm/crm-layout-classes"
import {
  canEditReactivationCampaign,
  COMMERCIAL_AUTO_REFRESH_MS,
  reactivationCampaignPath,
} from "@/lib/crm/reactivation-campaigns"
import { queryKeys } from "@/lib/data-access/query-keys"
import {
  createReactivationCampaign,
  fetchReactivationCampaigns,
  type CampaignStatus,
  type ReactivationCampaign,
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

function statusTone(status: CampaignStatus): CrmBadgeTone {
  if (status === "DRAFT") return "neutral"
  if (status === "IN_PROGRESS") return "info"
  return "success"
}

function formatDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return parsed.toLocaleDateString("pt-BR")
}

const rowActionClass =
  "h-9 w-auto max-w-full min-w-0 justify-center gap-1.5 px-2.5! text-xs font-semibold"

export function ReactivationCampaignsWorkspace() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<CampaignStatus | "">("")
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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
    refetchInterval: COMMERCIAL_AUTO_REFRESH_MS,
  })

  const items = query.data?.data ?? []
  const editingItem = items.find((item) => item.id === editingId) ?? null

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
      router.push(reactivationCampaignPath(created.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar campanha.")
    } finally {
      setBusy(false)
    }
  }

  function closeCreate() {
    setCreating(false)
    setError(null)
  }

  const columns: DataTableColumn<ReactivationCampaign>[] = [
    {
      key: "name",
      header: "Nome",
      className: "font-semibold text-[#10294B]",
      render: (item) => item.name,
    },
    {
      key: "createdAt",
      header: "Criação",
      className: "whitespace-nowrap tabular-nums",
      render: (item) => formatDate(item.createdAt),
    },
    {
      key: "owner",
      header: "Responsável",
      render: (item) => item.ownerName,
    },
    {
      key: "total",
      header: "Total",
      className: "tabular-nums",
      render: (item) => item.totalLeads,
    },
    {
      key: "contacted",
      header: "Contatados",
      className: "tabular-nums",
      render: (item) => item.contacted,
    },
    {
      key: "reactivated",
      header: "Reativados",
      className: "tabular-nums",
      render: (item) => item.reactivated,
    },
    {
      key: "rate",
      header: "Taxa",
      className: "whitespace-nowrap tabular-nums",
      render: (item) => `${item.conversionRate.toFixed(1)}%`,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <CrmBadge tone={statusTone(item.status)}>
          {statusLabel(item.status)}
        </CrmBadge>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      className: "min-w-[11rem]",
      render: (item) => (
        <div className="flex flex-wrap items-center gap-[var(--if-layout-button-gap)]">
          <Link
            href={reactivationCampaignPath(item.id)}
            className={cn(
              buttonVariants({ variant: "crmSecondary" }),
              rowActionClass,
            )}
          >
            Abrir
          </Link>
          {canEditReactivationCampaign(item.status) ? (
            <PermissionGate permission="crm:manage">
              <Button
                type="button"
                variant="crmSecondary"
                className={rowActionClass}
                onClick={() => setEditingId(item.id)}
              >
                Editar
              </Button>
            </PermissionGate>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className={cn(CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL)}>
      <CrmPageHeader
        badge="CRM · Comercial"
        title="Campanhas de Reativação"
        description="Selecione grupos de leads perdidos e opere a lista de contato — sem disparo automático."
      >
        <PermissionGate permission="crm:manage">
          <Button
            type="button"
            variant="crmPrimary"
            onClick={() => setCreating(true)}
          >
            <Plus className="size-3.5" strokeWidth={1.5} />
            Nova campanha
          </Button>
        </PermissionGate>
      </CrmPageHeader>

      <section
        className={cn(crmFilterCardClass, "min-w-0")}
        aria-label="Filtros de campanhas"
      >
        <CrmFilterGroup label="Status da campanha">
          {STATUS_FILTERS.map((item) => (
            <CrmFilterChip
              key={item.id || "all"}
              pressed={status === item.id}
              onClick={() => setStatus(item.id)}
            >
              {item.label}
            </CrmFilterChip>
          ))}
        </CrmFilterGroup>
      </section>

      <DataTable
        density="default"
        className="w-full"
        cellClassName="px-3! py-3! align-middle whitespace-normal text-[#10294B]"
        headerCellClassName="px-3! whitespace-nowrap"
        tableClassName="w-full min-w-[960px]"
        data={items}
        columns={columns}
        getRowId={(item) => item.id}
        loading={query.isLoading}
        loadingLabel="Carregando campanhas…"
        error={query.isError ? query.error : null}
        errorTitle="Não foi possível carregar as campanhas."
        onRetry={() => void query.refetch()}
        emptyIcon={Megaphone}
        emptyTitle="Nenhuma campanha nesta visão."
        emptyDescription="Crie uma campanha ou escolha outro status."
      />

      {creating ? (
        <CrmFormDrawer
          open
          onOpenChange={(open) => {
            if (!open && !busy) closeCreate()
          }}
        >
          <form
            className="flex h-full min-h-0 flex-col"
            onSubmit={(event) => {
              event.preventDefault()
              void onCreate()
            }}
          >
            <CrmFormDrawerHeader
              icon={Megaphone}
              title="Nova campanha"
              description="Defina o nome e a descrição; os leads são selecionados depois."
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
                    placeholder="Ex.: Reativação Q3 — Sem retorno"
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
              <CrmFormDrawerCancel disabled={busy} onClick={closeCreate} />
              <CrmFormDrawerSubmit pending={busy} pendingLabel="Criando…">
                Criar campanha
              </CrmFormDrawerSubmit>
            </CrmFormDrawerFooter>
          </form>
        </CrmFormDrawer>
      ) : null}

      {editingItem ? (
        <ReactivationCampaignEditForm
          presentation="drawer"
          campaign={editingItem}
          onCancel={() => setEditingId(null)}
          onSaved={async () => {
            setEditingId(null)
            await queryClient.invalidateQueries({
              queryKey: queryKeys.commercialReactivationCampaigns.all,
            })
          }}
        />
      ) : null}
    </div>
  )
}
