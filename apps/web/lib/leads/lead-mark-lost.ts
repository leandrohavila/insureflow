export type MarkLostLeadRef = {
  status: string
  dealId?: string | null
}

export type MarkLostReasonRef = {
  id: string
  isActive: boolean
}

export type MarkLeadLostInput = {
  status: "lost"
  lossReasonId: string
}

/** Lead convertido ou já ligado a um negócio segue a regra atual da ficha. */
export function canMarkLeadAsLost(
  lead: MarkLostLeadRef | null | undefined,
): boolean {
  if (!lead) return false
  if (lead.dealId) return false
  if (lead.status === "converted" || lead.status === "lost") return false
  return true
}

export function resolveActiveLossReason<T extends MarkLostReasonRef>(
  reasons: readonly T[],
  reasonId: string,
): T | null {
  const id = reasonId.trim()
  if (!id) return null
  return reasons.find((reason) => reason.id === id && reason.isActive) ?? null
}

/** Só o status e o motivo seguem no PATCH. Sem motivo, não há confirmação. */
export function buildMarkLeadLostInput(reasonId: string): MarkLeadLostInput | null {
  const id = reasonId.trim()
  if (!id) return null
  return { status: "lost", lossReasonId: id }
}
