/** Logs de lifecycle DnD — ativo apenas em dev com NEXT_PUBLIC_PIPELINE_DND_DEBUG=1 */
export const pipelineDndDebugEnabled =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_PIPELINE_DND_DEBUG === "1"

export function logPipelineDnd(
  phase: string,
  payload?: Record<string, unknown>,
) {
  if (!pipelineDndDebugEnabled) return
  console.debug(`[pipeline-dnd] ${phase}`, payload ?? "")
}

export function logPipelineCollision(payload: Record<string, unknown>) {
  if (!pipelineDndDebugEnabled) return
  console.table(payload)
}

export function logPipelineDragOver(payload: Record<string, unknown>) {
  if (!pipelineDndDebugEnabled) return
  console.table(payload)
}
