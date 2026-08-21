"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormSelect, StatCard } from "@/components/design-system"
import {
  REACTIVATION_CHANNEL_LABELS,
  REACTIVATION_CHANNELS,
  type ReactivationChannel,
} from "@/lib/business-units/constants"
import {
  useReactivationMetrics,
  useReactivationSettings,
  useRunReactivation,
  useUpdateReactivationSettings,
} from "@/lib/data-access/modules/automation"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}

export function LeadReactivationWorkspace() {
  const { data: settings, isLoading } = useReactivationSettings()
  const { data: metrics } = useReactivationMetrics()
  const updateSettings = useUpdateReactivationSettings()
  const runNow = useRunReactivation()
  const [enabled, setEnabled] = useState(false)
  const [idleDays, setIdleDays] = useState(30)
  const [maxAttempts, setMaxAttempts] = useState(3)
  const [channel, setChannel] = useState<ReactivationChannel>("WHATSAPP")

  useEffect(() => {
    if (!settings) return
    setEnabled(settings.enabled)
    setIdleDays(settings.idleDays)
    setMaxAttempts(settings.maxAttempts)
    setChannel(settings.channel)
  }, [settings])

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    await updateSettings.mutateAsync({
      enabled,
      idleDays,
      maxAttempts,
      channel,
    })
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Leads reativados"
          value={metrics?.leadsReactivated ?? 0}
          density="compact"
        />
        <StatCard
          label="Reativações enviadas"
          value={metrics?.messagesSent ?? 0}
          density="compact"
        />
        <StatCard
          label="Taxa de retorno"
          value={`${metrics?.returnRate ?? 0}%`}
          density="compact"
        />
        <StatCard
          label="Taxa de conversão"
          value={`${metrics?.conversionRate ?? 0}%`}
          density="compact"
        />
        <StatCard
          label="Receita por reativação"
          value={formatCurrency(metrics?.revenueFromReactivation ?? 0)}
          density="compact"
        />
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          Ativar reativação automática
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span>Dias sem contato</span>
            <Input
              type="number"
              min={1}
              max={365}
              value={idleDays}
              onChange={(event) => setIdleDays(Number(event.target.value))}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Máximo de tentativas</span>
            <Input
              type="number"
              min={1}
              max={20}
              value={maxAttempts}
              onChange={(event) => setMaxAttempts(Number(event.target.value))}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Canal</span>
            <FormSelect
              value={channel}
              onChange={(event) =>
                setChannel(event.target.value as ReactivationChannel)
              }
              options={REACTIVATION_CHANNELS.map((item) => ({
                value: item,
                label: REACTIVATION_CHANNEL_LABELS[item],
              }))}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={updateSettings.isPending || isLoading}>
            Salvar configuração
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={runNow.isPending}
            onClick={() => runNow.mutate()}
          >
            Executar agora
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          O job diário `LeadReactivationJob` roda às 07:00 (horário de Brasília)
          e envia a mensagem, registra a atividade e agenda a próxima tentativa.
        </p>
      </form>
    </div>
  )
}
