"use client"

import { QuestionnaireAnswerField } from "@/components/questionnaires/questionnaire-answer-field"
import { Button } from "@/components/ui/button"
import type { JsonObject, QuestionnaireField } from "@/lib/data-access/modules/questionnaires"

type IntelligentFormStepProps = {
  title: string
  intro?: string | null
  progressLabel: string
  percent: number
  sectionTitle: string
  fields: QuestionnaireField[]
  answers: JsonObject
  errors: Record<string, string>
  requiredKeys: ReadonlySet<string>
  summary?: string | null
  notice?: string | null
  isFirst: boolean
  isLast: boolean
  isBusy: boolean
  completeLabel?: string
  onAnswer: (key: string, value: unknown) => void
  onBack: () => void
  onNext: () => void
  onSaveDraft: () => void
  onComplete: () => void
}

export function IntelligentFormStep({
  title,
  intro,
  progressLabel,
  percent,
  sectionTitle,
  fields,
  answers,
  errors,
  requiredKeys,
  summary,
  notice,
  isFirst,
  isLast,
  isBusy,
  completeLabel = "Concluir",
  onAnswer,
  onBack,
  onNext,
  onSaveDraft,
  onComplete,
}: IntelligentFormStepProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <p className="text-xs font-semibold tracking-wide text-[var(--avila-gold-600)] uppercase">
          {progressLabel}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-[var(--avila-navy-900)]">{title}</h2>
        {intro ? <p className="mt-2 text-sm text-muted-foreground">{intro}</p> : null}
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--avila-navy-900)]/10"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={progressLabel}
        >
          <div
            className="h-full rounded-full bg-[var(--avila-gold-600)]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <h3 className="text-sm font-semibold text-[var(--avila-navy-900)]">{sectionTitle}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Campos com * são essenciais. Os demais podem ficar em branco.
        </p>
        {summary ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {summary}
          </p>
        ) : notice ? (
          <p className="mt-3 text-sm text-muted-foreground">{notice}</p>
        ) : null}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <QuestionnaireAnswerField
              key={field.key}
              field={field}
              value={answers[field.key]}
              error={errors[field.key]}
              required={requiredKeys.has(field.key)}
              disabled={isBusy}
              onChange={(value) => onAnswer(field.key, value)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Button type="button" variant="outline" disabled={isFirst || isBusy} onClick={onBack}>
          Voltar
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="secondary" disabled={isBusy} onClick={onSaveDraft}>
            Salvar rascunho
          </Button>
          {isLast ? (
            <Button type="button" variant="save" disabled={isBusy} onClick={onComplete}>
              {completeLabel}
            </Button>
          ) : (
            <Button type="button" disabled={isBusy} onClick={onNext}>
              Avançar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
