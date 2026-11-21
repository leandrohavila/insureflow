"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"

import { IntelligentFormStep } from "@/components/questionnaires/intelligent-form-step"
import { Button } from "@/components/ui/button"
import { apiClient, getErrorMessage } from "@/lib/data-access"
import type { JsonObject } from "@/lib/data-access/modules/questionnaires"
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
import { answersToFormState } from "@/lib/questionnaires/questionnaire-form-state"
import {
  buildDraftAnswers,
  buildSubmitAnswers,
  validateQuestionnaireAnswersForFinalize,
} from "@/lib/questionnaires/questionnaire-field-validation"
import { formFromVersionDefinition } from "@/lib/questionnaires/version-form"

type PublicQuestionnairePayload = {
  state: "open" | "completed"
  title: string
  branch: string | null
  versionNumber: number | null
  expiresAt: string
  status: string
  instructions: string
  definition: unknown
  answers?: JsonObject
}

type PublicQuestionnaireFormProps = {
  token: string
}

export function PublicQuestionnaireForm({ token }: PublicQuestionnaireFormProps) {
  const [payload, setPayload] = useState<PublicQuestionnairePayload | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<JsonObject>({})
  const [stepIndex, setStepIndex] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [summary, setSummary] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    setPayload(null)
    setAnswers({})
    setStepIndex(0)
    setErrors({})
    setSummary(null)
    setNotice(null)
    setConfirming(false)
    apiClient
      .get<PublicQuestionnairePayload>(
        `/api/public/questionnaires/${encodeURIComponent(token)}`,
      )
      .then((data) => {
        if (cancelled) return
        setPayload(data)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setLoadError(
          getErrorMessage(error, "Não foi possível abrir o questionário."),
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const form = useMemo(
    () =>
      formFromVersionDefinition(payload?.definition, {
        templateId: "public",
        tenantId: "public",
        name: payload?.title ?? "Questionário",
      }),
    [payload?.definition, payload?.title],
  )
  const steps = useMemo(
    () => buildIntelligentSteps(form?.fields ?? []),
    [form?.fields],
  )
  const progress = stepProgress(stepIndex, steps.length)
  const currentStep = steps[progress.index]
  const templateDescriptor = useMemo(
    () => ({
      name: form?.name ?? payload?.title ?? "Questionário",
      settings: form?.settings ?? {},
    }),
    [form?.name, form?.settings, payload?.title],
  )
  const visibleCurrent = useMemo(() => {
    if (!currentStep || !form) return { fields: [], requiredKeys: new Set<string>() }
    return visibleIntelligentFields(templateDescriptor, currentStep.fields, answers)
  }, [answers, currentStep, form, templateDescriptor])
  const branchLabel = questionnaireBranchLabel(payload?.branch) ?? "Questionário"

  useEffect(() => {
    if (!form || payload?.state !== "open") return
    setAnswers(answersToFormState(form.fields, payload.answers ?? {}))
  }, [form, payload])

  function updateAnswer(key: string, value: unknown) {
    setAnswers((current) => retainAnswer(current, key, value))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
    setSummary(null)
    setNotice(null)
  }

  function visiblePayload(mode: "draft" | "complete") {
    if (!form) return {}
    const visible = visibleIntelligentFields(templateDescriptor, form.fields, answers)
    const visibleKeys = new Set(visible.fields.map((field) => field.key))
    const prepared =
      mode === "draft"
        ? buildDraftAnswers(
            form.fields,
            answers,
            templateDescriptor.settings,
            templateDescriptor.name,
          )
        : buildSubmitAnswers(form.fields, answers)
    return Object.fromEntries(
      Object.entries(prepared).filter(([key]) => visibleKeys.has(key)),
    )
  }

  function validateAll() {
    if (!form) return {}
    const visible = visibleIntelligentFields(templateDescriptor, form.fields, answers)
    return errorsForFields(
      validateQuestionnaireAnswersForFinalize(
        form.fields,
        answers,
        templateDescriptor.settings,
        templateDescriptor.name,
      ),
      visible.fields,
    )
  }

  function goNext() {
    if (!currentStep || !form) return
    const visible = visibleIntelligentFields(
      templateDescriptor,
      currentStep.fields,
      answers,
    )
    const stepErrors = errorsForFields(validateAll(), visible.fields)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      setSummary("Corrija os campos destacados antes de avançar.")
      return
    }
    setErrors({})
    setSummary(null)
    setStepIndex((index) => adjacentStep(index, steps.length, "next"))
  }

  async function saveDraft() {
    setBusy(true)
    setSummary(null)
    try {
      await apiClient.patch(`/api/public/questionnaires/${encodeURIComponent(token)}`, {
        answers: visiblePayload("draft"),
      })
      setNotice("Rascunho salvo. Você pode continuar por este mesmo link.")
    } catch (error) {
      setNotice(null)
      setSummary(getErrorMessage(error, "Não foi possível salvar o rascunho."))
    } finally {
      setBusy(false)
    }
  }

  function review() {
    const nextErrors = validateAll()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSummary("Corrija os campos essenciais antes de enviar.")
      const destination = firstStepWithError(steps, nextErrors)
      if (destination >= 0) setStepIndex(destination)
      return
    }
    setErrors({})
    setSummary(null)
    setConfirming(true)
  }

  async function sendAnswers() {
    setBusy(true)
    setSummary(null)
    try {
      const completed = await apiClient.post<PublicQuestionnairePayload>(
        `/api/public/questionnaires/${encodeURIComponent(token)}/complete`,
        { answers: visiblePayload("complete") },
      )
      setPayload(completed)
      setConfirming(false)
      setAnswers({})
    } catch (error) {
      setSummary(getErrorMessage(error, "Não foi possível enviar as respostas."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="avila-crm-canvas min-h-svh bg-[var(--avila-ivory)] text-[var(--avila-navy-900)]">
      <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col px-4 py-6 sm:px-6">
        <header className="mb-4">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--avila-gold-600)] uppercase">
            Ávila
          </p>
          <h1 className="mt-1 text-2xl font-semibold">{branchLabel}</h1>
          {payload?.state === "open" && payload.instructions ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {payload.instructions}
            </p>
          ) : null}
        </header>

        <section className="flex min-h-[28rem] flex-1 flex-col overflow-hidden rounded-xl border border-border bg-[var(--avila-paper)] shadow-sm">
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Abrindo questionário…
            </div>
          ) : loadError ? (
            <div className="space-y-2 p-6">
              <h2 className="text-lg font-semibold">Link indisponível</h2>
              <p className="text-sm text-muted-foreground">{loadError}</p>
            </div>
          ) : payload?.state === "completed" ? (
            <div className="space-y-3 p-6">
              <h2 className="text-lg font-semibold">Questionário enviado</h2>
              <p className="text-sm text-muted-foreground">
                Recebemos as respostas de {payload.title}. Não é necessário enviar de novo.
              </p>
            </div>
          ) : !form || !currentStep ? (
            <div className="space-y-2 p-6">
              <h2 className="text-lg font-semibold">Questionário indisponível</h2>
              <p className="text-sm text-muted-foreground">
                Este link não possui uma versão de formulário que possa ser preenchida.
              </p>
            </div>
          ) : confirming ? (
            <div className="space-y-4 p-6">
              <h2 className="text-lg font-semibold">Enviar respostas</h2>
              <p className="text-sm text-muted-foreground">
                Confira se as etapas estão corretas. O envio é definitivo e o link deixa de aceitar alterações.
              </p>
              {summary ? (
                <p className="text-sm text-destructive" role="alert">
                  {summary}
                </p>
              ) : null}
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                >
                  Voltar
                </Button>
                <Button type="button" variant="save" disabled={busy} onClick={() => void sendAnswers()}>
                  Enviar respostas
                </Button>
              </div>
            </div>
          ) : (
            <IntelligentFormStep
              title={payload?.title ?? form.name}
              intro={null}
              progressLabel={progress.label}
              percent={progress.percent}
              sectionTitle={currentStep.title}
              fields={visibleCurrent.fields}
              answers={answers}
              errors={errors}
              requiredKeys={visibleCurrent.requiredKeys}
              summary={summary}
              notice={notice}
              isFirst={progress.index === 0}
              isLast={progress.index === steps.length - 1}
              isBusy={busy}
              completeLabel="Revisar e enviar"
              onAnswer={updateAnswer}
              onBack={() => {
                setSummary(null)
                setStepIndex((index) => adjacentStep(index, steps.length, "back"))
              }}
              onNext={goNext}
              onSaveDraft={() => {
                void saveDraft()
              }}
              onComplete={review}
            />
          )}
        </section>
      </div>
    </main>
  )
}
