"use client"

import { Button } from "@/components/ui/button"
import { FormSelect } from "@/components/design-system"
import { SectionPanel } from "@/components/crm/primitives"
import {
  BUSINESS_UNIT_TYPE_LABELS,
  INTEREST_CATEGORY_LABELS,
  INTEREST_CATEGORIES,
  type InterestCategory,
} from "@/lib/business-units/constants"
import { useBusinessUnits } from "@/lib/data-access/modules/business-units"
import {
  useLinkLeadBusinessUnit,
  useUnlinkLeadBusinessUnit,
  useUpdateLead,
  type Lead,
} from "@/lib/data-access/modules/leads"

type LeadUnitsSectionProps = {
  lead: Lead
}

export function LeadUnitsSection({ lead }: LeadUnitsSectionProps) {
  const { data: units = [] } = useBusinessUnits()
  const linkUnit = useLinkLeadBusinessUnit()
  const unlinkUnit = useUnlinkLeadBusinessUnit()
  const updateLead = useUpdateLead()
  const linkedIds = new Set((lead.businessUnits ?? []).map((item) => item.id))
  const available = units.filter((unit) => unit.isActive && !linkedIds.has(unit.id))

  function toggleCategory(category: InterestCategory) {
    const current = lead.interestCategories ?? []
    const next = current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category]
    updateLead.mutate({ id: lead.id, input: { interestCategories: next } })
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
                onClick={() =>
                  unlinkUnit.mutate({
                    leadId: lead.id,
                    businessUnitId: unit.id,
                  })
                }
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
        <div className="flex flex-wrap gap-2">
          {INTEREST_CATEGORIES.map((category) => {
            const active = (lead.interestCategories ?? []).includes(category)
            return (
              <Button
                key={category}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
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
