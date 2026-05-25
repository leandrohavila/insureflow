"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowLeft, ClipboardList, Filter } from "lucide-react"

import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { QuestionnaireNavTabs } from "@/components/questionnaires/questionnaire-nav-tabs"
import { QuestionnaireSubmissionDetailSheet } from "@/components/questionnaires/questionnaire-submission-detail-sheet"
import {
  formatSubmissionDate,
  submissionResponsible,
} from "@/components/questionnaires/questionnaire-answer-utils"
import {
  questionnaireStatusLabels,
  questionnaireStatusStyles,
} from "@/components/questionnaires/questionnaire-submission-constants"
import { DataTable, type DataTableColumn } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  QUESTIONNAIRE_SUBMISSION_STATUSES,
  useQuestionnaireSubmissions,
  useQuestionnaireTemplates,
  type QuestionnaireSubmission,
  type QuestionnaireSubmissionListFilters,
  type QuestionnaireSubmissionStatus,
} from "@/lib/data-access/modules/questionnaires"
import { easeOut } from "@/lib/motion"
import {
  navigateBackToCrm,
  parseQuestionnaireCrmContext,
  resolveCrmBackLabel,
} from "@/lib/questionnaires/questionnaire-crm-navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const PAGE_SIZE = 10

export function QuestionnaireSubmissionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTemplateId = searchParams.get("templateId") ?? ""
  const initialDealId = searchParams.get("dealId") ?? ""
  const initialLeadId = searchParams.get("leadId") ?? ""
  const crmContext = useMemo(
    () => parseQuestionnaireCrmContext(searchParams),
    [searchParams],
  )

  const handleBackToCrm = useCallback(() => {
    if (!crmContext) return
    navigateBackToCrm(router, crmContext.returnTo)
  }, [crmContext, router])

  const [status, setStatus] = useState<QuestionnaireSubmissionStatus | "all">(
    "all",
  )
  const [templateId, setTemplateId] = useState(initialTemplateId)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(
    null,
  )
  const reduce = useReducedMotion()

  const templatesQuery = useQuestionnaireTemplates({ page: 1, limit: 100 })
  const templates = templatesQuery.data?.data ?? []

  const filters = useMemo<QuestionnaireSubmissionListFilters>(
    () => ({
      status,
      templateId: templateId || undefined,
      dealId: initialDealId || undefined,
      leadId: initialLeadId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [
      dateFrom,
      dateTo,
      initialDealId,
      initialLeadId,
      page,
      status,
      templateId,
    ],
  )

  const submissionsQuery = useQuestionnaireSubmissions(filters)
  const submissions = submissionsQuery.data?.data ?? []
  const meta = submissionsQuery.data?.meta

  useEffect(() => {
    setPage(1)
  }, [dateFrom, dateTo, status, templateId])

  useEffect(() => {
    if (initialTemplateId) setTemplateId(initialTemplateId)
  }, [initialTemplateId])

  const columns = useMemo<DataTableColumn<QuestionnaireSubmission>[]>(
    () => [
      {
        key: "lead",
        header: "Lead",
        render: (row) => (
          <div>
            <p className="font-medium tracking-[-0.02em]">
              {row.lead?.name ?? "Sem lead"}
            </p>
            {row.leadId ? (
              <p className="text-[10px] text-muted-foreground">{row.leadId}</p>
            ) : null}
          </div>
        ),
      },
      {
        key: "template",
        header: "Template",
        hideOnMobile: true,
        render: (row) => (
          <span className="text-sm text-foreground">
            {row.template?.name ?? "—"}
            {row.template?.version ? (
              <span className="text-muted-foreground"> v{row.template.version}</span>
            ) : null}
          </span>
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
              questionnaireStatusStyles[row.status],
            )}
          >
            {questionnaireStatusLabels[row.status]}
          </Badge>
        ),
      },
      {
        key: "date",
        header: "Data",
        hideOnMobile: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {formatSubmissionDate(row.submittedAt ?? row.updatedAt)}
          </span>
        ),
      },
      {
        key: "owner",
        header: "Responsável",
        hideOnMobile: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {submissionResponsible(row.lead?.assignedTo)}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="flex flex-1 flex-col gap-8 px-4 py-8 md:gap-10 md:px-8 md:py-10"
    >
      {crmContext ? (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: easeOut }}
          className="flex flex-col gap-3"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 w-fit gap-1.5 px-2 text-muted-foreground hover:text-foreground"
            onClick={handleBackToCrm}
          >
            <ArrowLeft className="size-4" />
            {resolveCrmBackLabel(crmContext)}
          </Button>
          {crmContext.dealName ? (
            <p className="text-sm text-muted-foreground">
              Visualizando questionários do negócio{" "}
              <span className="font-medium text-foreground">
                {crmContext.dealName}
              </span>
            </p>
          ) : null}
        </motion.div>
      ) : null}

      <CrmPageHeader
        badge="Questionários"
        title="Respostas"
        description="Visualize e revise as submissões dos corretores — filtre por template, status e período."
      >
        <QuestionnaireNavTabs />
      </CrmPageHeader>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35, ease: easeOut }}
        className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
      >
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Filter className="size-3.5" strokeWidth={1.5} />
          Filtros
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as QuestionnaireSubmissionStatus | "all")
            }
            className="flex h-9 min-w-[140px] rounded-md border border-input bg-background/40 px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="all">Todos os status</option>
            {QUESTIONNAIRE_SUBMISSION_STATUSES.map((item) => (
              <option key={item} value={item}>
                {questionnaireStatusLabels[item]}
              </option>
            ))}
          </select>
          <select
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
            className="flex h-9 min-w-[180px] rounded-md border border-input bg-background/40 px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">Todos os templates</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} v{template.version}
              </option>
            ))}
          </select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-9 w-40 border-white/[0.08] bg-white/[0.04]"
            aria-label="Data inicial"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-9 w-40 border-white/[0.08] bg-white/[0.04]"
            aria-label="Data final"
          />
        </div>
        {initialDealId || initialLeadId ? (
          <p className="text-xs text-muted-foreground">
            Filtro ativo:{" "}
            {initialDealId
              ? crmContext?.dealName
                ? `negócio ${crmContext.dealName}`
                : `negócio ${initialDealId}`
              : null}
            {initialDealId && initialLeadId ? " · " : null}
            {initialLeadId ? `lead ${initialLeadId}` : null}
          </p>
        ) : null}
      </motion.div>

      <DataTable
        data={submissions}
        columns={columns}
        getRowId={(row) => row.id}
        loading={submissionsQuery.isLoading}
        loadingLabel="Carregando respostas…"
        error={submissionsQuery.isError ? submissionsQuery.error : null}
        errorTitle="Não foi possível carregar as respostas."
        onRetry={() => submissionsQuery.refetch()}
        emptyIcon={ClipboardList}
        emptyTitle="Nenhuma resposta encontrada."
        emptyDescription="Ajuste os filtros ou preencha questionários a partir dos leads."
        onRowClick={(row) => setSelectedSubmissionId(row.id)}
        pagination={{
          meta: {
            page: meta?.page ?? page,
            totalPages: meta?.totalPages ?? 1,
            total: meta?.total,
          },
          onPageChange: setPage,
        }}
        title="Todas as respostas"
        subtitle={`${meta?.total ?? submissions.length} submissões registradas`}
      />

      <QuestionnaireSubmissionDetailSheet
        submissionId={selectedSubmissionId}
        open={selectedSubmissionId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSubmissionId(null)
        }}
      />
    </motion.div>
  )
}
