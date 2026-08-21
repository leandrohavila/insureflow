import type { ProfilerOnRenderCallback } from "react"

type Bug010Event = {
  atMs: number
  label: string
  traceId: string
  data?: Record<string, unknown>
}

type Bug010State = {
  traceId: string
  startedAt: number
  events: Bug010Event[]
}

declare global {
  interface Window {
    __BUG010_LEAD_CREATE_TIMELINE__?: Bug010State
  }
}

function activeState() {
  if (typeof window === "undefined") return null
  return window.__BUG010_LEAD_CREATE_TIMELINE__ ?? null
}

export function bug010LeadCreateStart(traceId: string) {
  if (typeof window === "undefined") return
  window.__BUG010_LEAD_CREATE_TIMELINE__ = {
    traceId,
    startedAt: performance.now(),
    events: [],
  }
  bug010LeadCreateLog("POST iniciado", { traceId }, traceId)
}

export function bug010LeadCreateLog(
  label: string,
  data: Record<string, unknown> = {},
  traceId?: string,
) {
  const state = activeState()
  if (!state) return
  const eventTraceId = traceId ?? state.traceId
  if (eventTraceId !== state.traceId) return

  const event: Bug010Event = {
    atMs: Number((performance.now() - state.startedAt).toFixed(2)),
    label,
    traceId: eventTraceId,
    data,
  }
  state.events.push(event)
  console.info("[BUG010.1][frontend]", event)
}

export function bug010LeadCreateProfiler(
  label: string,
): ProfilerOnRenderCallback {
  return (_id, phase, actualDuration, baseDuration, startTime, commitTime) => {
    bug010LeadCreateLog(`Render ${label}`, {
      phase,
      actualDurationMs: Number(actualDuration.toFixed(2)),
      baseDurationMs: Number(baseDuration.toFixed(2)),
      renderStartOffsetMs: Number(startTime.toFixed(2)),
      commitTimeMs: Number(commitTime.toFixed(2)),
    })
  }
}

export function bug010LeadCreateTimeline() {
  return activeState()?.events ?? []
}

export function bug010LeadCreateTraceId() {
  return activeState()?.traceId ?? null
}
