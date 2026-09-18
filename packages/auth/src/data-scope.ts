import type { DataScope, SessionPayload } from "./types"

/** Exibe filtro "Meus leads" apenas quando o escopo permite refinamento local. */
export function showMineLeadsFilter(
  session: Pick<SessionPayload, "dataScope"> | null | undefined,
): boolean {
  const scope = session?.dataScope
  return scope === "own" || scope === "team"
}

export function isTenantWideScope(
  session: Pick<SessionPayload, "dataScope"> | null | undefined,
): boolean {
  return session?.dataScope === "tenant"
}

export function isSharedOnlyScope(
  session: Pick<SessionPayload, "dataScope"> | null | undefined,
): boolean {
  return session?.dataScope === "shared"
}
