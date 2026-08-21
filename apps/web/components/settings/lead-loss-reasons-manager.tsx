"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useCreateLeadLossReason,
  useDeleteLeadLossReason,
  useLeadLossReasons,
  useUpdateLeadLossReason,
} from "@/lib/data-access/modules/lead-loss-reasons"

export function LeadLossReasonsManager() {
  const { data = [], isLoading } = useLeadLossReasons()
  const createReason = useCreateLeadLossReason()
  const updateReason = useUpdateLeadLossReason()
  const deleteReason = useDeleteLeadLossReason()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [days, setDays] = useState("30")

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    await createReason.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      reactivationDays: Number(days) || 30,
    })
    setName("")
    setDescription("")
    setDays("30")
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="grid gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:grid-cols-[1fr_1fr_120px_auto]"
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Motivo (ex.: Sem orçamento)"
        />
        <Input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Descrição"
        />
        <Input
          type="number"
          min={1}
          max={365}
          value={days}
          onChange={(event) => setDays(event.target.value)}
          placeholder="Dias"
        />
        <Button type="submit" disabled={createReason.isPending || !name.trim()}>
          Adicionar
        </Button>
      </form>

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando motivos…</p>
        ) : null}
        {data.map((reason) => (
          <div
            key={reason.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.06] px-4 py-3"
          >
            <div>
              <p className="font-medium">{reason.name}</p>
              <p className="text-xs text-muted-foreground">
                {reason.description || "Sem descrição"} · reativação{" "}
                {reason.reactivationEnabled
                  ? `${reason.reactivationDays}d / ${reason.maxAttempts} tentativas`
                  : "desligada"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  updateReason.mutate({
                    id: reason.id,
                    input: { isActive: !reason.isActive },
                  })
                }
              >
                {reason.isActive ? "Desativar" : "Ativar"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => deleteReason.mutate(reason.id)}
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
