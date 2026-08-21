"use client"

import { useState } from "react"

import { FormSelect } from "@/components/design-system"
import { Button } from "@/components/ui/button"
import {
  COMMERCIAL_RENEWAL_STATUS_LABELS,
  COMMERCIAL_RENEWAL_STATUSES,
  type CommercialRenewalStatus,
} from "@/lib/business-units/constants"
import {
  usePolicyRenewals,
  useUpdatePolicyRenewal,
} from "@/lib/data-access/modules/policy-renewals"

export function RenewalsWorkspace() {
  const [status, setStatus] = useState<CommercialRenewalStatus | "">("")
  const query = usePolicyRenewals(status || undefined)
  const updateRenewal = useUpdatePolicyRenewal()
  const items = query.data ?? []

  return (
    <div className="space-y-6">
      <FormSelect
        className="max-w-xs"
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

      <div className="space-y-2">
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando renovações…</p>
        ) : null}
        {items.length === 0 && !query.isLoading ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma renovação na fila comercial.
          </p>
        ) : null}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.06] px-4 py-3"
          >
            <div>
              <p className="font-medium">
                {item.customer?.name ?? "Cliente"} · {item.policyNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.product} · {item.insurer} · vence{" "}
                {new Date(item.renewalDate).toLocaleDateString("pt-BR")} ·{" "}
                {COMMERCIAL_RENEWAL_STATUS_LABELS[item.status]}
              </p>
            </div>
            {item.status !== "RENEWED" && item.status !== "LOST" ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    updateRenewal.mutate({
                      id: item.id,
                      input: { status: "RENEWED" },
                    })
                  }
                >
                  Converter
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    updateRenewal.mutate({
                      id: item.id,
                      input: { status: "LOST" },
                    })
                  }
                >
                  Perdida
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
