"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"

import { IntelligentFormStep } from "@/components/questionnaires/intelligent-form-step"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getErrorMessage } from "@/lib/data-access"
import {
  useCreateQuestionnaireSubmission,
  useEnsureIntelligentForm,
  useQuestionnaireFields,
  useQuestionnaireSubmission,
  useQuestionnaireTemplate,
  useUpdateQuestionnaireSubmission,
  type JsonObject,
} from "@/lib/data-access/modules/questionnaires"
import { questionnaireBranchLabel } from "@/lib/questionnaires/lead-questionnaire-summary"
import {
  adjacentStep,
  buildIntelligentSteps,
  errorsForFields,
  firstStepWithError,
  retainAnswer,
  stepProgress,
  visibleIntelligentFields,
} from "@/lib/questionnaires/intelligent-form-flow"
import {
  buildSubmitAnswers,
  parseQuestionnaireSubmissionErrors,
  validateQuestionnaireAnswersForFinalize,
} from "@/lib/questionnaires/questionnaire-field-validation"
import { useQuestionnaireDraftAutosave } from "@/lib/questionnaires/use-questionnaire-draft-autosave"
import { formFromVersionDefinition } from "@/lib/questionnaires/version-form"

const BRANCHES = ["auto", "residencial", "empresarial"] as const

type IntelligentFormWizardProps = {
  open: boolean
  leadId: string | null
  leadName?: string | null
  templateId?: string | null
  submissionId?: string | null
  onOpenChange: (open: boolean) => void
}

