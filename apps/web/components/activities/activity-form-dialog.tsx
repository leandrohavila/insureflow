"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"

import { ActivityTypeSelector } from "@/components/activities/activity-type-selector"
import {
  activityTypeSubjects,
} from "@/lib/crm/activity-labels"
import {
  activityFormPlaceholders,
  getActivityFormFields,
  isActivityFormFieldVisible,
} from "@/lib/crm/activity-type-meta"
import { getErrorMessage } from "@/lib/data-access"
import {
  type Activity,
  type ActivityType,
  type CreateActivityInput,
  pickActivityRelationFields,
} from "@/lib/data-access/modules/activities"
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
import { setActivityFormDialogOpenAttribute } from "@/lib/crm/crm-keyboard"
import { isolateNestedSurfaceEvents } from "@/lib/crm/nested-surface-events"
import { cn } from "@/lib/utils"

type ActivityFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialType?: ActivityType
  leadId?: string | null
  dealId?: string | null
  pending?: boolean
  error?: unknown
  activity?: Activity | null
  onSubmit: (input: CreateActivityInput) => void
}

type FormState = {
  type: ActivityType | null
  subject: string
  description: string
  outcome: string
  occurredAt: string
  nextFollowUpAt: string
}

function defaultOccurredAtLocal() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

function toIsoFromLocal(value: string) {
  if (!value) return new Date().toISOString()
  return new Date(value).toISOString()
}

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

function subjectMatchesDefault(subject: string, type: ActivityType | null) {
  const trimmed = subject.trim()
  if (!trimmed) return true
  if (!type) return true
  return trimmed === activityTypeSubjects[type]
}

function handleTypeChange(current: FormState, nextType: ActivityType): FormState {
  const useDefaultSubject = subjectMatchesDefault(current.subject, current.type)

  return {
    ...current,
    type: nextType,
    subject: useDefaultSubject ? activityTypeSubjects[nextType] : current.subject,
    nextFollowUpAt:
      nextType === "follow_up"
        ? current.nextFollowUpAt || defaultOccurredAtLocal()
        : nextType === "note"
          ? ""
          : current.nextFollowUpAt,
  }
}

const fieldLabelClass =
  "crm-text-micro tracking-wide text-foreground/72"
const inputClass =
  "activity-form-input h-9 rounded-md border px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground/70 [color-scheme:dark]"
const datetimeInputClass =
  "activity-form-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm shadow-xs outline-none transition-colors [color-scheme:dark]"
const textareaClass =
  "activity-form-input w-full min-w-0 resize-y rounded-md border px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground/70"

function createEmptyForm(presetType: ActivityType | null): FormState {
  return {
    type: presetType,
    subject: presetType ? activityTypeSubjects[presetType] : "",
    description: "",
    outcome: "",
    occurredAt: defaultOccurredAtLocal(),
    nextFollowUpAt: presetType === "follow_up" ? defaultOccurredAtLocal() : "",
  }
}

