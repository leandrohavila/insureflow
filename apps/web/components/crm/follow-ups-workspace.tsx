"use client"

import { useState } from "react"

import { FormSelect } from "@/components/design-system"
import { Button } from "@/components/ui/button"
import {
  FOLLOW_UP_STATUS_LABELS,
  FOLLOW_UP_TYPE_LABELS,
} from "@/lib/business-units/constants"
import { useBusinessUnits } from "@/lib/data-access/modules/business-units"
import {
  useLeadFollowUps,
  useUpdateLeadFollowUp,
  type LeadFollowUpWindow,
} from "@/lib/data-access/modules/lead-follow-ups"

const WINDOWS: { id: LeadFollowUpWindow; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "overdue", label: "Atrasados" },
  { id: "next7", label: "Próximos 7 dias" },
]

export function FollowUpsWorkspace() {
  const [windowFilter, setWindowFilter] = useState<LeadFollowUpWindow>("today")
  const [businessUnitId, setBusinessUnitId] = useState("")
  const { data: units = [] } = useBusinessUnits()
  const query = useLeadFollowUps({
    window: windowFilter,
    businessUnitId: businessUnitId || undefined,
  })
  const updateFollowUp = useUpdateLeadFollowUp()
  const items = query.data?.data ?? []
  const metrics = query.data?.metrics

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Pendentes" value={metrics?.pending ?? 0} />
        <Metric label="Atrasados" value={metrics?.overdue ?? 0} tone="danger" />
        <Metric label="Concluídos" value={metrics?.completed ?? 0} />
      </div>

      <div className="flex flex-wrap gap-2">
        {WINDOWS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={windowFilter === item.id ? "default" : "outline"}
            onClick={() => setWindowFilter(item.id)}
          >
            {item.label}
          </Button>
        ))}
        <FormSelect
          className="w-52"
          value={businessUnitId}
          onChange={(event) => setBusinessUnitId(event.target.value)}
          options={[
            { value: "", label: "Todas as unidades" },
            ...units.map((unit) => ({ value: unit.id, label: unit.name })),
          ]}
        />
      </div>

      <div className="space-y-2">
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando follow-ups…</p>
        ) : null}
        {items.length === 0 && !query.isLoading ? (
          <p className="text-sm text-muted-foreground">
            Nenhum follow-up neste filtro.
          </p>
        ) : null}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.06] px-4 py-3"
          >
            <div>
              <p className="font-medium">{item.lead?.name ?? "Lead"}</p>
              <p className="text-xs text-muted-foreground">
                {FOLLOW_UP_TYPE_LABELS[item.type]} ·{" "}
                {new Date(item.scheduledAt).toLocaleString("pt-BR")} ·{" "}
                {FOLLOW_UP_STATUS_LABELS[item.status]}
              </p>
            </div>
            {item.status === "PENDING" ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    updateFollowUp.mutate({
                      id: item.id,
                      input: { status: "COMPLETED" },
                    })
                  }
                >
                  Concluir
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    updateFollowUp.mutate({
                      id: item.id,
                      input: { status: "CANCELLED" },
                    })
                  }
                >
                  Cancelar
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: "danger"
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
      <p
        className={
          tone === "danger"
            ? "text-lg font-semibold text-destructive"
            : "text-lg font-semibold"
        }
      >
        {value}
      </p>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  )
}
