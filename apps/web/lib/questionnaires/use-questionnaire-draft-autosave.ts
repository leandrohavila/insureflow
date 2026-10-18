"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  leadSubmissionListFilters,
  useCreateQuestionnaireSubmission,
  useQuestionnaireSubmissions,
  useUpdateQuestionnaireSubmission,
  type JsonObject,
  type QuestionnaireField,
} from "@/lib/data-access/modules/questionnaires"

import {
  AUTOSAVE_LOG,
  buildDraftPayloadHash,
  hashDraftAnswersPayload,
  logAutosave,
} from "./questionnaire-draft-payload"
import { buildDraftAnswers } from "./questionnaire-field-validation"
import { answersToFormState, mergeAnswersWithFields } from "./questionnaire-form-state"
import {
  autosaveStorageKey,
  captureAutosaveOperation,
  clearSettledAutosave,
  createAutosaveCursor,
  draftMutationTarget,
  invalidateAutosaveCursor,
  performGuardedAutosave,
  sameAutosaveIdentity,
  settleAutosaveFailure,
  settleAutosaveSuccess,
  writeSettledAutosave,
  type AutosaveCursor,
  type AutosaveIdentity,
  type AutosaveStorage,
} from "./autosave-session"

const AUTOSAVE_DELAY_MS = 2_000

export type QuestionnaireDraftSaveStatus =
  | "idle"
  | "pending"
  | "saving"
  | "saved"
  | "error"

type UseQuestionnaireDraftAutosaveOptions = {
  open: boolean
  enabled: boolean
  leadId: string | null
  templateId: string
  fields: QuestionnaireField[]
  answers: JsonObject
  onHydrate: (answers: JsonObject) => void
}

function browserAutosaveStorage(): AutosaveStorage | null {
  if (typeof window === "undefined") return null
  return window.localStorage
}

function readLocalDraft(leadId: string, templateId: string) {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(autosaveStorageKey(leadId, templateId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      answers?: JsonObject
      draftId?: string
      updatedAt?: string
      payloadHash?: string
      baseUpdatedAt?: string
    }
    return parsed.answers ? parsed : null
  } catch {
    return null
  }
}

function clearLocalDraft(leadId: string, templateId: string) {
  clearSettledAutosave(browserAutosaveStorage() ?? { setItem() {}, removeItem() {} }, {
    leadId,
    templateId,
  })
}

type LocalDraftRecord = NonNullable<ReturnType<typeof readLocalDraft>>

type RemoteDraftRecord = {
  id: string
  answers?: JsonObject
  updatedAt?: string
}

function hasDraftAnswers(answers?: JsonObject | null) {
  return Boolean(answers && Object.keys(answers).length > 0)
}

