"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { PermissionGate } from "@/components/auth/permission-gate"
import { Button, buttonVariants } from "@/components/ui/button"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { FormSelect } from "@/components/design-system"
import {
  COMMERCIAL_RENEWAL_STATUS_LABELS,
  COMMERCIAL_RENEWAL_STATUSES,
  type CommercialRenewalStatus,
} from "@/lib/business-units/constants"
import { CRM_PAGE_SHELL } from "@/lib/crm/crm-layout-classes"
import {
  useCreateRenewalActivity,
  useCreateRenewalDeal,
  usePolicyRenewalPortfolio,
  useUpdatePolicyRenewal,
} from "@/lib/data-access/modules/policy-renewals"
import { cn } from "@/lib/utils"

const DUE_OPTIONS = [
  { value: "", label: "Todos os prazos" },
  { value: "30", label: "Vence em 30 dias" },
  { value: "60", label: "Vence em 60 dias" },
  { value: "90", label: "Vence em 90 dias" },
  { value: "custom", label: "Período personalizado" },
]

const PORTFOLIO_STATUS_LABELS: Record<CommercialRenewalStatus, string> = {
  ACTIVE: "Pendente",
  RENEWAL_PENDING: "Pendente",
  RENEWAL_IN_PROGRESS: "Em Cotação",
  RENEWED: "Renovado",
  LOST: "Perdido",
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return parsed.toLocaleDateString("pt-BR")
}

export function RenewalPortfolioWorkspace() {
  const router = useRouter()
  const [due, setDue] = useState("")
  const [status, setStatus] = useState<CommercialRenewalStatus | "">("")
  const [product, setProduct] = useState("")
  const [insurer, setInsurer] = useState("")
  const [company, setCompany] = useState("")
  const [brokerId, setBrokerId] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const filters = useMemo(
    () => ({
      status: status || undefined,
      assignedUserId: brokerId || undefined,
      product: product || undefined,
      insurer: insurer || undefined,
      company: company || undefined,
      dueInDays: due && due !== "custom" ? Number(due) : undefined,
      from: due === "custom" && from ? from : undefined,
      to: due === "custom" && to ? to : undefined,
      limit: 100,
    }),
    [status, product, insurer, company, due, from, to, brokerId],
  )
  const query = usePolicyRenewalPortfolio(filters)
  const update = useUpdatePolicyRenewal()
  const createDeal = useCreateRenewalDeal()
  const createActivity = useCreateRenewalActivity()
  const items = query.data ?? []

  return (
    <div className={CRM_PAGE_SHELL}>
      <CrmPageHeader
        badge="CRM"
        title="Carteira de renovação"
        description="Apólices próximas do vencimento, com ações comerciais."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <FormSelect
          className="w-48"
          value={due}
          onChange={(event) => setDue(event.target.value)}
          options={DUE_OPTIONS}
        />
        <FormSelect
          className="w-44"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as CommercialRenewalStatus | "")
          }
          options={[
            { value: "", label: "Todos os status" },
            ...COMMERCIAL_RENEWAL_STATUSES.map((item) => ({
              value: item,
              label: COMMERCIAL_RENEWAL_STATUS_LABELS[item],
            })),
          ]}
        />
        <input
          className="h-9 rounded-md border border-white/10 bg-transparent px-3 text-sm"
          placeholder="Produto"
          value={product}
          onChange={(event) => setProduct(event.target.value)}
        />
        <input
          className="h-9 rounded-md border border-white/10 bg-transparent px-3 text-sm"
          placeholder="Seguradora"
          value={insurer}
          onChange={(event) => setInsurer(event.target.value)}
        />
        <input
          className="h-9 rounded-md border border-white/10 bg-transparent px-3 text-sm"
          placeholder="Empresa"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
        <input
          className="h-9 rounded-md border border-white/10 bg-transparent px-3 text-sm"
          placeholder="ID do corretor"
          value={brokerId}
          onChange={(event) => setBrokerId(event.target.value)}
        />
        {due === "custom" ? (
          <>
            <input
              type="date"
              className="h-9 rounded-md border border-white/10 bg-transparent px-3 text-sm"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
            <input
              type="date"
              className="h-9 rounded-md border border-white/10 bg-transparent px-3 text-sm"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Produto</th>
              <th className="px-3 py-2">Seguradora</th>
              <th className="px-3 py-2">Número Apólice</th>
              <th className="px-3 py-2">Início</th>
              <th className="px-3 py-2">Fim</th>
              <th className="px-3 py-2">Dias</th>
              <th className="px-3 py-2">Responsável</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading ? (
              <tr>
                <td className="px-3 py-6 text-muted-foreground" colSpan={10}>
                  Carregando carteira…
                </td>
              </tr>
            ) : null}
            {!query.isLoading && items.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-muted-foreground" colSpan={10}>
                  Nenhuma renovação no filtro atual. Importe clientes com apólice
                  em Importações.
                </td>
              </tr>
            ) : null}
            {items.map((item) => (
              <tr key={item.id} className="border-t border-white/[0.04]">
                <td className="px-3 py-2">{item.customer?.name ?? "—"}</td>
                <td className="px-3 py-2">{item.product}</td>
                <td className="px-3 py-2">{item.insurer}</td>
                <td className="px-3 py-2">{item.policyNumber}</td>
                <td className="px-3 py-2">{formatDate(item.startDate)}</td>
                <td className="px-3 py-2">{formatDate(item.endDate)}</td>
                <td className="px-3 py-2">{item.daysUntil ?? "—"}</td>
                <td className="px-3 py-2">{item.assignedUser?.name ?? "—"}</td>
                <td className="px-3 py-2">
                  {PORTFOLIO_STATUS_LABELS[item.status] ??
                    COMMERCIAL_RENEWAL_STATUS_LABELS[item.status]}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {item.customerId ? (
                      <Link
                        href={`/crm/customer-360/${item.customerId}`}
                        className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
                      >
                        360
                      </Link>
                    ) : null}
                    <PermissionGate permission="crm:manage">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          createDeal.mutate(item.id, {
                            onSuccess: (row) => {
                              if (row.dealId) {
                                router.push(`/crm/negocios?dealId=${row.dealId}`)
                              }
                            },
                          })
                        }
                      >
                        Deal
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => createActivity.mutate(item.id)}
                      >
                        Atividade
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          createDeal.mutate(item.id, {
                            onSuccess: (row) => {
                              if (row.dealId) {
                                router.push(`/crm/negocios?dealId=${row.dealId}`)
                              }
                            },
                          })
                        }
                      >
                        Pipeline
                      </Button>
                      {item.status !== "RENEWED" && item.status !== "LOST" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            update.mutate({
                              id: item.id,
                              input: { status: "RENEWED" },
                            })
                          }
                        >
                          Renovado
                        </Button>
                      ) : null}
                    </PermissionGate>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
