"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"

import { ActivityTimeline } from "@/components/activities/activity-timeline"
import { CommercialWarningBanner } from "@/components/crm/commercial-warning-banner"
import { useSession } from "@/components/auth/session-provider"
import { FormSelect } from "@/components/design-system"
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
  formatPhoneBrMask,
  LEAD_DOCUMENT_TYPES,
  normalizeDocument,
  type LeadDocumentType,
} from "@/lib/documents/document"
import type {
  CreateLeadInput,
  Lead,
  LeadDuplicate,
  LeadStatus,
} from "@/lib/data-access/modules/leads"
import { useLeadDuplicates } from "@/lib/data-access/modules/leads"
import {
  buildLeadDialogFormState,
  EMPTY_LEAD_DIALOG_FORM,
  type LeadDialogFormState,
} from "@/lib/data-access/modules/leads/lead-dialog-form"
import {
  leadFormToAgendaFields,
  NEXT_CONTACT_ACTIVITY_OPTIONS,
  NEXT_CONTACT_PRESET_CUSTOM,
  suggestRenewalReminderFields,
} from "@/lib/data-access/modules/leads/lead-next-contact-form"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import {
  INTEREST_CATEGORY_LABELS,
  type InterestCategory,
} from "@/lib/business-units/constants"
import {
  interestsForLeadIntent,
  leadIntentFromUnitType,
  type LeadCreateIntent,
} from "@/lib/leads/lead-intent"
import {
  bug010DrawerLog,
  bug010DrawerResetFlow,
  bug010DrawerSetState,
} from "@/lib/performance/bug010-drawer-flow"
import { cn } from "@/lib/utils"

const statusLabels: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  converted: "Convertido",
  lost: "Perdido",
}

function optionalFormValue(value: string) {
  return value.trim() || undefined
}

