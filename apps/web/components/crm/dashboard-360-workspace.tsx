"use client"

import { useMemo, useState } from "react"
import {
  Layers,
  Percent,
  RefreshCw,
  Target,
  UserCheck,
  UserMinus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import {
  CrmFilterChip,
  CrmFilterGroup,
  crmFilterCardClass,
  crmFilterFieldClass,
  crmStatCardClass,
} from "@/components/crm/crm-controls"
import { ErrorState, FilterSelect, StatCard } from "@/components/design-system"
import type { StatCardTone } from "@/components/design-system"
import { useBusinessUnits } from "@/lib/data-access/modules/business-units"
import { useDashboard360 } from "@/lib/data-access/modules/customer-360"
import { formatCurrency } from "@/lib/data-access/modules/crm"
import { getErrorMessage } from "@/lib/data-access"
import { cn } from "@/lib/utils"

const PERIODS = [
  { id: "7", label: "7 dias" },
  { id: "30", label: "30 dias" },
  { id: "90", label: "90 dias" },
] as const

function periodRange(days: string) {
  const to = new Date()
  const from = new Date(to.getTime() - Number(days) * 86_400_000)
  return { from: from.toISOString(), to: to.toISOString() }
}

type Indicator = {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: StatCardTone
}

export function Dashboard360Workspace() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("30")
  const [businessUnitId, setBusinessUnitId] = useState("")
  const [userId, setUserId] = useState("")
  const { data: units = [] } = useBusinessUnits()
  const range = useMemo(() => periodRange(period), [period])
  const query = useDashboard360({
    ...range,
    businessUnitId: businessUnitId || undefined,
    userId: userId || undefined,
  })
  const metrics = query.data

  const indicators: Indicator[] = [
    {
      label: "Clientes ativos",
      value: metrics?.activeCustomers ?? 0,
      icon: Users,
      tone: "success",
    },
    {
      label: "Clientes inativos",
      value: metrics?.inactiveCustomers ?? 0,
      icon: UserMinus,
    },
    {
      label: "Clientes reativados",
      value: metrics?.reactivatedCustomers ?? 0,
      icon: UserCheck,
    },
    {
      label: "Receita prevista",
      value: formatCurrency(metrics?.predictedRevenue ?? 0),
      icon: Wallet,
      tone: "primary",
    },
    {
      label: "Receita renovação",
      value: formatCurrency(metrics?.renewalRevenue ?? 0),
      icon: RefreshCw,
    },
    {
      label: "Receita cross-sell",
      value: formatCurrency(metrics?.crossSellRevenue ?? 0),
      icon: Layers,
    },
    {
      label: "Oportunidades abertas",
      value: metrics?.openOpportunities ?? 0,
      icon: Target,
    },
    {
      label: "Taxa de conversão",
      value: `${metrics?.conversionRate ?? 0}%`,
      icon: Percent,
      tone: "success",
    },
  ]

  return (
    <>
      <section
        className={cn(crmFilterCardClass, "flex min-w-0 flex-col gap-3")}
        aria-label="Filtros do Dashboard 360"
      >
        <CrmFilterGroup label="Período">
          {PERIODS.map((item) => (
            <CrmFilterChip
              key={item.id}
              pressed={period === item.id}
              onClick={() => setPeriod(item.id)}
            >
              {item.label}
            </CrmFilterChip>
          ))}
        </CrmFilterGroup>
        <div className="flex min-w-0 flex-wrap items-end gap-[var(--if-layout-control-gap)] border-t border-[#D6CFC4] pt-3">
          <FilterSelect
            showLabel
            label="Empresa"
            containerClassName="gap-2"
            className={cn(crmFilterFieldClass, "min-w-[13rem]")}
            value={businessUnitId}
            onChange={(event) => setBusinessUnitId(event.target.value)}
            options={[
              { value: "", label: "Todas as empresas" },
              ...units.map((unit) => ({ value: unit.id, label: unit.name })),
            ]}
          />
          <FilterSelect
            showLabel
            label="Corretor"
            containerClassName="gap-2"
            className={cn(crmFilterFieldClass, "min-w-[13rem]")}
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            options={[
              { value: "", label: "Todos os corretores" },
              ...(metrics?.brokers ?? []).map((user) => ({
                value: user.id,
                label: user.name,
              })),
            ]}
          />
        </div>
      </section>

      {query.isError ? (
        <ErrorState
          title="Não foi possível carregar o Dashboard 360."
          description={getErrorMessage(
            query.error,
            "Erro ao carregar os indicadores.",
          )}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <section
          className="grid min-w-0 grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4"
          aria-label="Indicadores do Dashboard 360"
        >
          {indicators.map((indicator) => (
            <StatCard
              key={indicator.label}
              surface="light"
              density="compact"
              className={crmStatCardClass}
              label={indicator.label}
              value={indicator.value}
              icon={indicator.icon}
              tone={indicator.tone}
              loading={query.isLoading}
            />
          ))}
        </section>
      )}
    </>
  )
}
