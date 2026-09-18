"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormSelect } from "@/components/design-system"
import {
  BUSINESS_UNIT_TYPE_LABELS,
  BUSINESS_UNIT_TYPES,
  type BusinessUnitType,
} from "@/lib/business-units/constants"
import {
  useBusinessUnits,
  useCreateBusinessUnit,
  useDeleteBusinessUnit,
  useUpdateBusinessUnit,
} from "@/lib/data-access/modules/business-units"

export function BusinessUnitsManager() {
  const { data = [], isLoading } = useBusinessUnits()
  const createUnit = useCreateBusinessUnit()
  const updateUnit = useUpdateBusinessUnit()
  const deleteUnit = useDeleteBusinessUnit()
  const [name, setName] = useState("")
  const [type, setType] = useState<BusinessUnitType>("INSURANCE")

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    await createUnit.mutateAsync({ name: name.trim(), type })
    setName("")
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="grid gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:grid-cols-[1fr_220px_auto]"
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome da unidade (ex.: Corretora Ávila)"
        />
        <FormSelect
          value={type}
          onChange={(event) =>
            setType(event.target.value as BusinessUnitType)
          }
          options={BUSINESS_UNIT_TYPES.map((item) => ({
            value: item,
            label: BUSINESS_UNIT_TYPE_LABELS[item],
          }))}
        />
        <Button type="submit" disabled={createUnit.isPending || !name.trim()}>
          Adicionar
        </Button>
      </form>

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando unidades…</p>
        ) : null}
        {data.map((unit) => (
          <div
            key={unit.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.06] px-4 py-3"
          >
            <div>
              <p className="font-medium">{unit.name}</p>
              <p className="text-xs text-muted-foreground">
                {BUSINESS_UNIT_TYPE_LABELS[unit.type]} · {unit.slug}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  updateUnit.mutate({
                    id: unit.id,
                    input: { isActive: !unit.isActive },
                  })
                }
              >
                {unit.isActive ? "Desativar" : "Ativar"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => deleteUnit.mutate(unit.id)}
              >
                Excluir
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
