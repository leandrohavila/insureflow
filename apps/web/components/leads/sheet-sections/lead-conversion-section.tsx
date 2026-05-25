"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowRightLeft,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  ClipboardList,
  Loader2,
  PartyPopper,
  UserCog,
} from "lucide-react"

import { CommercialWarningBanner } from "@/components/crm/commercial-warning-banner"
import { SectionPanel, StatusPill } from "@/components/crm/primitives"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  formatCurrency,
  stageLabelMap,
} from "@/lib/data-access/modules/crm"
import {
  useLeadContext,
  type Lead,
  type LeadContextSubmission,
} from "@/lib/data-access/modules/leads"
import { cn } from "@/lib/utils"

type LeadConversionSectionProps = {
  lead: Lead
  isConverting: boolean
  onConvert: (lead: Lead) => void
  onFillQuestionnaire: (lead: Lead) => void
}

type ChecklistItem = {
  id: string
  label: string
  done: boolean
  /** Texto curto exibido em cinza ao lado quando relevante. */
  hint?: string
}

function deriveChecklist(
  lead: Lead,
  latestSubmission: LeadContextSubmission | null,
): ChecklistItem[] {
  const hasContact = Boolean(lead.email?.trim() || lead.phone?.trim())
  const hasOwner = Boolean(lead.assignedTo?.trim())
  const submissionDone =
    latestSubmission?.status === "submitted" ||
    latestSubmission?.status === "reviewed"
  const submissionDraft = latestSubmission?.status === "draft"

  return [
    {
      id: "owner",
      label: "Responsável definido",
      done: hasOwner,
      hint: hasOwner ? lead.assignedTo ?? "" : "Atribua antes de converter",
    },
    {
      id: "contact",
      label: "Contato registrado",
      done: hasContact,
      hint: hasContact
        ? [lead.email, lead.phone].filter(Boolean).join(" · ")
        : "E-mail ou telefone",
    },
    {
      id: "questionnaire",
      label: "Questionário comercial",
      done: submissionDone,
      hint: submissionDone
        ? "Enviado"
        : submissionDraft
          ? "Em rascunho"
          : "Recomendado antes da conversão",
    },
    {
      id: "qualified",
      label: "Lead qualificado",
      done: lead.status === "qualified" || lead.status === "converted",
      hint:
        lead.status === "new"
          ? "Avance pelo menos para Contatado"
          : undefined,
    },
  ]
}

/**
 * Seção destaque do `LeadSheetV2`: comunica visualmente que **converter é
 * a próxima ação operacional importante do lead**.
 *
 * Tem dois modos mutuamente exclusivos:
 *
 * 1. **Lead vivo (não convertido)**: hero card com CTA primary + checklist
 *    derivado do `useLeadContext`. Se há draft de questionário, exibe o
 *    `CommercialWarningBanner` (mesmo componente do `ConvertLeadDialog` —
 *    consistência narrativa total).
 *
 * 2. **Lead convertido**: card de "Negócio gerado" com link `Abrir negócio`
 *    levando para o CRM. Se o flag `?sheet=v2` está ativo, propaga para o
 *    deal-side também (continuidade de workspace).
 *
 * NÃO chama `useConvertLead` diretamente — apenas dispara o callback
 * `onConvert` que o `LeadsPage` já implementa com `ConvertLeadDialog`. Assim
 * preservamos zero alteração no fluxo de conversão (regra absoluta do brief).
 */
