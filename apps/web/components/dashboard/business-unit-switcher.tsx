"use client"

import { Building2 } from "lucide-react"

import { FormSelect } from "@/components/design-system"
import {
  useBusinessUnitContext,
  useUpdateBusinessUnitContext,
} from "@/lib/data-access/modules/business-units"

const ALL_VALUE = "__all__"

export function BusinessUnitSwitcher() {
  const context = useBusinessUnitContext()
  const update = useUpdateBusinessUnitContext()
  const data = context.data
  const units = data?.units ?? []
  const showAll = Boolean(data?.canViewAll || units.length > 1)
  const current =
    data?.currentBusinessUnitId ??
    (showAll ? ALL_VALUE : (units[0]?.id ?? ALL_VALUE))

  if (context.isLoading && !data) {
    return (
          <div className="h-9 w-full max-w-[240px] animate-pulse rounded-[var(--if-radius-md)] bg-white/[0.04]" />
    )
  }

  if (!units.length && !data?.canViewAll) {
    return null
  }

  return (
    <label className="flex w-full min-w-0 max-w-[240px] items-center gap-2 overflow-hidden">
      <Building2 className="size-3.5 shrink-0 text-[#DEAE5D]" />
      <FormSelect
        aria-label="Empresa ativa"
        className="h-9 w-full min-w-0 truncate border-[#C09048]/20 bg-white/[0.03] text-[13px] focus-visible:border-[#C09048]/40 focus-visible:ring-[#C09048]/20"

        disabled={update.isPending || (units.length === 0 && !showAll)}
        value={current || ALL_VALUE}
        onChange={(event) => {
          const value = event.target.value
          update.mutate(value === ALL_VALUE ? null : value)
        }}
        options={[
          ...(showAll ? [{ value: ALL_VALUE, label: "Todas" }] : []),
          ...units.map((unit) => ({
            value: unit.id,
            label: unit.name,
          })),
        ]}
      />
    </label>
  )
}
