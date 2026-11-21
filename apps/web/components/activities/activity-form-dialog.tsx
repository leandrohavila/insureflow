"use client"

import { useEffect, useState, type FormEvent } from "react"
import {
  ClipboardCheck,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  RotateCw,
  Users,
  type LucideIcon,
} from "lucide-react"

import { ActivityLinkField } from "@/components/activities/activity-link-field"
import { ActivityTypeSelector } from "@/components/activities/activity-type-selector"
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
import {
  activityRelationFromLink,
  initialActivityLink,
  type ActivityLinkValue,
} from "@/lib/crm/activity-link"
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
  customerId?: string | null
  policyId?: string | null
  pending?: boolean
  error?: unknown
  activity?: Activity | null
  onSubmit: (input: CreateActivityInput) => void
  /** Render inline (inside Lead dialog) instead of a stacked modal. */
  embedded?: boolean
  allowedTypes?: readonly ActivityType[]
  title?: string
  description?: string
  requireNextFollowUp?: boolean
  /** Agenda abre o formulário no drawer lateral. Leads e Pipeline usam o mesmo drawer. */
  presentation?: "dialog" | "drawer"
  /** Quando o contexto já define o registro, o vínculo não pode ser trocado nem removido. */
  lockLink?: boolean
  linkPreference?: "lead" | "deal" | "customer" | "policy"
  linkTitle?: string
  linkDetail?: string
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
const drawerLabelClass = "text-xs font-semibold text-[#5C6578]"

const DRAWER_TITLES: Record<ActivityType, string> = {
  call: "Nova ligação",
  whatsapp: "Novo contato via WhatsApp",
  email: "Enviar e-mail",
  meeting: "Agendar reunião",
  visit: "Agendar visita",
  task: "Criar tarefa",
  follow_up: "Novo follow-up",
  renewal: "Nova renovação",
  note: "Nova observação",
}

const DRAWER_ICONS: Record<ActivityType, LucideIcon> = {
  call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  meeting: Users,
  visit: MapPin,
  task: ClipboardCheck,
  follow_up: RotateCw,
  renewal: RefreshCw,
  note: FileText,
}

