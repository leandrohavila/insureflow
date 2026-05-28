"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import {
  ArrowRightLeft,
  ClipboardList,
  Edit3,
  ExternalLink,
  Filter,
  Loader2,
  Mail,
  Phone,
  Search,
  Trash2,
  Upload,
  UserPlus,
  type LucideIcon,
} from "lucide-react"

import { ActivityQuickActions } from "@/components/activities/activity-quick-actions"
import { ActivityTimeline } from "@/components/activities/activity-timeline"
import { CommercialWarningBanner } from "@/components/crm/commercial-warning-banner"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { PermissionGate } from "@/components/auth/permission-gate"
import {
  useCanManage,
  useShowMineLeadsFilter,
} from "@/components/auth/session-provider"
import { ConvertLeadDialog } from "@/components/leads/convert-lead-dialog"
import { LeadSheetV2 } from "@/components/leads/lead-sheet-v2"
import { LeadQuestionnaireBadge } from "@/components/questionnaires/lead-questionnaire-badge"
import { QuestionnaireSubmissionDetailSheet } from "@/components/questionnaires/questionnaire-submission-detail-sheet"
import { QuestionnaireSubmissionDialog } from "@/components/questionnaires/questionnaire-submission-dialog"
import {
  ActionToast,
  DataTable,
  type DataTableColumn,
} from "@/components/shared"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { getErrorMessage } from "@/lib/data-access"
import {
  formatDocumentMask,
  formatCnpjMask,
  formatCpfMask,
  formatPhoneBrMask,
  formatStoredPhone,
  LEAD_DOCUMENT_TYPES,
  normalizeDocument,
  type LeadDocumentType,
} from "@/lib/documents/document"
import { queryKeys } from "@/lib/data-access/query-keys"
import type {
  CreateLeadInput,
  Lead,
  LeadDuplicate,
  LeadListFilters,
  LeadStatus,
} from "@/lib/data-access/modules/leads"
import {
  fetchLead,
  LEAD_STATUSES,
  useConvertLead,
  useCreateLead,
  useDeleteLead,
  useLeadDuplicates,
  useLeads,
  useUpdateLead,
} from "@/lib/data-access/modules/leads"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import { easeOut } from "@/lib/motion"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { closeEntitySheetNavigation } from "@/lib/crm/entity-sheet-navigation"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 400

const statusLabels: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  converted: "Convertido",
  lost: "Perdido",
}

const statusStyles: Record<LeadStatus, string> = {
  new: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  contacted: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  qualified: "border-primary/35 bg-primary/15 text-primary-foreground",
  converted: "border-emerald-400/35 bg-emerald-500/10 text-emerald-300",
  lost: "border-rose-400/35 bg-rose-500/10 text-rose-200",
}

