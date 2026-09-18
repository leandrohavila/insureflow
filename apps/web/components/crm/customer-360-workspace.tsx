"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Sparkles,
  UserRound,
} from "lucide-react"

import { PermissionGate } from "@/components/auth/permission-gate"
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from "@/components/design-system"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { businessUnitPipelineBadge } from "@/lib/crm/business-unit-badge"
import {
  CUSTOMER_360_EVENT_LABELS,
  OPPORTUNITY_SCORE_LABELS,
  OPPORTUNITY_STATUS_LABELS,
  opportunityTypeLabel,
  type OpportunityScore,
  type OpportunityStatus,
} from "@/lib/crm/opportunity"
import { INTEREST_CATEGORY_LABELS } from "@/lib/business-units/constants"
import type { InterestCategory } from "@/lib/business-units/constants"
import {
  useCustomer360,
  useGenerateCustomer360,
} from "@/lib/data-access/modules/customer-360"
import { formatCurrency } from "@/lib/data-access/modules/crm"
import { summarizeCustomer360Domains } from "@/lib/crm/customer-360-domains"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "timeline", label: "Timeline" },
  { id: "pendencias", label: "Pendências" },
  { id: "financeiro", label: "Financeiro" },
  { id: "leads", label: "Leads" },
  { id: "deals", label: "Negócios" },
  { id: "policies", label: "Apólices" },
  { id: "properties", label: "Imóveis" },
  { id: "communications", label: "Comunicações" },
  { id: "followUps", label: "Follow-ups" },
  { id: "renewals", label: "Renovações" },
  { id: "agenda", label: "Agenda" },
  { id: "crossSell", label: "Cross-sell" },
] as const

type TabId = (typeof TABS)[number]["id"]