export function IntelligentFormWizard({
  open,
  leadId,
  leadName,
  templateId: initialTemplateId = null,
  submissionId = null,
  onOpenChange,
}: IntelligentFormWizardProps) {
  const [pickedTemplateId, setPickedTemplateId] = useState<string | null>(null)
  const [sessionDraftId, setSessionDraftId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<JsonObject>({})
  const [stepIndex, setStepIndex] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [summary, setSummary] = useState<string | null>(null)
  const templateId = initialTemplateId || pickedTemplateId || ""
  const activeSubmissionId = sessionDraftId || submissionId || null
  const ensureForm = useEnsureIntelligentForm()
  const templateQuery = useQuestionnaireTemplate(templateId || null)
  const fieldsQuery = useQuestionnaireFields(templateId || null)
  const resumeQuery = useQuestionnaireSubmission(
    open && activeSubmissionId ? activeSubmissionId : null,
  )
  const createSubmission = useCreateQuestionnaireSubmission()
  const updateSubmission = useUpdateQuestionnaireSubmission()
  const template = templateQuery.data
  const pinnedForm = useMemo(() => {
    const submission = resumeQuery.data
    if (!submission) return null
    return formFromVersionDefinition(submission.templateVersion?.definition, {
      templateId: submission.templateId,
      tenantId: submission.tenantId,
      name: submission.template?.name ?? template?.name ?? "Questionário",
    })
  }, [resumeQuery.data, template?.name])
  const waitingForVersion =
    Boolean(activeSubmissionId) &&
    !pinnedForm &&
    (resumeQuery.isLoading || resumeQuery.isFetching)
  const fields = useMemo(
    () => pinnedForm?.fields ?? (waitingForVersion ? [] : (fieldsQuery.data ?? [])),
    [fieldsQuery.data, pinnedForm, waitingForVersion],
  )
  const steps = useMemo(() => buildIntelligentSteps(fields), [fields])
  const progress = stepProgress(stepIndex, steps.length)
  const currentStep = steps[progress.index]
  const resumed = resumeQuery.data
  const locked =
    Boolean(submissionId) &&
    Boolean(resumed) &&
    resumed?.status !== "draft" &&
    resumed?.status !== "in_progress"

  const handleHydrate = useCallback((hydrated: JsonObject) => {
    setAnswers(hydrated)
    return { materializedKeys: [] as string[] }
  }, [])

  const autosave = useQuestionnaireDraftAutosave({
    open,
    enabled: Boolean(leadId && templateId && fields.length > 0 && !locked),
    leadId,
    templateId,
    fields,
    answers,
    resumeSubmissionId: submissionId,
    onHydrate: handleHydrate,
  })

  useEffect(() => {
    if (autosave.draftId) setSessionDraftId(autosave.draftId)
  }, [autosave.draftId])

  useEffect(() => {
    if (open) return
    setPickedTemplateId(null)
    setSessionDraftId(null)
    setAnswers({})
    setStepIndex(0)
    setErrors({})
    setSummary(null)
  }, [open])

  const templateDescriptor = useMemo(
    () => ({
      name: pinnedForm?.name ?? template?.name ?? "Questionário",
      settings: (pinnedForm?.settings ?? template?.settings ?? {}) as Record<string, unknown>,
    }),
    [pinnedForm?.name, pinnedForm?.settings, template?.name, template?.settings],
  )

  const visibleCurrent = useMemo(() => {
    if (!currentStep) return { fields: [], requiredKeys: new Set<string>() }
    return visibleIntelligentFields(templateDescriptor, currentStep.fields, answers)
  }, [answers, currentStep, templateDescriptor])

  function updateAnswer(key: string, value: unknown) {
    setAnswers((current) => retainAnswer(current, key, value))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
    setSummary(null)
  }

  function validateVisible(scope: typeof fields) {
    const visible = visibleIntelligentFields(templateDescriptor, scope, answers)
    const allErrors = validateQuestionnaireAnswersForFinalize(
      scope,
      answers,
      templateDescriptor.settings,
      templateDescriptor.name,
    )
    return {
      visible,
      errors: errorsForFields(allErrors, visible.fields),
    }
  }

  function goNext() {
    if (!currentStep) return
    const result = validateVisible(currentStep.fields)
    if (Object.keys(result.errors).length > 0) {
      setErrors(result.errors)
      setSummary("Corrija os campos destacados antes de avançar.")
      return
    }
    setErrors({})
    setSummary(null)
    setStepIndex((index) => adjacentStep(index, steps.length, "next"))
  }

  async function saveDraft() {
    const saved = await autosave.saveDraftNow()
    if (!saved) {
      setSummary("Não foi possível salvar o rascunho.")
      return
    }
    setSummary(null)
  }

  async function complete() {
    const result = validateVisible(fields)
    if (Object.keys(result.errors).length > 0) {
      setErrors(result.errors)
      setSummary("Corrija os campos essenciais antes de concluir.")
      const destination = firstStepWithError(steps, result.errors)
      if (destination >= 0) setStepIndex(destination)
      return
    }
    if (!leadId || !templateId) return
    const visibleKeys = new Set(result.visible.fields.map((field) => field.key))
    const payloadAnswers = Object.fromEntries(
      Object.entries(buildSubmitAnswers(fields, answers)).filter(([key]) =>
        visibleKeys.has(key),
      ),
    )
    const input = {
      templateId,
      leadId,
      mode: "INTERNAL" as const,
      origin: "INTERNAL" as const,
      status: "completed" as const,
      answers: payloadAnswers,
    }
    try {
      if (autosave.draftId) {
        await updateSubmission.mutateAsync({
          id: autosave.draftId,
          input,
          autosave: false,
        })
      } else {
        await createSubmission.mutateAsync({ ...input, autosave: false })
      }
      onOpenChange(false)
    } catch (error) {
      const parsed = parseQuestionnaireSubmissionErrors(error, fields)
      setErrors(parsed.fieldErrors)
      setSummary(parsed.summary || getErrorMessage(error, "Não foi possível concluir."))
      const destination = firstStepWithError(steps, parsed.fieldErrors)
      if (destination >= 0) setStepIndex(destination)
    }
  }

  const isBusy =
    ensureForm.isPending ||
    createSubmission.isPending ||
    updateSubmission.isPending ||
    autosave.saveStatus === "saving"
  const choosingBranch = !templateId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="avila-crm-canvas flex max-h-[min(920px,calc(100dvh-1.5rem))] w-[min(760px,calc(100%-1.5rem))] max-w-none flex-col gap-0 overflow-hidden bg-[var(--avila-ivory)] p-0 text-[var(--avila-navy-900)] sm:max-w-[760px]">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {template?.name ?? "Questionário"}
            {leadName ? ` de ${leadName}` : ""}
          </DialogTitle>
          <DialogDescription>
            Preenchimento interno pelo corretor. O cadastro do lead não é alterado.
          </DialogDescription>
        </DialogHeader>

        {choosingBranch ? (
          <div className="space-y-4 p-4 sm:p-6">
            <div>
              <p className="text-xs font-semibold tracking-wide text-[var(--avila-gold-600)] uppercase">
                Novo questionário
              </p>
              <h2 className="mt-1 text-lg font-semibold">Escolha o ramo</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {leadName ? `${leadName}. ` : ""}O preenchimento fica com o corretor.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {BRANCHES.map((branch) => (
                <Button
                  key={branch}
                  type="button"
                  variant="outline"
                  className="h-auto justify-start px-3 py-3 text-left"
                  disabled={isBusy || !leadId}
                  onClick={() => {
                    ensureForm.mutate(branch, {
                      onSuccess: (created) => setPickedTemplateId(created.id),
                    })
                  }}
                >
                  {questionnaireBranchLabel(branch)}
                </Button>
              ))}
            </div>
            {ensureForm.isError ? (
              <p className="text-sm text-destructive" role="alert">
                {getErrorMessage(ensureForm.error, "Não foi possível abrir o formulário.")}
              </p>
            ) : null}
          </div>
        ) : locked ? (
          <div className="space-y-3 p-4 sm:p-6">
            <h2 className="text-lg font-semibold">Questionário concluído</h2>
            <p className="text-sm text-muted-foreground">
              As respostas concluídas permanecem na versão original. Consulte o histórico para vê-las.
            </p>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        ) : fieldsQuery.isError || templateQuery.isError || resumeQuery.isError ? (
          <p className="p-6 text-sm text-destructive" role="alert">
            Não foi possível carregar o formulário.
          </p>
        ) : waitingForVersion || fieldsQuery.isLoading || templateQuery.isLoading || !currentStep ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando formulário…
          </div>
        ) : (
          <IntelligentFormStep
            title={template?.name ?? "Questionário"}
            progressLabel={progress.label}
            percent={progress.percent}
            sectionTitle={currentStep.title}
            fields={visibleCurrent.fields}
            answers={answers}
            errors={errors}
            requiredKeys={visibleCurrent.requiredKeys}
            summary={
              summary ??
              (autosave.saveStatus === "error"
                ? (autosave.saveDetail ?? "Não foi possível salvar o rascunho.")
                : null)
            }
            notice={autosave.saveStatus === "saved" ? "Rascunho salvo." : null}
            isFirst={progress.index === 0}
            isLast={progress.index === steps.length - 1}
            isBusy={isBusy}
            onAnswer={updateAnswer}
            onBack={() => {
              setSummary(null)
              setStepIndex((index) => adjacentStep(index, steps.length, "back"))
            }}
            onNext={goNext}
            onSaveDraft={() => {
              void saveDraft()
            }}
            onComplete={() => {
              void complete()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