export function LeadsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS)
  const [status, setStatus] = useState<LeadStatus | "all">("all")
  const [source, setSource] = useState("")
  const [mineOnly, setMineOnly] = useState(false)
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [questionnaireLead, setQuestionnaireLead] = useState<Lead | null>(null)
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(
    null,
  )
  const [convertToastDealId, setConvertToastDealId] = useState<string | null>(
    null,
  )
  const [convertTarget, setConvertTarget] = useState<Lead | null>(null)
  const convertSubmitLockRef = useRef(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  // Quando o flag ?sheet=v2 está ON e o usuário clica "Editar dados do lead"
  // dentro do LeadSheetV2 (que é leitura-primeiro), forçamos o fallback para o
  // LeadDialog legado. Isso evita criar formulário inline (fora do escopo) e
  // garante paridade funcional com o fluxo atual.
  const [forceLegacyForm, setForceLegacyForm] = useState(false)
  const reduce = useReducedMotion()
  const canManageLeads = useCanManage("leads:view")
  const canManageQuestionnaires = useCanManage("questionnaires:view")
  const showMineFilter = useShowMineLeadsFilter()
  // Feature flag de rollout do LeadSheetV2 — espelho de `?sheet=v2` do
  // `DealsPage`. Default = legado, opt-in via querystring. Quando OFF, o
  // sheet v2 nem é montado, garantindo zero impacto sobre usuários atuais.
  const isLeadSheetV2 = searchParams.get("sheet") === "v2"

  const filters = useMemo<LeadListFilters>(
    () => ({
      search,
      status,
      source,
      mine: mineOnly,
      page,
      limit: PAGE_SIZE,
    }),
    [mineOnly, page, search, source, status],
  )

  const leadsQuery = useLeads(filters)
  const createLead = useCreateLead()
  const updateLead = useUpdateLead(filters)
  const deleteLead = useDeleteLead(filters)
  const convertLead = useConvertLead(filters)

  const syncLeadUrlParams = useCallback(
    (updates: { lead?: string | null; convert?: string | null }) => {
      const params = new URLSearchParams(searchParams.toString())
      if (updates.lead !== undefined) {
        if (updates.lead) params.set("lead", updates.lead)
        else params.delete("lead")
      }
      if (updates.convert !== undefined) {
        if (updates.convert) params.set("convert", updates.convert)
        else params.delete("convert")
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const closeConvertDialog = useCallback(() => {
    setConvertTarget(null)
    setDialogOpen(false)
    setEditingLead(null)
    setForceLegacyForm(false)
    syncLeadUrlParams({ lead: null, convert: null })
  }, [syncLeadUrlParams])

  const openConvertDialog = useCallback(
    (lead: Lead) => {
      // Fechamos o sheet/dialog ANTES de abrir o ConvertLeadDialog para evitar
      // stacking de portais (dois Sheets/Dialogs no mesmo eixo lateral). Mesmo
      // padrão usado pelo fluxo legado — apenas inclui o reset do flag local.
      setDialogOpen(false)
      setEditingLead(null)
      setForceLegacyForm(false)
      setConvertTarget(lead)
      syncLeadUrlParams({ lead: null, convert: lead.id })
    },
    [syncLeadUrlParams],
  )

  useEffect(() => {
    if (searchParams.get("create") === "lead" && canManageLeads) {
      setEditingLead(null)
      setDialogOpen(true)
      const params = new URLSearchParams(searchParams.toString())
      params.delete("create")
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }
  }, [canManageLeads, pathname, router, searchParams])

  useEffect(() => {
    const convertId = searchParams.get("convert")
    const leadId = searchParams.get("lead")
    const deepLinkId = convertId ?? leadId
    if (!deepLinkId) return

    let cancelled = false
    void fetchLead(deepLinkId)
      .then((lead) => {
        if (cancelled) return
        if (convertId) {
          if (lead.status === "converted") {
            syncLeadUrlParams({ lead: null, convert: null })
            return
          }
          setConvertTarget(lead)
          setDialogOpen(false)
          setEditingLead(null)
          return
        }
        setEditingLead(lead)
        setDialogOpen(true)
      })
      .catch(() => {
        // lead inexistente ou sem permissão — ignorar
      })

    return () => {
      cancelled = true
    }
  }, [searchParams, syncLeadUrlParams])

  const leads = leadsQuery.data?.data ?? []
  const meta = leadsQuery.data?.meta

  useEffect(() => {
    if (!showMineFilter && mineOnly) {
      setMineOnly(false)
    }
  }, [mineOnly, showMineFilter])

  useEffect(() => {
    setPage(1)
  }, [mineOnly, search, source, status])

  async function openLeadById(id: string) {
    const lead = await queryClient.fetchQuery({
      queryKey: queryKeys.leads.detail(id),
      queryFn: () => fetchLead(id),
    })
    setEditingLead(lead)
    setDialogOpen(true)
  }

  const columns = useMemo<DataTableColumn<Lead>[]>(
    () => [
      {
        key: "name",
        header: "Lead",
        render: (row) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-9 border border-white/10">
              <AvatarFallback className="bg-primary/20 text-[11px] font-semibold text-primary">
                {row.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium tracking-[-0.02em]">{row.name}</p>
              <p className="text-xs text-muted-foreground">
                {row.company || "Sem empresa"}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "contact",
        header: "Contato",
        hideOnMobile: true,
        render: (row) => (
          <div className="space-y-1 text-xs text-muted-foreground">
            {row.email ? (
              <span className="flex items-center gap-1.5">
                <Mail className="size-3 opacity-60" />
                {row.email}
              </span>
            ) : null}
            {row.phone ? (
              <span className="flex items-center gap-1.5">
                <Phone className="size-3 opacity-60" />
                {row.phone}
              </span>
            ) : null}
            {!row.email && !row.phone ? "Sem contato" : null}
          </div>
        ),
      },
      {
        key: "source",
        header: "Origem",
        hideOnMobile: true,
        render: (row) => (
          <Badge
            variant="outline"
            className="rounded-full border-white/10 text-[10px]"
          >
            {row.source || "Não informada"}
          </Badge>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <Badge
            variant="outline"
            className={cn(
              "rounded-full text-[10px] font-semibold",
              statusStyles[row.status],
            )}
          >
            {statusLabels[row.status]}
          </Badge>
        ),
      },
      {
        key: "questionnaire",
        header: "Questionário",
        render: (row) => (
          <LeadQuestionnaireBadge
            leadId={row.id}
            onViewSubmission={setSelectedSubmissionId}
            onFill={() => setQuestionnaireLead(row)}
          />
        ),
      },
      {
        key: "owner",
        header: "Responsável",
        hideOnMobile: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.assignedTo || "Sem responsável"}
          </span>
        ),
      },
      {
        key: "lastInteraction",
        header: "Última interação",
        hideOnMobile: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {formatLastInteraction(row.lastInteractionAt ?? row.lastContactAt)}
          </span>
        ),
      },
    ],
    [setSelectedSubmissionId],
  )

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="flex flex-1 flex-col gap-8 px-4 py-8 md:gap-10 md:px-8 md:py-10"
    >
      <CrmPageHeader
        badge="Captação comercial"
        title="Leads"
        description="Entrada real de oportunidades da corretora, com qualificação e conversão direta para negócios no CRM."
        primaryAction={
          canManageLeads
            ? {
                label: "Novo lead",
                onClick: () => {
                  setEditingLead(null)
                  setDialogOpen(true)
                },
              }
            : undefined
        }
      >
        <PermissionGate permission="leads:manage">
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="size-3.5" strokeWidth={1.5} />
            Importar
          </Button>
        </PermissionGate>
      </CrmPageHeader>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <LeadMetric
          icon={UserPlus}
          label="Leads"
          value={meta?.total ?? leads.length}
        />
        <LeadMetric
          icon={ArrowRightLeft}
          label="Convertidos"
          value={meta?.counts?.converted ?? 0}
        />
        <LeadMetric
          icon={Filter}
          label="Qualificados"
          value={meta?.counts?.qualified ?? 0}
        />
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: easeOut }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Buscar por nome, empresa, contato, origem ou responsável…"
            className="h-10 rounded-full border-white/[0.08] bg-white/[0.04] pl-10"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as LeadStatus | "all")
            }
            className="flex h-9 rounded-md border border-input bg-background/40 px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="all">Todos os status</option>
            {LEAD_STATUSES.map((item) => (
              <option key={item} value={item}>
                {statusLabels[item]}
              </option>
            ))}
          </select>
          <Input
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="Origem"
            className="h-9 w-36 border-white/[0.08] bg-white/[0.04]"
          />
          {showMineFilter ? (
            <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="size-3.5 accent-primary"
                checked={mineOnly}
                onChange={(event) => setMineOnly(event.target.checked)}
              />
              Meus leads
            </label>
          ) : null}
        </div>
      </motion.div>

      <DataTable
        data={leads}
        columns={columns}
        getRowId={(row) => row.id}
        selectable
        loading={leadsQuery.isLoading}
        loadingLabel="Carregando leads…"
        error={leadsQuery.isError ? leadsQuery.error : null}
        errorTitle="Não foi possível carregar leads."
        onRetry={() => leadsQuery.refetch()}
        emptyIcon={UserPlus}
        emptyTitle="Nenhum lead encontrado."
        emptyDescription="Ajuste os filtros ou cadastre o primeiro lead."
        emptyAction={
          <PermissionGate permission="leads:manage">
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              Novo lead
            </Button>
          </PermissionGate>
        }
        onRowClick={
          canManageLeads
            ? (row) => {
                setEditingLead(row)
                setDialogOpen(true)
              }
            : undefined
        }
        rowActions={[
          {
            key: "open-deal",
            label: "Abrir negócio",
            icon: ExternalLink,
            disabled: (row) => !row.dealId,
            permission: "crm:view",
            onSelect: (row) => {
              if (row.dealId) {
                router.push(`/crm/negocios?deal=${row.dealId}`)
              }
            },
          },
          {
            key: "questionnaire",
            label: "Preencher questionário",
            icon: ClipboardList,
            permission: "questionnaires:manage",
            onSelect: (row) => setQuestionnaireLead(row),
          },
          {
            key: "convert",
            label: "Converter em negócio",
            icon: ArrowRightLeft,
            disabled: (row) => row.status === "converted" || convertLead.isPending,
            permission: "leads:manage",
            onSelect: (row) => openConvertDialog(row),
          },
          {
            key: "edit",
            label: "Editar lead",
            icon: Edit3,
            permission: "leads:manage",
            onSelect: (row) => {
              setEditingLead(row)
              setDialogOpen(true)
            },
          },
          {
            key: "delete",
            label: "Excluir lead",
            icon: Trash2,
            variant: "destructive",
            disabled: deleteLead.isPending,
            permission: "leads:manage",
            onSelect: (row) => {
              if (window.confirm(`Excluir lead ${row.name}?`)) {
                deleteLead.mutate(row.id)
              }
            },
          },
        ]}
        pagination={{
          meta: {
            page: meta?.page ?? page,
            totalPages: meta?.totalPages ?? 1,
            total: meta?.total,
          },
          onPageChange: setPage,
        }}
        title="Todos os leads"
        subtitle={`${meta?.total ?? leads.length} registros na captação`}
      />

      {(createLead.error || updateLead.error || convertLead.error) && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {getErrorMessage(
            createLead.error ?? updateLead.error ?? convertLead.error,
            "Erro ao processar lead",
          )}
        </p>
      )}

      {/*
        Dual-render do detalhe/edição do lead (Fase L5 — LeadSheetV2):

        Sem flag (default):
        - `LeadDialog` lida com TUDO (criar, ver detalhes, editar campos).

        Com `?sheet=v2`:
        - `LeadSheetV2` lida com leitura + ações operacionais (timeline,
          questionário, conversão).
        - `LeadDialog` permanece montado mas só "abre" quando:
            (a) é criação (`editingLead === null`); OU
            (b) o usuário clicou "Editar dados do lead" dentro do sheet,
                forçando o fallback via `forceLegacyForm`.
        Isso garante zero alteração no caminho de criação/edição de campos
        e evita stacking entre Sheet (lateral) e Dialog (centro).
      */}
      <LeadDialog
        lead={editingLead}
        open={
          canManageLeads &&
          dialogOpen &&
          (!isLeadSheetV2 || forceLegacyForm || editingLead === null)
        }
        pending={createLead.isPending || updateLead.isPending}
        error={createLead.error ?? updateLead.error}
        onOpenExistingLead={openLeadById}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingLead(null)
            setForceLegacyForm(false)
          }
        }}
        onSubmit={(input) => {
          if (editingLead) {
            updateLead.mutate(
              { id: editingLead.id, input },
              {
                onSuccess: () => {
                  setDialogOpen(false)
                  setForceLegacyForm(false)
                },
              },
            )
            return
          }

          createLead.mutate(input, {
            onSuccess: () => setDialogOpen(false),
          })
        }}
      />

      {isLeadSheetV2 ? (
        <LeadSheetV2
          lead={editingLead}
          open={
            canManageLeads &&
            dialogOpen &&
            editingLead !== null &&
            !forceLegacyForm
          }
          isConverting={convertLead.isPending}
          onOpenChange={(open) => {
            if (!open) {
              setDialogOpen(false)
              setEditingLead(null)
              setForceLegacyForm(false)
              closeEntitySheetNavigation({
                router,
                pathname,
                searchParams,
                entityType: "lead",
              })
            }
          }}
          onConvert={(lead) => {
            // openConvertDialog já fecha o sheet/dialog ANTES de abrir o
            // ConvertLeadDialog — evita stacking de portais.
            openConvertDialog(lead)
          }}
          onEdit={(lead) => {
            // Fallback ao LeadDialog para o form completo. Mantém editingLead
            // e dialogOpen=true; só ativa forceLegacyForm para inverter o
            // dual-render (sheet some, dialog aparece).
            setEditingLead(lead)
            setForceLegacyForm(true)
          }}
          onFillQuestionnaire={(lead) => {
            // QuestionnaireSubmissionDialog é Dialog centro; pode coexistir
            // com o sheet à direita, mas fechamos o sheet pra reduzir ruído
            // visual e manter a atenção operacional.
            setDialogOpen(false)
            setEditingLead(null)
            setForceLegacyForm(false)
            setQuestionnaireLead(lead)
          }}
          onViewSubmission={(submissionId) => {
            // QuestionnaireSubmissionDetailSheet é Sheet lateral — sobrepõe
            // o LeadSheetV2 no mesmo lado. Fechamos o sheet v2 antes pra
            // evitar dois sheets coexistirem.
            setDialogOpen(false)
            setEditingLead(null)
            setForceLegacyForm(false)
            setSelectedSubmissionId(submissionId)
          }}
        />
      ) : null}

      <ConvertLeadDialog
        key={convertTarget?.id ?? "convert-closed"}
        lead={convertTarget}
        open={convertTarget !== null}
        pending={convertLead.isPending}
        onOpenChange={(open) => {
          if (!open) closeConvertDialog()
        }}
        onConvert={async (lead) => {
          if (convertLead.isPending || convertSubmitLockRef.current) return
          convertSubmitLockRef.current = true
          try {
            const { deal } = await convertLead.mutateAsync({ id: lead.id })
            closeConvertDialog()
            setConvertToastDealId(deal.id)
          } catch {
            // erro exibido via convertLead.error
          } finally {
            convertSubmitLockRef.current = false
          }
        }}
        onContinueQuestionnaire={(lead) => {
          closeConvertDialog()
          setQuestionnaireLead(lead)
        }}
      />

      <QuestionnaireSubmissionDialog
        open={canManageQuestionnaires && Boolean(questionnaireLead)}
        leadId={questionnaireLead?.id ?? null}
        leadName={questionnaireLead?.name}
        onOpenChange={(open) => {
          if (!open) setQuestionnaireLead(null)
        }}
      />

      <QuestionnaireSubmissionDetailSheet
        submissionId={selectedSubmissionId}
        open={selectedSubmissionId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSubmissionId(null)
        }}
      />

      <ActionToast
        open={convertToastDealId !== null}
        message="Negócio criado"
        actionLabel="Abrir negócio"
        onAction={() => {
          if (convertToastDealId) {
            router.push(`/crm/negocios?deal=${convertToastDealId}`)
          }
          setConvertToastDealId(null)
        }}
        onDismiss={() => setConvertToastDealId(null)}
      />
    </motion.div>
  )
}

function LeadMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: number
}) {
  return (
    <div className="glass-panel rounded-2xl border border-white/[0.06] p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="tabular-metric text-xl font-semibold">{value}</p>
        </div>
      </div>
    </div>
  )
}

type LeadForm = {
  name: string
  email: string
  phone: string
  company: string
  source: string
  documentType: LeadDocumentType
  document: string
  status: LeadStatus
  notes: string
  assignedTo: string
}

function formatLeadDate(value: string | null | undefined) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatStoredDocument(
  documentType: LeadDocumentType | null | undefined,
  document: string | null | undefined,
) {
  if (!documentType || !document) return ""
  return documentType === "cpf"
    ? formatCpfMask(document)
    : formatCnpjMask(document)
}

function buildDuplicateMeta(duplicate: LeadDuplicate) {
  return (
    <ul className="space-y-0.5">
      <li>
        <span className="opacity-70">Status:</span>{" "}
        {statusLabels[duplicate.status]}
      </li>
      <li>
        <span className="opacity-70">Responsável:</span>{" "}
        {duplicate.assignedTo || "Sem responsável"}
      </li>
      <li>
        <span className="opacity-70">Último contato:</span>{" "}
        {formatLeadDate(duplicate.lastContactAt)}
      </li>
      <li>
        <span className="opacity-70">Criado em:</span>{" "}
        {formatLeadDate(duplicate.createdAt)}
      </li>
    </ul>
  )
}