function FieldAlert({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-xs font-medium text-destructive" role="alert">
      {message}
    </p>
  )
}

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
  customerId,
  policyId,
  pending,
  error,
  activity,
  onSubmit,
  embedded = false,
  allowedTypes,
  title,
  description,
  requireNextFollowUp = false,
  presentation = "dialog",
  lockLink = false,
  linkPreference,
  linkTitle,
  linkDetail,
}: ActivityFormDialogProps) {
  const [form, setForm] = useState<FormState>(() => createEmptyForm(null))
  const [link, setLink] = useState<ActivityLinkValue | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  /** Só true após clique num chip ou quando `initialType` veio de ação explícita (quick action). */
  const [typeConfirmed, setTypeConfirmed] = useState(false)

  const selectedType = typeConfirmed ? form.type : null
  const placeholders = selectedType
    ? activityFormPlaceholders[selectedType]
    : null
  const requiredFields = selectedType
    ? getActivityFormFields(selectedType).required
    : []
  const canSubmit = Boolean(selectedType) && Boolean(link) && !pending

  useEffect(() => {
    setActivityFormDialogOpenAttribute(open)
    return () => setActivityFormDialogOpenAttribute(false)
  }, [open])

  useEffect(() => {
    if (!open) {
      setForm(createEmptyForm(null))
      setTypeConfirmed(false)
      setLink(null)
      setFieldErrors({})
      return
    }

    const presetLink = initialActivityLink({
      leadId: activity?.leadId ?? leadId,
      dealId: activity?.dealId ?? dealId,
      customerId: activity?.customerId ?? customerId,
      policyId: activity?.policyId ?? policyId,
      preference: activity ? undefined : linkPreference,
      title: activity ? undefined : linkTitle,
      detail: activity ? undefined : linkDetail,
    })
    setLink(presetLink)

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
  }, [activity, customerId, dealId, initialType, leadId, linkDetail, linkPreference, linkTitle, open, policyId])

  function validationErrors() {
    const errors: Record<string, string> = {}
    if (!typeConfirmed || !form.type) {
      errors.type = "Selecione o tipo da atividade."
      return errors
    }
    if (!link) {
      errors.link = "Selecione um lead, negócio, cliente ou apólice."
    }
    if (form.type !== "note" && !form.subject.trim()) {
      errors.subject = "Informe o assunto."
    }
    if (requiredFields.includes("description") && !form.description.trim()) {
      errors.description = "Informe a descrição."
    }
    if (
      (requireNextFollowUp || requiredFields.includes("nextFollowUpAt")) &&
      !form.nextFollowUpAt
    ) {
      errors.nextFollowUpAt = "Informe a data do próximo follow-up."
    }
    if (requiredFields.includes("occurredAt") && !form.occurredAt) {
      errors.occurredAt = "Informe quando ocorreu."
    }
    return errors
  }

  function submitPayload(type: ActivityType): CreateActivityInput {
    const subject =
      type === "note"
        ? form.subject.trim() || activityTypeSubjects.note
        : form.subject.trim() || activityTypeSubjects[type]
    return {
      type,
      subject,
      description: form.description.trim() || undefined,
      outcome: form.outcome.trim() || undefined,
      occurredAt: toIsoFromLocal(form.occurredAt),
      nextFollowUpAt: form.nextFollowUpAt
        ? toIsoFromLocal(form.nextFollowUpAt)
        : undefined,
      ...activityRelationFromLink(link),
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending) return

    if (presentation === "drawer") {
      const errors = validationErrors()
      setFieldErrors(errors)
      if (Object.keys(errors).length > 0 || !form.type) return
      onSubmit(submitPayload(form.type))
      return
    }

    if (!typeConfirmed || !form.type || !link) return

    if (form.type !== "note" && !form.subject.trim()) return
    if (requiredFields.includes("description") && !form.description.trim()) return
    if (
      (requireNextFollowUp || requiredFields.includes("nextFollowUpAt")) &&
      !form.nextFollowUpAt
    ) {
      return
    }
    if (requiredFields.includes("occurredAt") && !form.occurredAt) return

    onSubmit(submitPayload(form.type))
  }

  function clearFieldError(key: string) {
    setFieldErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  useEffect(() => {
    if (!open || presentation !== "drawer") return
    const timer = window.setTimeout(() => {
      const subject = document.getElementById("agenda-activity-subject")
      const description = document.getElementById("agenda-activity-description")
      ;(subject ?? description)?.focus()
    }, 80)
    return () => window.clearTimeout(timer)
  }, [open, presentation])

  const formBody = (
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
              {activity ? "Editar atividade" : (title ?? "Registrar atividade")}
            </DialogTitle>
            <DialogDescription className="crm-text-meta">
              {description ??
                "Registro operacional de interação humana no relacionamento."}
            </DialogDescription>
          </DialogHeader>

          <div
            className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden px-5 py-5 sm:px-7 sm:py-6"
            {...isolateNestedSurfaceEvents}
          >
            <div {...isolateNestedSurfaceEvents}>
              <ActivityTypeSelector
                value={selectedType}
                types={allowedTypes}
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

            <ActivityLinkField
              locked={lockLink}
              value={link}
              disabled={pending}
              onChange={setLink}
            />
            {!link ? (
              <p className="crm-text-meta text-destructive" role="alert">
                Selecione um lead, negócio, cliente ou apólice.
              </p>
            ) : null}

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
                    {requireNextFollowUp ||
                    requiredFields.includes("nextFollowUpAt") ? (
                      <span className="text-destructive"> *</span>
                    ) : null}
                  </span>
                  <input
                    type="datetime-local"
                    required={
                      requireNextFollowUp ||
                      requiredFields.includes("nextFollowUpAt")
                    }
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
              variant="save"
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
  )

  if (presentation === "drawer") {
    const headerType = selectedType
    const HeaderIcon = headerType ? DRAWER_ICONS[headerType] : FileText
    const showSchedule = selectedType
      ? isActivityFormFieldVisible(selectedType, "occurredAt") ||
        isActivityFormFieldVisible(selectedType, "nextFollowUpAt")
      : false
    const showOutcome = selectedType
      ? isActivityFormFieldVisible(selectedType, "outcome") &&
        Boolean(placeholders?.outcome)
      : false

    return (
      <CrmFormDrawer open={open} onOpenChange={onOpenChange}>
          <form
            onSubmit={handleSubmit}
            className="flex h-full min-h-0 flex-col"
            {...isolateNestedSurfaceEvents}
          >
            <CrmFormDrawerHeader
              icon={HeaderIcon}
              title={
                headerType
                  ? DRAWER_TITLES[headerType]
                  : (title ?? "Registrar atividade")
              }
              description={description ?? "Confirme o tipo, o vínculo e o horário."}
            />

            <CrmFormDrawerBody className="gap-4 px-5! py-4!">
              <CrmFormDrawerSection title="Identificação" className="gap-4 p-4!">
                <ActivityTypeSelector
                  variant="grid"
                  value={selectedType}
                  types={allowedTypes}
                  disabled={pending}
                  onChange={(type) => {
                    setTypeConfirmed(true)
                    clearFieldError("type")
                    setForm((current) => handleTypeChange(current, type))
                  }}
                />
                <FieldAlert message={fieldErrors.type} />
                {selectedType && isActivityFormFieldVisible(selectedType, "subject") ? (
                  <label className="flex flex-col gap-2">
                    <span className={drawerLabelClass}>
                      Assunto
                      {requiredFields.includes("subject") || selectedType !== "note" ? (
                        <span className="text-destructive"> *</span>
                      ) : null}
                    </span>
                    <Input
                      id="agenda-activity-subject"
                      value={form.subject}
                      aria-invalid={Boolean(fieldErrors.subject)}
                      onChange={(event) => {
                        clearFieldError("subject")
                        setForm((current) => ({
                          ...current,
                          subject: event.target.value,
                        }))
                      }}
                      placeholder={placeholders?.subject}
                      className={crmDrawerInputClass}
                      {...isolateNestedSurfaceEvents}
                    />
                    <FieldAlert message={fieldErrors.subject} />
                  </label>
                ) : null}
                {selectedType && isActivityFormFieldVisible(selectedType, "description") ? (
                  <label className="flex flex-col gap-2">
                    <span className={drawerLabelClass}>
                      {selectedType === "note" ? "Observação" : "Descrição"}
                      {requiredFields.includes("description") ? (
                        <span className="text-destructive"> *</span>
                      ) : null}
                    </span>
                    {selectedType === "note" ? (
                      <textarea
                        id="agenda-activity-description"
                        rows={3}
                        value={form.description}
                        aria-invalid={Boolean(fieldErrors.description)}
                        onChange={(event) => {
                          clearFieldError("description")
                          setForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }}
                        placeholder={placeholders?.description}
                        className={cn(crmDrawerInputClass, "min-h-20 resize-y py-2")}
                        {...isolateNestedSurfaceEvents}
                      />
                    ) : (
                      <Input
                        id="agenda-activity-description"
                        value={form.description}
                        aria-invalid={Boolean(fieldErrors.description)}
                        onChange={(event) => {
                          clearFieldError("description")
                          setForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }}
                        placeholder={placeholders?.description}
                        className={crmDrawerInputClass}
                        {...isolateNestedSurfaceEvents}
                      />
                    )}
                    <FieldAlert message={fieldErrors.description} />
                  </label>
                ) : null}
              </CrmFormDrawerSection>

              <CrmFormDrawerSection title="Vínculo" className="gap-4 p-4!">
                <ActivityLinkField
                  variant="drawer"
                  locked={lockLink}
                  value={link}
                  disabled={pending}
                  onChange={(next) => {
                    clearFieldError("link")
                    setLink(next)
                  }}
                />
                <FieldAlert message={fieldErrors.link} />
              </CrmFormDrawerSection>

              {showSchedule ? (
                <CrmFormDrawerSection title="Agendamento" className="gap-4 p-4!">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {isActivityFormFieldVisible(selectedType!, "occurredAt") ? (
                    <label className="flex min-w-0 flex-col gap-2">
                      <span className={drawerLabelClass}>
                        Quando ocorreu
                        {requiredFields.includes("occurredAt") ? (
                          <span className="text-destructive"> *</span>
                        ) : null}
                      </span>
                      <input
                        type="datetime-local"
                        value={form.occurredAt}
                        aria-invalid={Boolean(fieldErrors.occurredAt)}
                        onChange={(event) => {
                          clearFieldError("occurredAt")
                          setForm((current) => ({
                            ...current,
                            occurredAt: event.target.value,
                          }))
                        }}
                        className={crmDrawerInputClass}
                        {...isolateNestedSurfaceEvents}
                      />
                      <FieldAlert message={fieldErrors.occurredAt} />
                    </label>
                  ) : null}
                  {isActivityFormFieldVisible(selectedType!, "nextFollowUpAt") ? (
                    <label className="flex min-w-0 flex-col gap-2">
                      <span className={drawerLabelClass}>
                        {selectedType === "follow_up"
                          ? "Data do follow-up"
                          : "Próximo follow-up"}
                        {requireNextFollowUp ||
                        requiredFields.includes("nextFollowUpAt") ? (
                          <span className="text-destructive"> *</span>
                        ) : null}
                      </span>
                      <input
                        type="datetime-local"
                        value={form.nextFollowUpAt}
                        aria-invalid={Boolean(fieldErrors.nextFollowUpAt)}
                        onChange={(event) => {
                          clearFieldError("nextFollowUpAt")
                          setForm((current) => ({
                            ...current,
                            nextFollowUpAt: event.target.value,
                          }))
                        }}
                        className={crmDrawerInputClass}
                        {...isolateNestedSurfaceEvents}
                      />
                      <FieldAlert message={fieldErrors.nextFollowUpAt} />
                    </label>
                  ) : null}
                  </div>
                </CrmFormDrawerSection>
              ) : null}

              {showOutcome ? (
                <CrmFormDrawerSection title="Resultado" className="gap-4 p-4!">
                  <label className="flex flex-col gap-2">
                    <span className={drawerLabelClass}>
                      Resultado
                    </span>
                    <Input
                      value={form.outcome}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          outcome: event.target.value,
                        }))
                      }
                      placeholder={placeholders?.outcome}
                      className={crmDrawerInputClass}
                      {...isolateNestedSurfaceEvents}
                    />
                  </label>
                </CrmFormDrawerSection>
              ) : null}

              {error ? (
                <p
                  className="rounded-lg border border-[#e7c4c4] bg-[#fdf3f2] p-3 text-sm text-[#9f2d2d]"
                  role="alert"
                >
                  {getErrorMessage(error, "Erro ao salvar atividade")}
                </p>
              ) : null}
            </CrmFormDrawerBody>

            <CrmFormDrawerFooter>
              <CrmFormDrawerCancel
                disabled={pending}
                onClick={() => onOpenChange(false)}
              />
              <CrmFormDrawerSubmit pending={pending} pendingLabel="Salvando…">
                {activity ? "Salvar" : "Registrar atividade"}
              </CrmFormDrawerSubmit>
            </CrmFormDrawerFooter>
          </form>
      </CrmFormDrawer>
    )
  }

  if (embedded) {
    if (!open) return null
    return (
      <div className="rounded-lg border border-[#d6cfc4] bg-white p-3!">
        {formBody}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="avila-lead-surface crm-workspace z-[60] flex max-h-[min(90svh,760px)] flex-col overflow-hidden p-0! text-[var(--avila-navy-900)] sm:max-w-lg"
        style={{
          backgroundColor: "var(--crm-surface-base)",
          borderColor: "var(--crm-stroke-default)",
        }}
        {...isolateNestedSurfaceEvents}
      >
        {formBody}
      </DialogContent>
    </Dialog>
  )
}