function draftTimestamp(value?: string | null) {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

/** A API prevalece ao reabrir. O local só continua a mesma versão remota. */
function resolveDraftSource(
  remote: RemoteDraftRecord | null,
  local: LocalDraftRecord | null,
) {
  const remoteHas = hasDraftAnswers(remote?.answers)
  const localHas = hasDraftAnswers(local?.answers)

  if (!remoteHas && !localHas) {
    return {
      answers: null as JsonObject | null,
      draftId: remote?.id ?? local?.draftId ?? null,
      from: "none" as const,
      updatedAt: remote?.updatedAt ?? local?.updatedAt ?? null,
      baseUpdatedAt: remote?.updatedAt ?? null,
    }
  }

  if (!remoteHas && localHas) {
    return {
      answers: local!.answers!,
      draftId: local?.draftId ?? remote?.id ?? null,
      from: "local" as const,
      updatedAt: local?.updatedAt ?? null,
      baseUpdatedAt: local?.baseUpdatedAt ?? null,
    }
  }

  const localContinuesRemote =
    localHas &&
    Boolean(local?.baseUpdatedAt) &&
    local?.baseUpdatedAt === remote?.updatedAt &&
    draftTimestamp(local?.updatedAt) > draftTimestamp(remote?.updatedAt)

  if (localContinuesRemote) {
    return {
      answers: local!.answers!,
      draftId: local?.draftId ?? remote!.id,
      from: "local" as const,
      updatedAt: local?.updatedAt ?? null,
      baseUpdatedAt: remote?.updatedAt ?? null,
    }
  }

  return {
    answers: remote!.answers!,
    draftId: remote!.id,
    from: "remote" as const,
    updatedAt: remote?.updatedAt ?? null,
    baseUpdatedAt: remote?.updatedAt ?? null,
  }
}

export function useQuestionnaireDraftAutosave({
  open,
  enabled,
  leadId,
  templateId,
  fields,
  answers,
  onHydrate,
}: UseQuestionnaireDraftAutosaveOptions) {
  const identity = useMemo<AutosaveIdentity>(
    () => ({ open, leadId, templateId }),
    [leadId, open, templateId],
  )
  const [draftId, setDraftId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<QuestionnaireDraftSaveStatus>("idle")
  const [saveDetail, setSaveDetail] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const answersRef = useRef(answers)
  const fieldsRef = useRef(fields)
  const onHydrateRef = useRef(onHydrate)
  const saveInFlightRef = useRef(false)
  const pendingSaveRef = useRef(false)
  const hydrateKeyRef = useRef<string | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flightTokenRef = useRef(0)
  const cursorRef = useRef<AutosaveCursor>(createAutosaveCursor(identity))

  if (!sameAutosaveIdentity(cursorRef.current.identity, identity)) {
    cursorRef.current = invalidateAutosaveCursor(cursorRef.current, identity)
    flightTokenRef.current += 1
    saveInFlightRef.current = false
    pendingSaveRef.current = false
    hydrateKeyRef.current = null
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    setDraftId(null)
    setSaveDetail(null)
    setSaveStatus("idle")
    setHydrated(false)
    setLastSavedAt(null)
  }

  answersRef.current = answers
  fieldsRef.current = fields
  onHydrateRef.current = onHydrate

  const draftListFilters = useMemo(
    () =>
      leadId && templateId
        ? {
            ...leadSubmissionListFilters(leadId, { templateId, limit: 1 }),
            status: "draft" as const,
          }
        : null,
    [leadId, templateId],
  )

  const draftsQueryEnabled = Boolean(open && enabled && draftListFilters)

  const draftsQuery = useQuestionnaireSubmissions(
    draftListFilters ?? { page: 1, limit: 1 },
    { enabled: draftsQueryEnabled },
  )

  const createDraft = useCreateQuestionnaireSubmission()
  const updateDraft = useUpdateQuestionnaireSubmission()

  const draftPayloadHash = useMemo(() => {
    if (!enabled || fields.length === 0) return ""
    return buildDraftPayloadHash(fields, answers)
  }, [answers, enabled, fields])

  const resetSession = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    hydrateKeyRef.current = null
    pendingSaveRef.current = false
    setHydrated(false)
    setDraftId(null)
    setSaveDetail(null)
    setSaveStatus("idle")
    setLastSavedAt(null)
  }, [])

  useEffect(() => {
    if (!open) resetSession()
  }, [open, resetSession])

  useEffect(() => {
    if (!draftsQueryEnabled || !leadId || !templateId || fields.length === 0) return

    const hydrateKey = `${leadId}:${templateId}`
    if (hydrateKeyRef.current === hydrateKey) return
    if (draftsQuery.isLoading) return
    if (!sameAutosaveIdentity(cursorRef.current.identity, { open, leadId, templateId })) {
      return
    }

    hydrateKeyRef.current = hydrateKey

    const remoteDraft = draftsQuery.data?.data[0] ?? null
    const local = readLocalDraft(leadId, templateId)
    const resolved = resolveDraftSource(remoteDraft, local)

    const hydratedAnswers =
      resolved.answers && Object.keys(resolved.answers).length > 0
        ? answersToFormState(fields, resolved.answers)
        : mergeAnswersWithFields(fields, {})

    onHydrateRef.current(mergeAnswersWithFields(fields, hydratedAnswers))

    const persistedHash = buildDraftPayloadHash(fields, hydratedAnswers)
    cursorRef.current.lastPersistedHash =
      local?.payloadHash ??
      (resolved.answers && Object.keys(resolved.answers).length > 0
        ? hashDraftAnswersPayload(buildDraftAnswers(fields, hydratedAnswers))
        : persistedHash)
    cursorRef.current.baseUpdatedAt = resolved.baseUpdatedAt
    cursorRef.current.pauseAutosave = false
    cursorRef.current.draftId = resolved.draftId
    setDraftId(resolved.draftId)
    setHydrated(true)
    setSaveDetail(null)
    setSaveStatus(resolved.from === "remote" ? "saved" : "idle")

    if (resolved.updatedAt) {
      setLastSavedAt(new Date(resolved.updatedAt))
    }

    logAutosave(AUTOSAVE_LOG.rehydrated, {
      leadId,
      templateId,
      draftId: resolved.draftId,
      fromRemote: resolved.from === "remote",
      fromLocal: resolved.from === "local",
      payloadHash: cursorRef.current.lastPersistedHash,
    })
  }, [
    draftsQuery.data,
    draftsQuery.isLoading,
    draftsQueryEnabled,
    fields,
    leadId,
    open,
    templateId,
  ])

  const persistDraft = useCallback(async (options?: { force?: boolean }) => {
    const target = draftMutationTarget(cursorRef.current)
    if (!enabled || !target || fieldsRef.current.length === 0) {
      return false
    }
    if (cursorRef.current.pauseAutosave) return false
    if (!hydrateKeyRef.current && !options?.force) return false

    const currentFields = fieldsRef.current
    const payloadAnswers = buildDraftAnswers(currentFields, answersRef.current)
    const payloadHash = hashDraftAnswersPayload(payloadAnswers)
    const hasContent = Object.keys(payloadAnswers).length > 0
    const cursor = cursorRef.current

    if (
      !options?.force &&
      payloadHash === cursor.lastPersistedHash &&
      (cursor.draftId || !hasContent)
    ) {
      logAutosave(AUTOSAVE_LOG.skipped, {
        reason: "unchanged_payload",
        payloadHash,
        draftId: cursor.draftId,
      })
      setSaveStatus((current) =>
        current === "saving" ? "saved" : current === "pending" ? "idle" : current,
      )
      return false
    }

    if (!hasContent && !cursor.draftId && !options?.force) {
      logAutosave(AUTOSAVE_LOG.skipped, { reason: "empty_without_draft" })
      setSaveStatus("idle")
      return false
    }

    if (saveInFlightRef.current || createDraft.isPending || updateDraft.isPending) {
      pendingSaveRef.current = true
      logAutosave(AUTOSAVE_LOG.skipped, { reason: "mutation_in_flight" })
      return false
    }

    const operation = captureAutosaveOperation(cursor, payloadAnswers, payloadHash)
    logAutosave(AUTOSAVE_LOG.trigger, {
      force: options?.force ?? false,
      payloadHash,
      draftId: operation.draftId,
      fieldCount: Object.keys(payloadAnswers).length,
    })

    const myFlight = ++flightTokenRef.current
    saveInFlightRef.current = true
    setSaveStatus("saving")
    setSaveDetail(null)

    try {
      const storage = browserAutosaveStorage()
      const settlement = await performGuardedAutosave({
        operation,
        readCursor: () => cursorRef.current,
        run: () => {
          const body = {
            templateId: operation.identity.templateId,
            leadId: operation.identity.leadId ?? "",
            mode: "INTERNAL" as const,
            origin: "INTERNAL" as const,
            status: "draft" as const,
            answers: operation.answers,
          }
          return operation.draftId
            ? updateDraft.mutateAsync({
                id: operation.draftId,
                input: {
                  ...body,
                  ...(operation.baseUpdatedAt
                    ? { expectedUpdatedAt: operation.baseUpdatedAt }
                    : {}),
                },
                autosave: true,
              })
            : createDraft.mutateAsync({ ...body, autosave: true })
        },
        mapSuccess: (live, saved) => settleAutosaveSuccess(live, operation, saved),
        mapFailure: (live, error) => settleAutosaveFailure(live, operation, error),
      })

      if (!settlement.applied) return false

      cursorRef.current = settlement.cursor
      if ("write" in settlement) {
        if (storage) writeSettledAutosave(storage, settlement.write)
        setDraftId(settlement.draftId)
        setLastSavedAt(new Date())
        setSaveDetail(null)
        setSaveStatus("saved")
        logAutosave(AUTOSAVE_LOG.success, {
          draftId: settlement.draftId,
          payloadHash,
        })
        return true
      }

      if (settlement.tone === "conflict") {
        if (storage) clearSettledAutosave(storage, settlement.clearLocalKey)
        hydrateKeyRef.current = null
        void draftsQuery.refetch()
      } else if (storage) {
        writeSettledAutosave(storage, settlement.backup)
      }
      setSaveStatus("error")
      setSaveDetail(settlement.message)
      logAutosave(AUTOSAVE_LOG.error, {
        message: settlement.message ?? "unknown",
      })
      return false
    } finally {
      if (flightTokenRef.current === myFlight) {
        saveInFlightRef.current = false
        if (pendingSaveRef.current) {
          pendingSaveRef.current = false
          void persistDraft()
        }
      }
    }
  }, [createDraft, draftsQuery, enabled, updateDraft])

  const persistDraftRef = useRef(persistDraft)
  persistDraftRef.current = persistDraft

  useEffect(() => {
    if (!open || !enabled || !hydrated || !leadId || !templateId) return

    if (!draftPayloadHash && !cursorRef.current.draftId) {
      setSaveStatus("idle")
      return
    }

    if (draftPayloadHash === cursorRef.current.lastPersistedHash) {
      return
    }

    if (saveInFlightRef.current || createDraft.isPending || updateDraft.isPending) {
      return
    }

    if (cursorRef.current.pauseAutosave) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      void persistDraftRef.current()
    }, AUTOSAVE_DELAY_MS)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [
    createDraft.isPending,
    draftPayloadHash,
    enabled,
    hydrated,
    leadId,
    open,
    templateId,
    updateDraft.isPending,
  ])

  const saveDraftNow = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    return persistDraftRef.current({ force: true })
  }, [])

  const clearDraft = useCallback(() => {
    const current = cursorRef.current
    if (current.identity.leadId && current.identity.templateId) {
      clearLocalDraft(current.identity.leadId, current.identity.templateId)
    }
    flightTokenRef.current += 1
    saveInFlightRef.current = false
    cursorRef.current = {
      ...current,
      generation: current.generation + 1,
      draftId: null,
      baseUpdatedAt: null,
      lastPersistedHash: null,
      pauseAutosave: false,
    }
    setDraftId(null)
    setSaveDetail(null)
    setLastSavedAt(null)
    setSaveStatus("idle")
  }, [])

  return {
    draftId,
    saveStatus,
    saveDetail,
    lastSavedAt,
    hydrated,
    isLoadingDraft: draftsQueryEnabled && draftsQuery.isLoading && !hydrated,
    saveDraftNow,
    clearDraft,
    persistDraft,
  }
}