function optionalFormValue(value: string) {
  return value.trim() || undefined
}

function LeadDialog({
  lead,
  open,
  pending,
  error,
  onOpenChange,
  onSubmit,
  onOpenExistingLead,
}: {
  lead: Lead | null
  open: boolean
  pending: boolean
  error: unknown
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreateLeadInput) => void
  onOpenExistingLead: (leadId: string) => void
}) {
  const { session } = useSession()
  const [duplicateDismissed, setDuplicateDismissed] = useState(false)
  const [form, setForm] = useState<LeadForm>({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
    documentType: "cpf",
    document: "",
    status: "new",
    notes: "",
    assignedTo: "",
  })

  const duplicatesQuery = useLeadDuplicates({
    document: form.document,
    excludeId: lead?.id,
    enabled: open && !duplicateDismissed,
    debounceMs: 500,
  })

  const duplicates = duplicatesQuery.data ?? []
  const primaryDuplicate = duplicates[0]

  useEffect(() => {
    if (!open) return
    setDuplicateDismissed(false)
    setForm({
      name: lead?.name ?? "",
      email: lead?.email ?? "",
      phone: formatStoredPhone(lead?.phone),
      company: lead?.company ?? "",
      source: lead?.source ?? "",
      documentType: lead?.documentType ?? "cpf",
      document: formatStoredDocument(lead?.documentType, lead?.document),
      status: lead?.status ?? "new",
      notes: lead?.notes ?? "",
      assignedTo: lead?.assignedTo ?? session?.name ?? "",
    })
  }, [lead, open, session?.name])

  useEffect(() => {
    setDuplicateDismissed(false)
  }, [form.document, form.documentType])

  function update<K extends keyof LeadForm>(key: K, value: LeadForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim()) return

    const normalized = normalizeDocument(
      form.document.trim() ? form.documentType : undefined,
      form.document,
    )

    onSubmit({
      name: form.name.trim(),
      email: optionalFormValue(form.email),
      phone: optionalFormValue(form.phone),
      company: optionalFormValue(form.company),
      source: optionalFormValue(form.source),
      ...(normalized
        ? {
            documentType: normalized.documentType,
            document: normalized.document,
          }
        : {}),
      status: form.status,
      notes: optionalFormValue(form.notes),
      assignedTo: optionalFormValue(form.assignedTo),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] bg-background/95 sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
            <DialogDescription>
              Cadastre a oportunidade de entrada e acompanhe até a conversão no
              CRM.
            </DialogDescription>
            {lead ? (
              <p className="text-xs text-muted-foreground">
                {formatLastInteraction(
                  lead.lastInteractionAt ?? lead.lastContactAt,
                )}
              </p>
            ) : null}
          </DialogHeader>

          {lead ? (
            <ActivityQuickActions leadId={lead.id} dealId={lead.dealId} compact />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Nome</span>
              <Input
                required
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Ex.: Marina Costa"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">E-mail</span>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="lead@email.com"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Telefone</span>
              <Input
                value={form.phone}
                onChange={(event) =>
                  update("phone", formatPhoneBrMask(event.target.value))
                }
                placeholder="(11) 99999-9999"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Tipo de documento</span>
              <select
                value={form.documentType}
                onChange={(event) =>
                  update("documentType", event.target.value as LeadDocumentType)
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {LEAD_DOCUMENT_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">
                {form.documentType === "cpf" ? "CPF" : "CNPJ"}
              </span>
              <Input
                value={form.document}
                onChange={(event) =>
                  update(
                    "document",
                    formatDocumentMask(form.documentType, event.target.value),
                  )
                }
                placeholder={
                  form.documentType === "cpf"
                    ? "000.000.000-00"
                    : "00.000.000/0000-00"
                }
                inputMode="numeric"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Empresa</span>
              <Input
                value={form.company}
                onChange={(event) => update("company", event.target.value)}
                placeholder="Ex.: Transportes Sul"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Origem</span>
              <Input
                value={form.source}
                onChange={(event) => update("source", event.target.value)}
                placeholder="whatsapp, site, indicação..."
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  update("status", event.target.value as LeadStatus)
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {LEAD_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {statusLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Responsável</span>
              <Input
                value={form.assignedTo}
                onChange={(event) => update("assignedTo", event.target.value)}
                placeholder="Ex.: Ana Costa"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Notas</span>
              <Input
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
                placeholder="Contexto da oportunidade"
              />
            </label>
          </div>

          {primaryDuplicate && !duplicateDismissed ? (
            <CommercialWarningBanner
              title={`Já existe lead com este ${form.documentType === "cpf" ? "CPF" : "CNPJ"}`}
              description={
                <span>
                  <strong>{primaryDuplicate.name}</strong>
                  {duplicates.length > 1
                    ? ` e mais ${duplicates.length - 1} registro(s) com o mesmo documento.`
                    : " possui o mesmo documento."}
                </span>
              }
              meta={buildDuplicateMeta(primaryDuplicate)}
              primaryAction={{
                label: "Abrir lead existente",
                onClick: () => onOpenExistingLead(primaryDuplicate.id),
              }}
              secondaryAction={{
                label: "Continuar mesmo assim",
                variant: "outline",
                onClick: () => setDuplicateDismissed(true),
              }}
            />
          ) : null}

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {getErrorMessage(error, "Erro ao salvar lead")}
            </p>
          ) : null}

          {lead ? (
            <>
              <Separator className="bg-white/[0.06]" />
              <ActivityTimeline leadId={lead.id} dealId={lead.dealId} />
            </>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando…
                </>
              ) : lead ? (
                "Salvar alterações"
              ) : (
                "Salvar lead"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