function formatDate(value?: string | null) {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return parsed.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

function interestLabel(value: string) {
  return INTEREST_CATEGORY_LABELS[value as InterestCategory] ?? value
}

export function Customer360Workspace({ customerId }: { customerId: string }) {
  const query = useCustomer360(customerId)
  const generate = useGenerateCustomer360()
  const [tab, setTab] = useState<TabId>("timeline")
  const data = query.data

  const units = useMemo(() => {
    if (!data) return []
    const list = data.customer.businessUnits ?? []
    if (list.length) return list
    return data.customer.businessUnit ? [data.customer.businessUnit] : []
  }, [data])
  const domains = useMemo(
    () => (data ? summarizeCustomer360Domains(data) : []),
    [data],
  )

  if (query.isLoading) {
    return <LoadingState label="Carregando Customer 360…" />
  }

  if (query.isError || !data) {
    return (
      <ErrorState
        title="Não foi possível abrir o Customer 360."
        description="O cliente pode estar fora do seu escopo ou indisponível."
        onRetry={() => void query.refetch()}
      />
    )
  }

  const { customer } = data
  const phones = customer.phones?.length
    ? customer.phones
    : customer.phone
      ? [customer.phone]
      : []
  const emails = customer.emails?.length
    ? customer.emails
    : customer.email
      ? [customer.email]
      : []

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <PageHeader
        compact
        title={customer.name}
        description="Um cliente, dois negócios. Seguros e imóveis no mesmo Customer 360."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/crm/clientes">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="size-3.5" />
                Carteira
              </Button>
            </Link>
            <PermissionGate permission="crm:manage">
              <Button
                size="sm"
                className="gap-2"
                disabled={generate.isPending}
                onClick={() => generate.mutate(customerId)}
              >
                <Sparkles className="size-3.5" />
                {generate.isPending ? "Gerando…" : "Gerar oportunidades"}
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2">
        {domains.map((domain) => (
          <article
            key={domain.id}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{domain.label}</p>
              <Badge variant={domain.active ? "secondary" : "outline"}>
                {domain.active ? "Ativo" : "Sem vínculo"}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {domain.leads} leads · {domain.opportunities} oportunidades ·{" "}
              {domain.assets} {domain.id === "INSURANCE" ? "apólices/negócios" : "imóveis/negócios"}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoBlock
          label="CPF/CNPJ"
          value={customer.document || "Não informado"}
        />
        <InfoBlock
          label="Telefones"
          value={phones.length ? phones.join(" · ") : "Não informado"}
          icon={Phone}
        />
        <InfoBlock
          label="E-mails"
          value={emails.length ? emails.join(" · ") : "Não informado"}
          icon={Mail}
        />
        <InfoBlock
          label="Responsável comercial"
          value={customer.ownerUser?.name || "Sem responsável"}
          icon={UserRound}
        />
        <div className="md:col-span-2">
          <p className="text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
            Empresa(s) vinculadas
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {units.length ? (
              units.map((unit) => (
                <Badge key={unit.id} variant="outline" className="gap-1">
                  <Building2 className="size-3" />
                  {unit.name}
                  <span className="text-[10px] text-muted-foreground">
                    {businessUnitPipelineBadge(unit.type)}
                  </span>
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                Nenhuma unidade vinculada
              </span>
            )}
          </div>
        </div>
        <div className="md:col-span-2">
          <p className="text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
            Interesses
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(customer.interestCategories ?? []).length ? (
              (customer.interestCategories ?? []).map((item) => (
                <Badge key={item} variant="secondary">
                  {interestLabel(item)}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                Sem interesses cadastrados
              </span>
            )}
          </div>
        </div>
      </section>

      {(data.pendencies ?? []).length > 0 ? (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <p className="text-sm font-medium">Pendências</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {data.pendencies.slice(0, 4).map((item) => (
              <li key={item.id}>
                {item.title} — {item.detail}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className="flex gap-1 overflow-x-auto" aria-label="Abas do Customer 360">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "h-8 shrink-0 rounded-md px-3 text-sm font-medium",
              tab === item.id
                ? "border border-primary/40 bg-primary/12 text-primary"
                : "text-muted-foreground hover:bg-white/[0.05]",
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "timeline" ? (
        <ListOrEmpty
          items={data.timeline}
          empty="Nenhum evento na timeline."
          render={(event) => (
            <li key={event.id} className="rounded-xl border border-white/[0.06] px-4 py-3">
              <p className="text-sm font-medium">
                {CUSTOMER_360_EVENT_LABELS[event.kind] ?? event.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {event.title} · {formatDate(event.occurredAt)}
              </p>
              {event.description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {event.description}
                </p>
              ) : null}
            </li>
          )}
        />
      ) : null}

      {tab === "pendencias" ? (
        <ListOrEmpty
          items={data.pendencies ?? []}
          empty="Nenhuma pendência em aberto."
          render={(item) => (
            <li key={item.id} className="rounded-xl border border-white/[0.06] px-4 py-3">
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </li>
          )}
        />
      ) : null}

      {tab === "financeiro" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] px-4 py-3">
              <p className="text-xs text-muted-foreground">Receita gerada</p>
              <p className="text-lg font-medium">
                {formatCurrency(data.finance?.generatedRevenue ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] px-4 py-3">
              <p className="text-xs text-muted-foreground">Negócios fechados</p>
              <p className="text-lg font-medium">{data.finance?.closedDeals ?? 0}</p>
            </div>
          </div>
          <p className="text-sm font-medium">Produtos contratados</p>
          <p className="text-sm text-muted-foreground">
            {(data.finance?.products ?? []).join(", ") || "Nenhum produto registrado."}
          </p>
          <p className="text-sm font-medium">Comissões relacionadas</p>
          <ListOrEmpty
            items={data.finance?.commissions ?? []}
            empty="Nenhuma comissão vinculada."
            render={(item) => (
              <li key={item.id} className="rounded-xl border border-white/[0.06] px-4 py-3">
                <p className="font-medium">{item.dealTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(item.value)} · {item.percentage}% · {item.status}
                </p>
              </li>
            )}
          />
          <p className="text-sm font-medium">Histórico financeiro</p>
          <ListOrEmpty
            items={data.finance?.history ?? []}
            empty="Sem histórico financeiro."
            render={(item) => (
              <li key={`${item.kind}-${item.id}`} className="rounded-xl border border-white/[0.06] px-4 py-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.kind === "deal" ? "Receita" : "Comissão"} · {formatCurrency(item.amount)} ·{" "}
                  {formatDate(item.occurredAt)}
                </p>
              </li>
            )}
          />
        </div>
      ) : null}

      {tab === "leads" ? (
        <ListOrEmpty
          items={data.leads}
          empty="Nenhum lead vinculado."
          render={(lead) => (
            <li key={lead.id} className="rounded-xl border border-white/[0.06] px-4 py-3">
              <p className="font-medium">{lead.name}</p>
              <p className="text-xs text-muted-foreground">
                {lead.status} · {lead.owner ?? "Sem responsável"} ·{" "}
                {formatDate(lead.createdAt)}
              </p>
            </li>
          )}
        />
      ) : null}

      {tab === "deals" ? (
        <ListOrEmpty
          items={data.deals}
          empty="Nenhum negócio vinculado."
          render={(deal) => (
            <li key={deal.id} className="rounded-xl border border-white/[0.06] px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{deal.title}</p>
                <Badge variant="outline">
                  {businessUnitPipelineBadge(deal.businessUnit?.type)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {deal.businessUnit?.name ?? "Sem empresa"} ·{" "}
                {deal.pipelineName ?? "Pipeline"} · {deal.stage} ·{" "}
                {formatCurrency(deal.value)}
              </p>
              <p className="text-xs text-muted-foreground">
                Origem {deal.sourceType ?? "MANUAL"} · Score {deal.score ?? "—"} ·{" "}
                {deal.owner ?? "Sem responsável"}
              </p>
            </li>
          )}
        />
      ) : null}

      {tab === "policies" ? (
        <ListOrEmpty
          items={data.policies}
          empty="Nenhuma apólice vinculada."
          render={(policy) => (
            <li key={policy.id} className="rounded-xl border border-white/[0.06] px-4 py-3">
              <p className="font-medium">{policy.policyNumber}</p>
              <p className="text-xs text-muted-foreground">
                {policy.insurer} · {policy.productLine} ·{" "}
                {formatCurrency(policy.premiumValue)}
              </p>
            </li>
          )}
        />
      ) : null}

      {tab === "properties" ? (
        <ListOrEmpty
          items={data.properties}
          empty="Nenhum imóvel vinculado."
          render={(item) => (
            <li key={`${item.kind}-${item.id}`} className="rounded-xl border border-white/[0.06] px-4 py-3">
              <p className="font-medium">
                {item.kind === "opportunity"
                  ? opportunityTypeLabel(item.title)
                  : item.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.value != null ? formatCurrency(item.value) : "Sem valor"} ·{" "}
                {item.status}
              </p>
            </li>
          )}
        />
      ) : null}

      {tab === "communications" ? (
        <ListOrEmpty
          items={data.communications}
          empty="Nenhuma comunicação registrada."
          render={(row) => (
            <li key={row.id} className="rounded-xl border border-white/[0.06] px-4 py-3">
              <p className="font-medium">
                {row.purpose} · {row.direction}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.status} · {formatDate(row.createdAt)}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {row.content}
              </p>
            </li>
          )}
        />
      ) : null}

      {tab === "followUps" ? (
        <ListOrEmpty
          items={data.followUps}
          empty="Nenhum follow-up."
          render={(row) => (
            <li key={row.id} className="rounded-xl border border-white/[0.06] px-4 py-3">
              <p className="font-medium">
                {row.type} · {row.leadName}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.status} · {formatDate(row.scheduledAt)}
              </p>
            </li>
          )}
        />
      ) : null}

      {tab === "renewals" ? (
        <div className="space-y-4">
          {data.renewalBook ? (
            <div className="grid gap-3 sm:grid-cols-4">
              <Metric label="Valor total segurado" value={formatCurrency(data.renewalBook.totalInsured)} />
              <Metric label="Receita gerada" value={formatCurrency(data.renewalBook.generatedRevenue)} />
              <Metric label="Renovações anteriores" value={String(data.renewalBook.past)} />
              <Metric label="Renovações futuras" value={String(data.renewalBook.upcoming)} />
            </div>
          ) : null}
          <h3 className="text-sm font-medium">Histórico de apólices</h3>
          <ListOrEmpty
            items={data.policies}
            empty="Nenhuma apólice."
            render={(row) => (
              <li key={row.id} className="rounded-xl border border-white/[0.06] px-4 py-3">
                <p className="font-medium">
                  {row.productLine} · {row.insurer}
                </p>
                <p className="text-xs text-muted-foreground">
                  {row.policyNumber} · {formatCurrency(row.premiumValue)} ·{" "}
                  {formatDate(row.effectiveFrom)} → {formatDate(row.effectiveTo)}
                </p>
              </li>
            )}
          />
          <h3 className="text-sm font-medium">Fila de renovação</h3>
          <ListOrEmpty
            items={data.renewals}
            empty="Nenhuma renovação."
            render={(row) => (
              <li key={row.id} className="rounded-xl border border-white/[0.06] px-4 py-3">
                <p className="font-medium">{row.product}</p>
                <p className="text-xs text-muted-foreground">
                  {row.policyNumber} · {row.status} · vence {formatDate(row.renewalDate)}
                </p>
              </li>
            )}
          />
        </div>
      ) : null}

      {tab === "agenda" ? (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Atividades futuras</h3>
          <ListOrEmpty
            items={data.agenda?.upcoming ?? []}
            empty="Nenhuma atividade futura."
            render={(row) => (
              <li key={row.id} className="rounded-xl border border-white/[0.06] px-4 py-3">
                <p className="font-medium">{row.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {row.type} · {row.status} · {formatDate(row.at)}
                </p>
              </li>
            )}
          />
          <h3 className="text-sm font-medium">Atividades concluídas</h3>
          <ListOrEmpty
            items={data.agenda?.completed ?? []}
            empty="Nenhuma atividade concluída."
            render={(row) => (
              <li key={`done-${row.id}`} className="rounded-xl border border-white/[0.06] px-4 py-3">
                <p className="font-medium">{row.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {row.type} · {formatDate(row.at)}
                </p>
              </li>
            )}
          />
        </div>
      ) : null}

      {tab === "crossSell" ? (
        <div className="space-y-3">
          <ListOrEmpty
            items={data.opportunities}
            empty="Nenhuma oportunidade 360 gerada."
            render={(row) => (
              <li key={row.id} className="rounded-xl border border-white/[0.06] px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{opportunityTypeLabel(row.type)}</p>
                  <Badge variant="outline">
                    {OPPORTUNITY_SCORE_LABELS[row.score as OpportunityScore] ??
                      row.score}
                  </Badge>
                  <Badge variant="secondary">
                    {OPPORTUNITY_STATUS_LABELS[row.status as OpportunityStatus] ??
                      row.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {row.assignedUser?.name ?? "Sem responsável"} ·{" "}
                  {formatDate(row.createdAt)}
                </p>
              </li>
            )}
          />
          <ListOrEmpty
            items={data.crossSell}
            empty="Nenhuma oportunidade clássica de cross-sell."
            render={(row) => (
              <li key={row.id} className="rounded-xl border border-white/[0.06] px-4 py-3">
                <p className="font-medium">
                  {interestLabel(row.originCategory)} →{" "}
                  {interestLabel(row.suggestedCategory)}
                </p>
                <p className="text-xs text-muted-foreground">{row.status}</p>
              </li>
            )}
          />
        </div>
      ) : null}
    </div>
  )
}

function InfoBlock({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: typeof Phone
}) {
  return (
    <div>
      <p className="text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-sm">
        {Icon ? <Icon className="size-3.5 text-muted-foreground" /> : null}
        <span className="truncate">{value}</span>
      </p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] px-4 py-3">
      <p className="text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}

function ListOrEmpty<T>({
  items,
  empty,
  render,
}: {
  items: T[]
  empty: string
  render: (item: T) => ReactNode
}) {
  if (!items.length) {
    return <EmptyState title={empty} className="min-h-40" />
  }
  return <ul className="space-y-2">{items.map(render)}</ul>
}
