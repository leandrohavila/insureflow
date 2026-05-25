/** Rótulo operacional: "Última interação há X dias". */
export function formatLastInteraction(iso: string | null | undefined): string {
  if (!iso) return "Sem interação registrada"

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "Sem interação registrada"

  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return "Última interação hoje"
  if (diffDays === 1) return "Última interação ontem"
  return `Última interação há ${diffDays} dias`
}

/** Versão compacta para cards do Kanban. */
export function formatLastInteractionShort(iso: string | null | undefined): string {
  const full = formatLastInteraction(iso)
  if (full === "Sem interação registrada") return "—"
  if (full === "Última interação hoje") return "Hoje"
  if (full === "Última interação ontem") return "Ontem"
  const match = full.match(/há (\d+) dias/)
  return match ? `${match[1]}d` : full
}
