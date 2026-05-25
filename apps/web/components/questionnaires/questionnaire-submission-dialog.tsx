"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { CloudOff, Loader2 } from "lucide-react"

import { QuestionnaireAnswerField } from "@/components/questionnaires/questionnaire-answer-field"
import { ActionToast } from "@/components/shared"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useCreateQuestionnaireSubmission,
  useQuestionnaireFields,
  useQuestionnaireTemplates,
  useUpdateQuestionnaireSubmission,
  type JsonObject,
  type QuestionnaireField,
} from "@/lib/data-access/modules/questionnaires"
import {
  focusFirstFieldError,
  questionnaireCompletionPercent,
} from "@/lib/questionnaires/questionnaire-form-state"
import {
  buildSubmitAnswers,
  getFieldSettings,
  isEmptyAnswer,
  parseQuestionnaireSubmissionErrors,
  validateQuestionnaireAnswersForFinalize,
  type QuestionnaireFieldErrors,
} from "@/lib/questionnaires/questionnaire-field-validation"
import {
  useQuestionnaireDraftAutosave,
  type QuestionnaireDraftSaveStatus,
} from "@/lib/questionnaires/use-questionnaire-draft-autosave"
import { cn } from "@/lib/utils"

type QuestionnaireSubmissionDialogProps = {
  open: boolean
  leadId: string | null
  leadName?: string | null
  onOpenChange: (open: boolean) => void
}

const DEFAULT_SECTION = "Geral"

function groupFieldsBySection(fields: QuestionnaireField[]) {
  const groups: Array<{ section: string; fields: QuestionnaireField[] }> = []
  for (const field of fields) {
    const section = getFieldSettings(field).section?.trim() || DEFAULT_SECTION
    const group = groups.find((item) => item.section === section)
    if (group) {
      group.fields.push(field)
    } else {
      groups.push({ section, fields: [field] })
    }
  }
  return groups
}

function formatSavedTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function DraftSaveIndicatorSlot({
  status,
  lastSavedAt,
}: {
  status: QuestionnaireDraftSaveStatus
  lastSavedAt: Date | null
}) {
  let content: React.ReactNode = (
    <span className="invisible select-none" aria-hidden>
      Rascunho
    </span>
  )

  if (status === "saving") {
    content = (
      <span className="inline-flex items-center gap-1.5">
        <Loader2 className="size-3 shrink-0 animate-spin" />
        Salvando rascunho…
      </span>
    )
  } else if (status === "error") {
    content = (
      <span className="inline-flex items-center gap-1.5 text-amber-300">
        <CloudOff className="size-3 shrink-0" />
        Falha ao sincronizar — cópia local mantida
      </span>
    )
  } else if (status === "saved" && lastSavedAt) {
    content = <>Rascunho salvo às {formatSavedTime(lastSavedAt)}</>
  }

  return (
    <div
      aria-live="polite"
      className="min-h-5 min-w-0 text-xs text-muted-foreground sm:min-w-[14rem]"
    >
      {content}
    </div>
  )
}

function QuestionnaireDialogFooter({
  status,
  lastSavedAt,
  isBusy,
  canFinalize,
  leadId,
  templateId,
  isFinalizing,
  onCancel,
  onSaveDraft,
}: {
  status: QuestionnaireDraftSaveStatus
  lastSavedAt: Date | null
  isBusy: boolean
  canFinalize: boolean
  leadId: string | null
  templateId: string
  isFinalizing: boolean
  onCancel: () => void
  onSaveDraft: () => void
}) {
  return (
    <div
      role="group"
      aria-label="Ações do questionário"
      className="-mx-4 -mb-4 mt-5 grid shrink-0 grid-cols-1 gap-3 border-t border-white/[0.08] bg-muted/50 p-4 sm:grid-cols-[minmax(14rem,1fr)_auto] sm:items-center"
    >
      <DraftSaveIndicatorSlot status={status} lastSavedAt={lastSavedAt} />
      <div className="flex flex-wrap items-center justify-end gap-2 sm:justify-end">
        <Button type="button" variant="outline" disabled={isBusy} onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isBusy || !leadId || !templateId}
          onClick={onSaveDraft}
        >
          Salvar rascunho
        </Button>
        <Button type="submit" disabled={!canFinalize || isBusy}>
          {isFinalizing ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Finalizando…
            </>
          ) : (
            "Finalizar questionário"
          )}
        </Button>
      </div>
    </div>
  )
}

function SectionHeader({ section }: { section: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-px flex-1 bg-white/[0.08]" />
      <span className="text-xs font-semibold text-muted-foreground">{section}</span>
      <span className="h-px flex-1 bg-white/[0.08]" />
    </div>
  )
}

function CompletionProgress({ percent }: { percent: number }) {
  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300",
          percent === 100 ? "bg-emerald-500" : "bg-primary",
        )}
        style={{ width: `${percent}%` }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso dos campos obrigatórios"
      />
    </div>
  )
}