function formatLeadDate(value: string | null | undefined) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function buildDuplicateMeta(duplicate: LeadDuplicate) {
  return (
    <ul className="space-y-0.5">
      <li>
        <span className="opacity-70">Status:</span> {statusLabels[duplicate.status]}
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

function LeadDialogBusinessFields({
  form,
  update,
  intent,
}: {
  form: LeadDialogFormState
  update: <K extends keyof LeadDialogFormState>(
    key: K,
    value: LeadDialogFormState[K],
  ) => void
  intent: LeadCreateIntent
}) {
  const visibleInterests = interestsForLeadIntent(intent)

  return (
    <div className="space-y-2 sm:col-span-2">
      <span className="text-sm font-medium">Interesses</span>
      <div className="flex flex-wrap gap-2">
        {visibleInterests.map((category) => {
          const active = form.interestCategories.includes(category)
          return (
            <button
              key={category}
              type="button"
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                active
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-white/[0.08] text-muted-foreground",
              )}
              onClick={() =>
                update(
                  "interestCategories",
                  active
                    ? form.interestCategories.filter((item) => item !== category)
                    : [...form.interestCategories, category],
                )
              }
            >
              {INTEREST_CATEGORY_LABELS[category]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export type LeadDialogProps = {
  lead: Lead | null
  open: boolean
  pending: boolean
  error: unknown
  lockedBusinessUnitId?: string
  intent?: LeadCreateIntent
  defaultInterestCategories?: InterestCategory[]
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreateLeadInput) => void | Promise<void>
  onOpenExistingLead: (leadId: string) => void
  onSubmitLockedChange: (locked: boolean) => void
}

export function LeadDialog({
  lead,
  open,
  pending,
  error,
  lockedBusinessUnitId,
  intent: intentProp,
  defaultInterestCategories,
  onOpenChange,
  onSubmit,
  onOpenExistingLead,
  onSubmitLockedChange,
}: LeadDialogProps) {
  const { session } = useSession()
  const [duplicateDismissed, setDuplicateDismissed] = useState(false)
  const [form, setForm] = useState<LeadDialogFormState>(EMPTY_LEAD_DIALOG_FORM)
  const [submitLocked, setSubmitLocked] = useState(false)

  const intent: LeadCreateIntent =
    intentProp ?? leadIntentFromUnitType(lead?.businessUnit?.type)

  const duplicatesQuery = useLeadDuplicates({
    document: form.document,
    excludeId: lead?.id,
    enabled: open && !duplicateDismissed,
    debounceMs: 500,
  })

  const duplicates = duplicatesQuery.data ?? []
  const primaryDuplicate = duplicates[0]

  useEffect(() => {
    onSubmitLockedChange(submitLocked)
  }, [onSubmitLockedChange, submitLocked])

  useEffect(() => {
    if (!open) {
      setDuplicateDismissed(false)
      setForm(EMPTY_LEAD_DIALOG_FORM)
      console.log("[DRAWER] 7-before-loading-false")
      bug010DrawerLog("before setSubmitLocked(false)")
      setSubmitLocked(false)
      bug010DrawerSetState({ submitLocked: false })
      bug010DrawerLog("after setSubmitLocked(false)")
      console.log("[DRAWER] 8-after-loading-false")
      return
    }

    setDuplicateDismissed(false)
    console.log("[DRAWER] 7-before-loading-false")
    bug010DrawerLog("before setSubmitLocked(false)")
    setSubmitLocked(false)
    bug010DrawerSetState({ submitLocked: false })
    bug010DrawerLog("after setSubmitLocked(false)")
    console.log("[DRAWER] 8-after-loading-false")
    setForm(
      buildLeadDialogFormState(lead, session?.name, {
        lockedBusinessUnitId,
        defaultInterestCategories,
      }),
    )
  }, [defaultInterestCategories, lead, lockedBusinessUnitId, open, session?.name])

  useEffect(() => {
    if (error) {
      console.log("[DRAWER] 7-before-loading-false")
      bug010DrawerLog("before setSubmitLocked(false)")
      setSubmitLocked(false)
      bug010DrawerSetState({ submitLocked: false })
      bug010DrawerLog("after setSubmitLocked(false)")
      console.log("[DRAWER] 8-after-loading-false")
    }
  }, [error])

  useEffect(() => {
    setDuplicateDismissed(false)
  }, [form.document, form.documentType])

  function update<K extends keyof LeadDialogFormState>(
    key: K,
    value: LeadDialogFormState[K],
  ) {
    setForm((current) => {
      const next = { ...current, [key]: value }
      if (key === "policyExpiresAt") {
        return {
          ...next,
          ...suggestRenewalReminderFields(String(value)),
        }
      }
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || submitLocked) return
    if (!form.name.trim()) return
    const businessUnitId = lockedBusinessUnitId || form.businessUnitId.trim()
    if (!businessUnitId) return

    bug010DrawerResetFlow()
    bug010DrawerSetState({ dialogOpen: open, submitLocked })
    bug010DrawerLog("submit()")
    console.log("[DRAWER] 1-submit")
    setSubmitLocked(true)
    bug010DrawerSetState({ submitLocked: true })

    const normalized = normalizeDocument(
      form.document.trim() ? form.documentType : undefined,
      form.document,
    )

    try {
      await onSubmit({
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
        notes: optionalFormValue(form.notes),
        assignedTo: optionalFormValue(form.assignedTo),
        opportunityType: optionalFormValue(form.opportunityType),
        currentInsurer: optionalFormValue(form.currentInsurer),
        currentPolicyNumber: optionalFormValue(form.currentPolicyNumber),
        policyExpiresAt: optionalFormValue(form.policyExpiresAt),
        businessUnitId,
        interestCategories: form.interestCategories,
        ...leadFormToAgendaFields(form),
      })
    } finally {
      bug010DrawerLog("before setSubmitLocked(false)")
      setSubmitLocked(false)
      bug010DrawerSetState({ submitLocked: false })
      bug010DrawerLog("after setSubmitLocked(false)")
    }
  }

  const submitPending = pending || submitLocked
  const canSubmit =
    Boolean(form.name.trim()) &&
    Boolean(lockedBusinessUnitId || form.businessUnitId.trim())

  useEffect(() => {
    console.log("[DRAWER] isSubmitting =", submitPending)
  }, [submitPending])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/[0.08] bg-background/95 sm:max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader>
              <DialogTitle>
                {lead
                  ? "Editar lead"
                  : intent === "real-estate"
                    ? "Novo lead imobiliário"
                    : "Novo lead seguro"}
              </DialogTitle>
              <DialogDescription>
                {lead
                  ? "Atualize os dados de contato e o contexto comercial do lead."
                  : intent === "real-estate"
                    ? "O lead entra na Ávila Imóveis. Não é preciso escolher unidade."
                    : "O lead entra na Corretora Ávila. Não é preciso escolher unidade."}
              </DialogDescription>
              {lead ? (
                <p className="text-xs text-muted-foreground">
                  {formatLastInteraction(
                    lead.lastInteractionAt ?? lead.lastContactAt,
                  )}
                </p>
              ) : null}
            </DialogHeader>

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
                <FormSelect
                  value={form.documentType}
                  onChange={(event) =>
                    update("documentType", event.target.value as LeadDocumentType)
                  }
                  options={LEAD_DOCUMENT_TYPES.map((item) => ({
                    value: item,
                    label: item.toUpperCase(),
                  }))}
                />
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
                <span className="text-sm font-medium">Responsável</span>
                <Input
                  value={form.assignedTo}
                  onChange={(event) => update("assignedTo", event.target.value)}
                  placeholder="Ex.: Ana Costa"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Tipo oportunidade</span>
                <FormSelect
                  value={form.opportunityType}
                  onChange={(event) =>
                    update("opportunityType", event.target.value)
                  }
                  options={[
                    { value: "", label: "Selecionar" },
                    { value: "new_business", label: "Novo Negócio" },
                    { value: "renewal", label: "Renovação" },
                    { value: "cross_sell", label: "Cross Sell" },
                    { value: "indication", label: "Indicação" },
                  ]}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Seguradora atual</span>
                <Input
                  value={form.currentInsurer}
                  onChange={(event) =>
                    update("currentInsurer", event.target.value)
                  }
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Número apólice</span>
                <Input
                  value={form.currentPolicyNumber}
                  onChange={(event) =>
                    update("currentPolicyNumber", event.target.value)
                  }
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Vencimento apólice</span>
                <Input
                  type="date"
                  value={form.policyExpiresAt}
                  onChange={(event) =>
                    update("policyExpiresAt", event.target.value)
                  }
                />
              </label>
              <LeadDialogBusinessFields
                form={form}
                update={update}
                intent={intent}
              />
              {form.policyExpiresAt ? (
                <div className="space-y-3 sm:col-span-2 rounded-lg border border-white/10 p-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    Renovações automáticas
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sugestão D-60, D-30 e D-15. Edite a data se o contato comercial for em outro dia.
                  </p>
                  {(
                    [
                      ["D-60", "renewalReminderD60Date", "renewalReminderD60Time"],
                      ["D-30", "renewalReminderD30Date", "renewalReminderD30Time"],
                      ["D-15", "renewalReminderD15Date", "renewalReminderD15Time"],
                    ] as const
                  ).map(([label, dateKey, timeKey]) => (
                    <div key={label} className="grid gap-3 sm:grid-cols-[4rem_1fr_8rem] sm:items-end">
                      <p className="text-sm font-medium">{label}</p>
                      <label className="space-y-1">
                        <span className="text-xs text-muted-foreground">Data</span>
                        <Input
                          type="date"
                          value={form[dateKey]}
                          onChange={(event) => update(dateKey, event.target.value)}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs text-muted-foreground">Hora</span>
                        <Input
                          type="time"
                          value={form[timeKey]}
                          onChange={(event) => update(timeKey, event.target.value)}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="space-y-3 sm:col-span-2 rounded-lg border border-white/10 p-3">
                <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Próxima ação
                </p>
                <label className="space-y-2">
                  <span className="text-sm font-medium">Próximo contato</span>
                  <FormSelect
                    value={form.followUpDays}
                    onChange={(event) =>
                      update("followUpDays", event.target.value)
                    }
                    options={[
                      { value: "", label: "Não agendar agora" },
                      { value: "1", label: "Amanhã" },
                      { value: "3", label: "Em 3 dias" },
                      { value: "7", label: "Em 7 dias" },
                      { value: "15", label: "Em 15 dias" },
                      { value: NEXT_CONTACT_PRESET_CUSTOM, label: "Data personalizada" },
                    ]}
                  />
                </label>
                {form.followUpDays === NEXT_CONTACT_PRESET_CUSTOM ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium">Data</span>
                      <Input
                        required
                        type="date"
                        value={form.nextContactDate}
                        onChange={(event) =>
                          update("nextContactDate", event.target.value)
                        }
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium">Hora</span>
                      <Input
                        type="time"
                        value={form.nextContactTime}
                        onChange={(event) =>
                          update("nextContactTime", event.target.value)
                        }
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium">Tipo de atividade</span>
                      <FormSelect
                        value={form.nextContactType}
                        onChange={(event) =>
                          update("nextContactType", event.target.value)
                        }
                        options={NEXT_CONTACT_ACTIVITY_OPTIONS.map((item) => ({
                          value: item.value,
                          label: item.label,
                        }))}
                      />
                    </label>
                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-medium">Observação</span>
                      <Input
                        value={form.nextContactNotes}
                        onChange={(event) =>
                          update("nextContactNotes", event.target.value)
                        }
                        placeholder="Ex.: Conquistar apólice da concorrência"
                      />
                    </label>
                  </div>
                ) : null}
              </div>
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
                disabled={submitPending}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitPending || !canSubmit}>
                {submitPending ? (
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
      ) : null}
    </Dialog>
  )
}
