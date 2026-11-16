"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { FormSelect } from "@/components/design-system"
import { SectionPanel } from "@/components/crm/primitives"
import {
  BUSINESS_UNIT_TYPE_LABELS,
  INTEREST_CATEGORY_LABELS,
  type InterestCategory,
} from "@/lib/business-units/constants"
import { useBusinessUnits } from "@/lib/data-access/modules/business-units"
import {
  useLinkLeadBusinessUnit,
  useUnlinkLeadBusinessUnit,
  useUpdateLead,
  type Lead,
} from "@/lib/data-access/modules/leads"
import {
  incompatibleInterestCategories,
  interestsForBusinessUnitTypes,
} from "@/lib/leads/lead-intent"

type LeadUnitsSectionProps = {
  lead: Lead
}

export function LeadUnitsSection({ lead }: LeadUnitsSectionProps) {
  const { data: units = [] } = useBusinessUnits()
  const linkUnit = useLinkLeadBusinessUnit()
  const unlinkUnit = useUnlinkLeadBusinessUnit()
  const updateLead = useUpdateLead()
  const [unlinkNotice, setUnlinkNotice] = useState<string | null>(null)
  const linked = [
    ...(lead.businessUnits ?? []),
    ...(lead.businessUnit &&
    !(lead.businessUnits ?? []).some((unit) => unit.id === lead.businessUnit?.id)
      ? [lead.businessUnit]
      : []),
  ]
  const linkedIds = new Set(linked.map((item) => item.id))
  const available = units.filter((unit) => unit.isActive && !linkedIds.has(unit.id))
  const selected = lead.interestCategories ?? []
  const availableInterests = interestsForBusinessUnitTypes(
    linked.map((unit) => unit.type),
  )
  const incompatible = incompatibleInterestCategories(selected, availableInterests)

  function toggleCategory(category: InterestCategory) {
    if (!availableInterests.includes(category)) return
    const next = selected.includes(category)
      ? selected.filter((item) => item !== category)
      : [...selected, category]
    updateLead.mutate({ id: lead.id, input: { interestCategories: next } })
  }

  function removeIncompatible() {
    updateLead.mutate({
      id: lead.id,
      input: {
        interestCategories: selected.filter(
          (category) => !incompatible.includes(category),
        ),
      },
    })
  }

  return (
    <div className="space-y-4">
      <SectionPanel title="Unidades de negócio">
        <p className="mb-3 text-sm text-muted-foreground">
          O mesmo lead pode atender corretora e imobiliária, sem cadastro duplicado.
        </p>
        <div className="flex flex-wrap gap-2">
          {(lead.businessUnits ?? []).map((unit) => (
            <span
              key={unit.id}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-3 py-1 text-xs"
            >
              {unit.name}
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const remaining = interestsForBusinessUnitTypes(
                    linked
                      .filter((item) => item.id !== unit.id)
                      .map((item) => item.type),
                  )
                  const blocked = incompatibleInterestCategories(selected, remaining)
                  if (blocked.length > 0) {
                    setUnlinkNotice(
                      `Remova antes de desvincular ${unit.name}: ${blocked
                        .map((category) => INTEREST_CATEGORY_LABELS[category])
                        .join(", ")}.`,
                    )
                    return
                  }
                  setUnlinkNotice(null)
                  unlinkUnit.mutate({
                    leadId: lead.id,
                    businessUnitId: unit.id,
                  })
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {available.length > 0 ? (
          <div className="mt-3 flex gap-2">
            <FormSelect
              className="max-w-xs"
              defaultValue=""
              onChange={(event) => {
                const businessUnitId = event.target.value
                if (!businessUnitId) return
                linkUnit.mutate({ leadId: lead.id, businessUnitId })
                event.currentTarget.value = ""
              }}
              options={[
                { value: "", label: "Adicionar unidade" },
                ...available.map((unit) => ({
                  value: unit.id,
                  label: `${unit.name} · ${BUSINESS_UNIT_TYPE_LABELS[unit.type]}`,
                })),
              ]}
            />
          </div>
        ) : null}
      </SectionPanel>

      <SectionPanel title="Interesses">
        {unlinkNotice ? (
          <p className="mb-3! text-sm text-[var(--avila-action-warning)]">
            {unlinkNotice}
          </p>
        ) : null}
        {incompatible.length > 0 ? (
          <div className="mb-3! flex flex-col gap-2">
            <p className="text-sm text-[var(--avila-action-warning)]">
              Qualificações fora das unidades vinculadas:{" "}
              {incompatible
                .map((category) => INTEREST_CATEGORY_LABELS[category])
                .join(", ")}
              .
            </p>
            <Button type="button" variant="warning" size="sm" className="w-fit" onClick={removeIncompatible}>
              Remover qualificações incompatíveis
            </Button>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {availableInterests.map((category) => {
            const active = selected.includes(category)
            return (
              <Button
                key={category}
                type="button"
                size="sm"
                variant={active ? "primary" : "outline"}
                onClick={() => toggleCategory(category)}
              >
                {INTEREST_CATEGORY_LABELS[category]}
              </Button>
            )
          })}
        </div>
      </SectionPanel>
    </div>
  )
}