export function ActivityFormDialog({
  open,
  onOpenChange,
  initialType,
  leadId,
  dealId,
  pending,
  error,
  activity,
  onSubmit,
}: ActivityFormDialogProps) {
  const [form, setForm] = useState<FormState>(() => createEmptyForm(null))
  /** Só true após clique num chip ou quando `initialType` veio de ação explícita (quick action). */
  const [typeConfirmed, setTypeConfirmed] = useState(false)

  const selectedType = typeConfirmed ? form.type : null
  const placeholders = selectedType
    ? activityFormPlaceholders[selectedType]
    : null
  const requiredFields = selectedType
    ? getActivityFormFields(selectedType).required
    : []
  const canSubmit = Boolean(selectedType) && !pending

  useEffect(() => {
    setActivityFormDialogOpenAttribute(open)
    return () => setActivityFormDialogOpenAttribute(false)
  }, [open])

  useEffect(() => {
    if (!open) {
      setForm(createEmptyForm(null))
      setTypeConfirmed(false)
      return
    }

    if (activity) {
      setForm({
        type: activity.type,
        subject: activity.subject,
        description: activity.description ?? "",
        outcome: activity.outcome ?? "",
        occurredAt: toLocalInput(activity.occurredAt),
        nextFollowUpAt: toLocalInput(activity.nextFollowUpAt),
      })
      setTypeConfirmed(true)
      return
    }

    const preset = initialType ?? null
    setForm(createEmptyForm(preset))
    setTypeConfirmed(preset !== null)
  }, [activity, initialType, open])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!typeConfirmed || !form.type) return

    const subject =
      form.type === "note"
        ? form.subject.trim() || activityTypeSubjects.note
        : form.subject.trim() || activityTypeSubjects[form.type]

    if (form.type !== "note" && !form.subject.trim()) return
    if (requiredFields.includes("description") && !form.description.trim()) return
    if (requiredFields.includes("nextFollowUpAt") && !form.nextFollowUpAt) return
    if (requiredFields.includes("occurredAt") && !form.occurredAt) return

    const relationFromActivity = activity
      ? pickActivityRelationFields(activity)
      : {}

    onSubmit({
      type: form.type,
      subject,
      description: form.description.trim() || undefined,
      outcome: form.outcome.trim() || undefined,
      occurredAt: toIsoFromLocal(form.occurredAt),
      nextFollowUpAt: form.nextFollowUpAt
        ? toIsoFromLocal(form.nextFollowUpAt)
        : undefined,
      ...relationFromActivity,
      ...(leadId ? { leadId } : {}),
      ...(dealId ? { dealId } : {}),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="crm-workspace z-[60] flex max-h-[min(90svh,760px)] flex-col overflow-hidden p-0 sm:max-w-lg"
        style={{
          backgroundColor: "var(--crm-surface-base)",
          borderColor: "var(--crm-stroke-default)",
        }}
        {...isolateNestedSurfaceEvents}
      >
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
          {...isolateNestedSurfaceEvents}
        >
          {/* Header com surface ladder sutil e respiro premium. */}
          <DialogHeader
            className="shrink-0 space-y-1.5 px-5 pt-5 pb-4 sm:px-7 sm:pt-6 sm:pb-5"
            style={{
              backgroundImage:
                "linear-gradient(180deg, color-mix(in oklch, var(--foreground) 3.5%, var(--background)) 0%, var(--crm-surface-base) 100%)",
              borderBottom: "1px solid var(--crm-stroke-faint)",
            }}
          >
            <DialogTitle className="text-[1.05rem] leading-tight font-semibold tracking-[-0.02em]">
              {activity ? "Editar atividade" : "Registrar atividade"}
            </DialogTitle>
            <DialogDescription className="crm-text-meta">
              Registro operacional de interação humana no relacionamento.
            </DialogDescription>
          </DialogHeader>

          <div
            className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden px-5 py-5 sm:px-7 sm:py-6"
            {...isolateNestedSurfaceEvents}
          >
            <div {...isolateNestedSurfaceEvents}>
              <ActivityTypeSelector
                value={selectedType}
                disabled={pending}
                onChange={(type) => {
                  setTypeConfirmed(true)
                  setForm((current) => handleTypeChange(current, type))
                }}
              />
              {!activity && !typeConfirmed ? (
                <p
                  className="crm-text-meta text-destructive"
                  role="alert"
                  id="activity-type-required"
                >
                  Selecione o tipo da atividade
                </p>
              ) : null}
            </div>

            {selectedType ? (
            <div className="grid min-w-0 gap-x-4 gap-y-3.5 sm:grid-cols-2">
              {isActivityFormFieldVisible(selectedType, "subject") ? (
                <label className="min-w-0 space-y-1.5 sm:col-span-2">
                  <span className={fieldLabelClass}>
                    Assunto
                    {requiredFields.includes("subject") ? (
                      <span className="text-destructive"> *</span>
                    ) : null}
                  </span>
                  <Input
                    required={requiredFields.includes("subject")}
                    value={form.subject}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        subject: event.target.value,
                      }))
                    }
                    placeholder={placeholders?.subject}
                    className={inputClass}
                    {...isolateNestedSurfaceEvents}
                  />
                </label>
              ) : null}

              {isActivityFormFieldVisible(selectedType, "description") ? (
                <label className="min-w-0 space-y-1.5 sm:col-span-2">
                  <span className={fieldLabelClass}>
                    {selectedType === "note" ? "Observação" : "Descrição"}
                    {requiredFields.includes("description") ? (
                      <span className="text-destructive"> *</span>
                    ) : null}
                  </span>
                  {selectedType === "note" ? (
                    <textarea
                      required
                      rows={5}
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder={placeholders?.description}
                      className={textareaClass}
                      {...isolateNestedSurfaceEvents}
                    />
                  ) : (
                    <Input
                      required={requiredFields.includes("description")}
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder={placeholders?.description}
                      className={inputClass}
                      {...isolateNestedSurfaceEvents}
                    />
                  )}
                </label>
              ) : null}

              {isActivityFormFieldVisible(selectedType, "occurredAt") ? (
                <label className="min-w-0 space-y-1.5">
                  <span className={fieldLabelClass}>
                    Quando ocorreu
                    {requiredFields.includes("occurredAt") ? (
                      <span className="text-destructive"> *</span>
                    ) : null}
                  </span>
                  <input
                    type="datetime-local"
                    required={requiredFields.includes("occurredAt")}
                    value={form.occurredAt}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        occurredAt: event.target.value,
                      }))
                    }
                    className={datetimeInputClass}
                    {...isolateNestedSurfaceEvents}
                  />
                </label>
              ) : null}

              {isActivityFormFieldVisible(selectedType, "nextFollowUpAt") ? (
                <label
                  className={cn(
                    "min-w-0 space-y-1.5",
                    selectedType === "follow_up" ? "sm:col-span-2" : "",
                  )}
                >
                  <span className={fieldLabelClass}>
                    {selectedType === "follow_up"
                      ? "Data do follow-up"
                      : "Próximo follow-up"}
                    {requiredFields.includes("nextFollowUpAt") ? (
                      <span className="text-destructive"> *</span>
                    ) : null}
                  </span>
                  <input
                    type="datetime-local"
                    required={requiredFields.includes("nextFollowUpAt")}
                    value={form.nextFollowUpAt}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        nextFollowUpAt: event.target.value,
                      }))
                    }
                    className={datetimeInputClass}
                    {...isolateNestedSurfaceEvents}
                  />
                </label>
              ) : null}

              {isActivityFormFieldVisible(selectedType, "outcome") &&
              placeholders?.outcome ? (
                <label className="min-w-0 space-y-1.5 sm:col-span-2">
                  <span className={fieldLabelClass}>Resultado</span>
                  <Input
                    value={form.outcome}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        outcome: event.target.value,
                      }))
                    }
                    placeholder={placeholders?.outcome}
                    className={inputClass}
                    {...isolateNestedSurfaceEvents}
                  />
                </label>
              ) : null}
            </div>
            ) : null}

            {error ? (
              <p
                className="rounded-md border p-3 text-sm"
                style={{
                  borderColor:
                    "color-mix(in oklch, var(--crm-tone-danger) 28%, transparent)",
                  backgroundColor:
                    "color-mix(in oklch, var(--crm-tone-danger) 10%, transparent)",
                  color: "var(--crm-tone-danger)",
                }}
              >
                {getErrorMessage(error, "Erro ao salvar atividade")}
              </p>
            ) : null}
          </div>

          {/* Footer sticky com top-shadow indicando scroll acima.
              `activity-form-footer` (em crm-operational.css) aplica border-top
              hairline, background sutil e sombra superior elegante. */}
          <DialogFooter
            className="activity-form-footer shrink-0 gap-2 px-5 py-4 sm:px-7 sm:py-5"
            {...isolateNestedSurfaceEvents}
          >
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
              className={cn(!canSubmit && "pointer-events-none")}
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando…
                </>
              ) : activity ? (
                "Salvar"
              ) : (
                "Registrar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
