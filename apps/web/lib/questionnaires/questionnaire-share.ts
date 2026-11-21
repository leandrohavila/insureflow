export function questionnaireCanShare(status: string) {
  return (
    status === "draft" || status === "in_progress" || status === "pending_client"
  )
}

export function questionnairePublicPath(token: string) {
  return `/questionario/${token}`
}

type ShareTiming = {
  status: string
  expiresAt: string
  createdAt: string
}

export function currentQuestionnaireShare<T extends ShareTiming>(shares: readonly T[]) {
  const now = Date.now()
  const active = shares.filter((share) => {
    if (share.status !== "active") return false
    const expiresAt = Date.parse(share.expiresAt)
    return Number.isFinite(expiresAt) && expiresAt > now
  })
  active.sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  )
  return active[0] ?? null
}

export function questionnaireShareStatusLabel(status: string) {
  if (status === "active") return "Vigente"
  if (status === "revoked") return "Revogado"
  if (status === "expired") return "Expirado"
  return status
}