export function QuestionnaireSubmissionDialog({
  open,
  leadId,
  leadName,
  onOpenChange,
}: QuestionnaireSubmissionDialogProps) {
  const [templateId, setTemplateId] = useState("")
  const [answers, setAnswers] = useState<JsonObject>({})
  const [fieldErrors, setFieldErrors] = useState<QuestionnaireFieldErrors>({})
  const [finalizeAttempted, setFinalizeAttempted] = useState(false)
  const [submitSummary, setSubmitSummary] = useState<string | null>(null)
  const [draftSavedToastOpen, setDraftSavedToastOpen] = useState(false)
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({})
  const scrollRootRef = useRef<HTMLDivElement | null>(null)
  const formInteractionRef = useRef<"idle" | "draft" | "finalize">("idle")

  const templatesQuery = useQuestionnaireTemplates({
    status: "active",
    page: 1,
    limit: 100,
  })
  const templates = useMemo(
    () => templatesQuery.data?.data ?? [],
    [templatesQuery.data?.data],
  )
  const selectedTemplate = templates.find((template) => template.id === templateId)
  const fieldsQuery = useQuestionnaireFields(templateId || null)
  const fields = useMemo(
    () => fieldsQuery.data ?? selectedTemplate?.fields ?? [],
    [fieldsQuery.data, selectedTemplate?.fields],
  )
  const createSubmission = useCreateQuestionnaireSubmission()
  const finalizeSubmission = useUpdateQuestionnaireSubmission()

  const orderedFields = useMemo(
    () => [...fields].sort((a, b) => a.order - b.order),
    [fields],
  )
  const fieldGroups = useMemo(
    () => groupFieldsBySection(orderedFields),
    [orderedFields],
  )

  const finalizeValidationErrors = useMemo(
    () => validateQuestionnaireAnswersForFinalize(orderedFields, answers),
    [answers, orderedFields],
  )

  const mergedFinalizeErrors = useMemo(
    () => ({ ...finalizeValidationErrors, ...fieldErrors }),
    [fieldErrors, finalizeValidationErrors],
  )

  const completionPercent = useMemo(
    () => questionnaireCompletionPercent(orderedFields, answers, isEmptyAnswer),
    [answers, orderedFields],
  )

  const hasBlockingFinalizeErrors =
    finalizeAttempted && Object.keys(mergedFinalizeErrors).length > 0

  const canFinalize =
    Boolean(leadId && templateId && fields.length > 0) &&
    !hasBlockingFinalizeErrors &&
    !createSubmission.isPending &&
    !finalizeSubmission.isPending

  const handleHydrate = useCallback((hydrated: JsonObject) => {
    setAnswers(hydrated)
  }, [])

  const autosave = useQuestionnaireDraftAutosave({
    open,
    enabled: Boolean(leadId && templateId),
    leadId,
    templateId,
    fields: orderedFields,
    answers,
    onHydrate: handleHydrate,
  })

  function visibleFieldError(key: string) {
    if (!finalizeAttempted) return undefined
    if (fieldErrors[key]) return fieldErrors[key]
    return finalizeValidationErrors[key]
  }

  const resetFinalizeValidationUi = useCallback(() => {
    setFinalizeAttempted(false)
    setFieldErrors({})
    setSubmitSummary(null)
  }, [])

  useEffect(() => {
    if (!open) return
    const firstTemplate = templates[0]
    setTemplateId((current) => current || firstTemplate?.id || "")
    resetFinalizeValidationUi()
    formInteractionRef.current = "idle"
  }, [open, resetFinalizeValidationUi, templates])

  useEffect(() => {
    if (formInteractionRef.current !== "finalize") return
    if (!createSubmission.error && !finalizeSubmission.error) return

    const error = createSubmission.error ?? finalizeSubmission.error
    const parsed = parseQuestionnaireSubmissionErrors(error, orderedFields)
    setFinalizeAttempted(true)
    setFieldErrors(parsed.fieldErrors)
    setSubmitSummary(parsed.summary)
    focusFirstFieldError(
      parsed.fieldErrors,
      fieldRefs.current,
      orderedFields,
      scrollRootRef.current,
    )
  }, [createSubmission.error, finalizeSubmission.error, orderedFields])

  function clearFieldError(key: string) {
    setFieldErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
    setSubmitSummary(null)
  }

  function updateAnswer(key: string, value: unknown) {
    setAnswers((current) => ({ ...current, [key]: value }))
    clearFieldError(key)
  }

  function handleFinalizeValidationFailure(errors: QuestionnaireFieldErrors) {
    setFinalizeAttempted(true)
    setFieldErrors(errors)
    setSubmitSummary("Corrija os campos destacados antes de finalizar.")
    focusFirstFieldError(
      errors,
      fieldRefs.current,
      orderedFields,
      scrollRootRef.current,
    )
  }

  async function handleSaveDraft() {
    if (!leadId || !templateId) return

    formInteractionRef.current = "draft"
    resetFinalizeValidationUi()

    const saved = await autosave.saveDraftNow()
    if (!saved) return

    setDraftSavedToastOpen(true)
    onOpenChange(false)
  }

  async function handleFinalize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!leadId || !templateId) return

    formInteractionRef.current = "finalize"
    setFinalizeAttempted(true)

    const errors = validateQuestionnaireAnswersForFinalize(orderedFields, answers)
    if (Object.keys(errors).length > 0) {
      handleFinalizeValidationFailure(errors)
      return
    }

    setFieldErrors({})
    setSubmitSummary(null)

    const payload = {
      templateId,
      leadId,
      mode: "INTERNAL" as const,
      origin: "INTERNAL" as const,
      status: "submitted" as const,
      answers: buildSubmitAnswers(orderedFields, answers),
      submittedAt: new Date().toISOString(),
    }

    try {
      if (autosave.draftId) {
        await finalizeSubmission.mutateAsync({
          id: autosave.draftId,
          input: payload,
          autosave: false,
        })
      } else {
        await createSubmission.mutateAsync({ ...payload, autosave: false })
      }

      autosave.clearDraft()
      setAnswers({})
      onOpenChange(false)
    } catch {
      // erros tratados pelo efeito de mutation
    }
  }

  const isBusy =
    createSubmission.isPending ||
    finalizeSubmission.isPending ||
    autosave.saveStatus === "saving"

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetFinalizeValidationUi()
          formInteractionRef.current = "idle"
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="flex max-h-[90svh] flex-col overflow-hidden border-white/[0.08] bg-background/95 sm:max-w-3xl">
        <form
          onSubmit={handleFinalize}
          className="flex min-h-0 flex-1 flex-col"
          noValidate
        >
          <DialogHeader className="shrink-0 space-y-2">
            <DialogTitle>Preencher questionário</DialogTitle>
            <DialogDescription>
              Registro interno para {leadName || "lead selecionado"}. Campos
              obrigatórios: {completionPercent}% preenchidos.
            </DialogDescription>
          </DialogHeader>

          <CompletionProgress percent={completionPercent} />

          <div
            ref={scrollRootRef}
            className="mt-5 min-h-0 flex-1 space-y-5 overflow-y-auto pr-1"
          >
            <label className="space-y-2">
              <span className="text-sm font-medium">Template ativo</span>
              <select
                value={templateId}
                onChange={(event) => {
                  setTemplateId(event.target.value)
                  setAnswers({})
                  resetFinalizeValidationUi()
                  formInteractionRef.current = "idle"
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background/40 px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">Selecione um template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} v{template.version}
                  </option>
                ))}
              </select>
            </label>

            {autosave.isLoadingDraft ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Recuperando rascunho…
              </p>
            ) : null}

            <QuestionnaireFieldGroups
              fieldGroups={fieldGroups}
              answers={answers}
              visibleFieldError={visibleFieldError}
              updateAnswer={updateAnswer}
              fieldRefs={fieldRefs}
            />

            {!templatesQuery.isLoading && templates.length === 0 ? (
              <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                Nenhum template ativo disponível. Ative um template antes de
                preencher questionários.
              </p>
            ) : null}

            {submitSummary ? (
              <p
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
              >
                {submitSummary}
              </p>
            ) : null}
          </div>

          <QuestionnaireDialogFooter
            status={autosave.saveStatus}
            lastSavedAt={autosave.lastSavedAt}
            isBusy={isBusy}
            canFinalize={canFinalize}
            leadId={leadId}
            templateId={templateId}
            isFinalizing={
              createSubmission.isPending || finalizeSubmission.isPending
            }
            onCancel={() => onOpenChange(false)}
            onSaveDraft={() => void handleSaveDraft()}
          />
        </form>
      </DialogContent>
    </Dialog>

    <ActionToast
      open={draftSavedToastOpen}
      message="Rascunho salvo"
      onDismiss={() => setDraftSavedToastOpen(false)}
      autoHideMs={3000}
    />
    </>
  )
}

function QuestionnaireFieldGroups({
  fieldGroups,
  answers,
  visibleFieldError,
  updateAnswer,
  fieldRefs,
}: {
  fieldGroups: Array<{ section: string; fields: QuestionnaireField[] }>
  answers: JsonObject
  visibleFieldError: (key: string) => string | undefined
  updateAnswer: (key: string, value: unknown) => void
  fieldRefs: React.MutableRefObject<Record<string, HTMLElement | null>>
}) {
  return (
    <div className="space-y-5">
      {fieldGroups.map((group) => (
        <section key={group.section} className="space-y-3">
          <SectionHeader section={group.section} />
          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <QuestionnaireAnswerField
                key={field.id}
                registerRef={(element) => {
                  fieldRefs.current[field.key] = element
                }}
                field={field}
                value={answers[field.key]}
                error={visibleFieldError(field.key)}
                onChange={(value) => updateAnswer(field.key, value)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