export function LeadConversionSection({
  lead,
  isConverting,
  onConvert,
  onFillQuestionnaire,
}: LeadConversionSectionProps) {
  const searchParams = useSearchParams()
  const flagSuffix = searchParams.get("sheet") === "v2" ? "&sheet=v2" : ""

  const contextQuery = useLeadContext(lead.id)
  const context = contextQuery.data ?? null
  const linkedDeal = context?.deal ?? null
  const latestSubmission = context?.latestSubmission ?? null

  const isConverted = lead.status === "converted" || Boolean(lead.dealId)
  const hasDraftWarning = Boolean(
    context?.warnings.some((warning) => warning.code === "draft_questionnaire"),
  )

  /* ----------------- Modo: lead já convertido ----------------- */
  if (isConverted) {
    return (
      <div className="flex flex-col gap-4">
        <SectionPanel
          title="Lead convertido em negócio"
          eyebrow={
            <StatusPill tone="success" variant="soft" size="xs" dot>
              Convertido
            </StatusPill>
          }
          tone="default"
        >
          <div
            className="flex flex-col gap-3 rounded-lg p-4"
            style={{
              backgroundColor:
                "color-mix(in oklch, var(--crm-tone-success) 6%, transparent)",
              boxShadow:
                "inset 0 0 0 1px color-mix(in oklch, var(--crm-tone-success) 18%, transparent)",
            }}
          >
            <div className="flex items-start gap-2.5">
              <PartyPopper
                className="size-4 shrink-0 text-emerald-300"
                strokeWidth={1.75}
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="crm-text-title text-foreground">
                  {linkedDeal?.title ?? "Negócio gerado"}
                </p>
                <p className="crm-text-meta">
                  {linkedDeal ? (
                    <>
                      {stageLabelMap[linkedDeal.stage]} ·{" "}
                      {formatCurrency(linkedDeal.value)}
                    </>
                  ) : (
                    "Este lead já foi convertido. Abra o negócio para continuar a operação."
                  )}
                </p>
              </div>
            </div>

            {lead.dealId ? (
              <Link
                href={`/crm/negocios?deal=${lead.dealId}${flagSuffix}`}
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "w-full justify-center gap-2 sm:w-auto",
                )}
              >
                Abrir negócio
                <ArrowUpRight className="size-3.5" />
              </Link>
            ) : null}
          </div>
        </SectionPanel>
      </div>
    )
  }

  /* ----------------- Modo: lead vivo, pronto para conversão ----------------- */
  const checklist = deriveChecklist(lead, latestSubmission)
  const doneCount = checklist.filter((item) => item.done).length
  const readiness = Math.round((doneCount / checklist.length) * 100)

  return (
    <div className="flex flex-col gap-4">
      <SectionPanel
        title="Pronto para virar negócio?"
        description="Quando o lead estiver qualificado, converta em negócio para entrar no pipeline do CRM."
        eyebrow={
          <StatusPill
            tone={
              readiness === 100
                ? "success"
                : readiness >= 50
                  ? "brand"
                  : "neutral"
            }
            variant="soft"
            size="xs"
            dot
          >
            Prontidão {readiness}%
          </StatusPill>
        }
        tone="default"
      >
        <div className="flex flex-col gap-4">
          {/* Hero CTA */}
          <div
            className="flex flex-col gap-3 rounded-lg p-4 md:flex-row md:items-center md:justify-between"
            style={{
              backgroundColor:
                "color-mix(in oklch, var(--crm-tone-brand) 6%, transparent)",
              boxShadow:
                "inset 0 0 0 1px color-mix(in oklch, var(--crm-tone-brand) 22%, transparent)",
            }}
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <ArrowRightLeft
                className="mt-0.5 size-4 shrink-0 text-primary"
                strokeWidth={1.75}
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="crm-text-title text-foreground">
                  Converter em negócio
                </p>
                <p className="crm-text-meta">
                  Cria um deal no estágio inicial do pipeline, mantendo todo o
                  histórico do lead vinculado.
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              className="shrink-0 gap-2"
              disabled={isConverting}
              onClick={() => onConvert(lead)}
            >
              {isConverting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Convertendo…
                </>
              ) : (
                <>
                  <ArrowRightLeft className="size-3.5" />
                  Converter agora
                </>
              )}
            </Button>
          </div>

          {/* Draft warning — espelha o aviso do ConvertLeadDialog */}
          {hasDraftWarning ? (
            <CommercialWarningBanner
              tone="warning"
              title="Existe questionário em rascunho para este lead."
              description="Você pode converter mesmo assim ou retomar o preenchimento antes."
              secondaryAction={{
                label: "Continuar preenchimento",
                variant: "outline",
                onClick: () => onFillQuestionnaire(lead),
              }}
            />
          ) : null}

          {/* Checklist de prontidão */}
          <ul className="flex flex-col gap-1">
            {checklist.map((item) => {
              const Icon = item.done ? CheckCircle2 : Circle
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-2.5 rounded-md px-3 py-2"
                  style={{
                    backgroundColor: "var(--crm-surface-panel)",
                  }}
                >
                  <Icon
                    className={cn(
                      "mt-0.5 size-3.5 shrink-0",
                      item.done ? "text-emerald-300" : "text-foreground/35",
                    )}
                    strokeWidth={1.75}
                  />
                  <div className="flex min-w-0 flex-col leading-tight">
                    <span
                      className={cn(
                        "crm-text-meta",
                        item.done ? "text-foreground/90" : "text-foreground/75",
                      )}
                    >
                      {item.label}
                    </span>
                    {item.hint ? (
                      <span className="crm-text-micro">{item.hint}</span>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>

          {contextQuery.isLoading ? (
            <p className="crm-text-meta flex items-center gap-1.5 text-foreground/55">
              <Loader2 className="size-3 animate-spin" />
              Verificando contexto comercial…
            </p>
          ) : null}
        </div>
      </SectionPanel>

      {/* Ações secundárias relacionadas à conversão */}
      <SectionPanel title="Ações relacionadas" tone="default" density="compact">
        <div className="flex flex-col gap-2 px-1.5 pb-1 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => onFillQuestionnaire(lead)}
          >
            <ClipboardList className="size-3.5" />
            {latestSubmission && latestSubmission.status === "draft"
              ? "Continuar preenchimento do questionário"
              : latestSubmission
                ? "Atualizar questionário"
                : "Preencher questionário"}
          </Button>
          {!lead.assignedTo?.trim() ? (
            <p className="crm-text-meta flex items-center gap-1.5 px-2 text-foreground/55">
              <UserCog className="size-3" />
              Atribua um responsável antes de converter para evitar leads órfãos.
            </p>
          ) : null}
        </div>
      </SectionPanel>
    </div>
  )
}
