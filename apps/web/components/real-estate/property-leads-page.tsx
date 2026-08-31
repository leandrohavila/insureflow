"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import {
  CalendarDays,
  Edit3,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"

import { PermissionGate } from "@/components/auth/permission-gate"
import { useCanManage, useSession } from "@/components/auth/session-provider"
import { RealEstateLeadDialog } from "@/components/real-estate/real-estate-lead-dialog"
import { ActionToast } from "@/components/shared"
import {
  ContentContainer,
  DataTable,
  Grid,
  PageActions,
  PageActionsGroup,
  PageContainer,
  PageHeader,
  Section,
  Stack,
  StatCard,
  type DataTableColumn,
} from "@/components/design-system"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/data-access"
import type {
  CreateLeadInput,
  Lead,
} from "@/lib/data-access/modules/leads"
import {
  useCreateLead,
  useDeleteLead,
  useLeads,
  useUpdateLead,
} from "@/lib/data-access/modules/leads"
import { dsContentLayoutVariant } from "@/lib/design-system"
import { isLeadConverted, leadOwnerDisplayName } from "@/lib/leads/lead-owner"
import {
  REAL_ESTATE_LEAD_STATUS_LABELS,
  REAL_ESTATE_LEAD_STATUS_STYLES,
} from "@/lib/real-estate/lead-status"
import { useRealEstateBusinessUnitId } from "@/lib/real-estate/use-real-estate-business-unit"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 20

function createLeadIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `re-lead-create-${crypto.randomUUID()}`
  }
  return `re-lead-create-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function formatCadastroDate(value: string | null | undefined) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function PropertyLeadsPage() {
  const { session } = useSession()
  const canManage = useCanManage("leads:view")
  const businessUnitId = useRealEstateBusinessUnitId()
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [toast, setToast] = useState<{
    message: string
    tone: "success" | "danger"
  } | null>(null)
  const createLockRef = useRef(false)
  const createKeyRef = useRef<string | null>(null)

  const leadsQuery = useLeads(
    {
      businessUnitId: businessUnitId ?? undefined,
      page,
      limit: PAGE_SIZE,
    },
    { enabled: Boolean(businessUnitId) },
  )
  const createLead = useCreateLead()
  const updateLead = useUpdateLead()
  const deleteLead = useDeleteLead()

  const leads = leadsQuery.data?.data ?? []
  const meta = leadsQuery.data?.meta
  const counts = meta?.counts
  const total = meta?.total ?? leads.length

  const openCreate = useCallback(() => {
    setEditingLead(null)
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((lead: Lead) => {
    setEditingLead(lead)
    setDialogOpen(true)
  }, [])

  const handleSubmit = useCallback(
    async (input: CreateLeadInput) => {
      if (!businessUnitId) return
      try {
        if (editingLead) {
          await updateLead.mutateAsync({ id: editingLead.id, input })
          setToast({
            message: `Lead ${input.name} atualizado com sucesso.`,
            tone: "success",
          })
        } else {
          if (createLead.isPending || createLockRef.current) return
          createLockRef.current = true
          createKeyRef.current =
            createKeyRef.current ?? createLeadIdempotencyKey()
          await createLead.mutateAsync({
            ...input,
            businessUnitId,
            assignedTo: input.assignedTo || session?.name,
            idempotencyKey: createKeyRef.current,
          })
          setToast({
            message: `Lead ${input.name} cadastrado com sucesso.`,
            tone: "success",
          })
        }
        setDialogOpen(false)
        setEditingLead(null)
        createLockRef.current = false
        createKeyRef.current = null
      } catch (error) {
        createLockRef.current = false
        setToast({
          message: getErrorMessage(error, "Não foi possível salvar o lead."),
          tone: "danger",
        })
      }
    },
    [
      businessUnitId,
      createLead,
      editingLead,
      session?.name,
      updateLead,
    ],
  )

  const columns: DataTableColumn<Lead>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Nome",
        render: (row) => row.name,
      },
      {
        key: "phone",
        header: "Telefone",
        render: (row) => row.phone ?? "—",
      },
      {
        key: "source",
        header: "Origem",
        hideOnMobile: true,
        render: (row) => row.source ?? "—",
      },
      {
        key: "owner",
        header: "Responsável",
        hideOnMobile: true,
        render: (row) => leadOwnerDisplayName(row) || "—",
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <Badge
            variant="outline"
            className={cn(
              "border font-medium",
              REAL_ESTATE_LEAD_STATUS_STYLES[row.status],
            )}
          >
            {REAL_ESTATE_LEAD_STATUS_LABELS[row.status]}
          </Badge>
        ),
      },
      {
        key: "createdAt",
        header: "Data Cadastro",
        hideOnMobile: true,
        render: (row) => formatCadastroDate(row.createdAt),
      },
    ],
    [],
  )

  const createAction = canManage ? (
    <Button size="sm" className="h-9 gap-1.5" onClick={openCreate}>
      <Plus className="size-3.5" />
      Novo Lead Imobiliário
    </Button>
  ) : null

  return (
    <PageContainer className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-[var(--if-space-2)] md:py-[var(--if-space-3)]">
      <ContentContainer variant={dsContentLayoutVariant.leads}>
        <Stack gap="xl">
          <PageHeader
            eyebrow="Captação imobiliária"
            title={
              <span className="inline-flex items-center gap-2">
                Leads Imobiliários
                <Badge variant="secondary">{total}</Badge>
              </span>
            }
            description="Leads da Ávila Imóveis — cadastro manual ou recebidos pelo Portal Imobiliário."
            actions={
              createAction ? (
                <PageActions>
                  <PageActionsGroup variant="primary">
                    <PermissionGate permission="leads:manage">
                      {createAction}
                    </PermissionGate>
                  </PageActionsGroup>
                </PageActions>
              ) : undefined
            }
          />

          <Grid columns="5">
            <StatCard
              icon={Users}
              label="Total Leads"
              value={total}
              tone="primary"
              loading={leadsQuery.isLoading}
            />
            <StatCard
              icon={UserPlus}
              label="Novos"
              value={counts?.new ?? 0}
              tone="info"
              loading={leadsQuery.isLoading}
            />
            <StatCard
              icon={Users}
              label="Em Atendimento"
              value={counts?.contacted ?? 0}
              tone="warning"
              loading={leadsQuery.isLoading}
            />
            <StatCard
              icon={CalendarDays}
              label="Visitas Agendadas"
              value={counts?.qualified ?? 0}
              tone="primary"
              loading={leadsQuery.isLoading}
            />
            <StatCard
              icon={Users}
              label="Convertidos"
              value={counts?.converted ?? 0}
              tone="success"
              loading={leadsQuery.isLoading}
            />
          </Grid>

          <Section>
            <DataTable
              data={leads}
              columns={columns}
              getRowId={(row) => row.id}
              loading={leadsQuery.isLoading}
              loadingLabel="Carregando leads imobiliários…"
              error={leadsQuery.error}
              errorTitle="Não foi possível carregar leads imobiliários."
              onRetry={() => leadsQuery.refetch()}
              emptyIcon={UserPlus}
              emptyTitle="Nenhum lead imobiliário cadastrado."
              emptyDescription="Cadastre manualmente ou receba leads através do Portal Imobiliário."
              emptyAction={
                canManage ? (
                  <PermissionGate permission="leads:manage">
                    <Button size="sm" className="gap-1.5" onClick={openCreate}>
                      <Plus className="size-3.5" />
                      Cadastrar Primeiro Lead
                    </Button>
                  </PermissionGate>
                ) : null
              }
              onRowClick={canManage ? openEdit : undefined}
              rowActions={
                canManage
                  ? [
                      {
                        key: "edit",
                        label: "Editar lead",
                        icon: Edit3,
                        permission: "leads:manage",
                        onSelect: openEdit,
                      },
                      {
                        key: "delete",
                        label: "Excluir lead",
                        icon: Trash2,
                        variant: "destructive",
                        permission: "leads:manage",
                        disabled: deleteLead.isPending,
                        hidden: (row) => isLeadConverted(row),
                        onSelect: (row) => {
                          if (isLeadConverted(row)) return
                          if (window.confirm(`Excluir lead ${row.name}?`)) {
                            deleteLead.mutate(row.id, {
                              onSuccess: () =>
                                setToast({
                                  message: `Lead ${row.name} excluído.`,
                                  tone: "success",
                                }),
                              onError: (error) =>
                                setToast({
                                  message: getErrorMessage(
                                    error,
                                    "Não foi possível excluir o lead.",
                                  ),
                                  tone: "danger",
                                }),
                            })
                          }
                        },
                      },
                    ]
                  : undefined
              }
              pagination={{
                meta: {
                  page: meta?.page ?? page,
                  totalPages: meta?.totalPages ?? 1,
                  total,
                },
                onPageChange: setPage,
              }}
              title="Leads da Ávila Imóveis"
              subtitle={`${total} ${total === 1 ? "registro" : "registros"} na unidade imobiliária`}
            />
          </Section>
        </Stack>
      </ContentContainer>

      {businessUnitId ? (
        <RealEstateLeadDialog
          open={dialogOpen}
          lead={editingLead}
          businessUnitId={businessUnitId}
          pending={createLead.isPending || updateLead.isPending}
          error={createLead.error ?? updateLead.error}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditingLead(null)
          }}
          onSubmit={handleSubmit}
        />
      ) : null}

      <ActionToast
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        tone={toast?.tone === "danger" ? "danger" : "success"}
        onDismiss={() => setToast(null)}
      />
    </PageContainer>
  )
}
