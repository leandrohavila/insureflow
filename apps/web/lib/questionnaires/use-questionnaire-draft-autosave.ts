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

const AUTOSAVE_DELAY_MS = 2_000
const LOCAL_STORAGE_PREFIX = "insureflow:questionnaire-draft:"

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

function localDraftKey(leadId: string, templateId: string) {
  return `${LOCAL_STORAGE_PREFIX}${leadId}:${templateId}`
}

function readLocalDraft(leadId: string, templateId: string) {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(localDraftKey(leadId, templateId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      answers?: JsonObject
      draftId?: string
      updatedAt?: string
      payloadHash?: string
    }
    return parsed.answers ? parsed : null
  } catch {
    return null
  }
}

function writeLocalDraft(
  leadId: string,
  templateId: string,
  answers: JsonObject,
  draftId?: string | null,
  payloadHash?: string,
) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(
      localDraftKey(leadId, templateId),
      JSON.stringify({
        answers,
        draftId: draftId ?? undefined,
        payloadHash,
        updatedAt: new Date().toISOString(),
      }),
    )
  } catch {
    // quota or private mode — ignore
  }
}

function clearLocalDraft(leadId: string, templateId: string) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(localDraftKey(leadId, templateId))
  } catch {
    // ignore
  }
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

/** Prefer newer content; empty remote must not discard fresher local copy. */
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
    }
  }

  if (!remoteHas && localHas) {
    return {
      answers: local!.answers!,
      draftId: local?.draftId ?? remote?.id ?? null,
      from: "local" as const,
      updatedAt: local?.updatedAt ?? null,
    }
  }

  if (remoteHas && !localHas) {
    return {
      answers: remote!.answers!,
      draftId: remote!.id,
      from: "remote" as const,
      updatedAt: remote?.updatedAt ?? null,
    }
  }

  const remoteTs = draftTimestamp(remote?.updatedAt)
  const localTs = draftTimestamp(local?.updatedAt)

  if (localTs > remoteTs) {
    return {
      answers: local!.answers!,
      draftId: local?.draftId ?? remote?.id ?? null,
      from: "local" as const,
      updatedAt: local?.updatedAt ?? null,
    }
  }

  return {
    answers: remote!.answers!,
    draftId: remote!.id ?? local?.draftId ?? null,
    from: "remote" as const,
    updatedAt: remote?.updatedAt ?? local?.updatedAt ?? null,
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
  const [draftId, setDraftId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<QuestionnaireDraftSaveStatus>("idle")
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const answersRef = useRef(answers)
  const fieldsRef = useRef(fields)
  const draftIdRef = useRef(draftId)
  const onHydrateRef = useRef(onHydrate)
  const saveInFlightRef = useRef(false)
  const pendingSaveRef = useRef(false)
  const hydrateKeyRef = useRef<string | null>(null)
  const lastPersistedHashRef = useRef<string | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  answersRef.current = answers
  fieldsRef.current = fields
  draftIdRef.current = draftId
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
    lastPersistedHashRef.current = null
    saveInFlightRef.current = false
    pendingSaveRef.current = false
    setHydrated(false)
    setDraftId(null)
    draftIdRef.current = null
    setSaveStatus("idle")
    setLastSavedAt(null)
  }, [])

  useEffect(() => {
    if (!open) resetSession()
  }, [open, resetSession])

  useEffect(() => {
    if (!open) return
    hydrateKeyRef.current = null
    lastPersistedHashRef.current = null
    setHydrated(false)
    setDraftId(null)
    draftIdRef.current = null
  }, [leadId, open, templateId])

  useEffect(() => {
    if (!draftsQueryEnabled || !leadId || !templateId || fields.length === 0) return

    const hydrateKey = `${leadId}:${templateId}`
    if (hydrateKeyRef.current === hydrateKey) return
    if (draftsQuery.isLoading) return

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
    lastPersistedHashRef.current =
      local?.payloadHash ??
      (resolved.answers && Object.keys(resolved.answers).length > 0
        ? hashDraftAnswersPayload(buildDraftAnswers(fields, hydratedAnswers))
        : persistedHash)

    setDraftId(resolved.draftId)
    draftIdRef.current = resolved.draftId
    setHydrated(true)
    setSaveStatus(resolved.draftId || local ? "saved" : "idle")

    if (resolved.updatedAt) {
      setLastSavedAt(new Date(resolved.updatedAt))
    }

    logAutosave(AUTOSAVE_LOG.rehydrated, {
      leadId,
      templateId,
      draftId: resolved.draftId,
      fromRemote: resolved.from === "remote",
      fromLocal: resolved.from === "local",
      payloadHash: lastPersistedHashRef.current,
    })
  }, [
    draftsQuery.data,
    draftsQuery.isLoading,
    draftsQueryEnabled,
    fields,
    leadId,
    templateId,
  ])

  const persistDraft = useCallback(async (options?: { force?: boolean }) => {
    if (!enabled || !leadId || !templateId || fieldsRef.current.length === 0) {
      return false
    }
    if (!hydrateKeyRef.current && !options?.force) return false

    const currentFields = fieldsRef.current
    const payloadAnswers = buildDraftAnswers(currentFields, answersRef.current)
    const payloadHash = hashDraftAnswersPayload(payloadAnswers)
    const hasContent = Object.keys(payloadAnswers).length > 0

    if (
      !options?.force &&
      payloadHash === lastPersistedHashRef.current &&
      (draftIdRef.current || !hasContent)
    ) {
      logAutosave(AUTOSAVE_LOG.skipped, {
        reason: "unchanged_payload",
        payloadHash,
        draftId: draftIdRef.current,
      })
      setSaveStatus((current) =>
        current === "saving" ? "saved" : current === "pending" ? "idle" : current,
      )
      return false
    }

    if (!hasContent && !draftIdRef.current && !options?.force) {
      logAutosave(AUTOSAVE_LOG.skipped, { reason: "empty_without_draft" })
      setSaveStatus("idle")
      return false
    }

    if (saveInFlightRef.current || createDraft.isPending || updateDraft.isPending) {
      pendingSaveRef.current = true
      logAutosave(AUTOSAVE_LOG.skipped, { reason: "mutation_in_flight" })
      return false
    }

    logAutosave(AUTOSAVE_LOG.trigger, {
      force: options?.force ?? false,
      payloadHash,
      draftId: draftIdRef.current,
      fieldCount: Object.keys(payloadAnswers).length,
    })

    saveInFlightRef.current = true
    setSaveStatus("saving")

    writeLocalDraft(
      leadId,
      templateId,
      answersRef.current,
      draftIdRef.current,
      payloadHash,
    )

    try {
      const body = {
        templateId,
        leadId,
        mode: "INTERNAL" as const,
        origin: "INTERNAL" as const,
        status: "draft" as const,
        answers: payloadAnswers,
      }

      const saved = draftIdRef.current
        ? await updateDraft.mutateAsync({
            id: draftIdRef.current,
            input: body,
            autosave: true,
          })
        : await createDraft.mutateAsync({ ...body, autosave: true })

      setDraftId(saved.id)
      draftIdRef.current = saved.id
      lastPersistedHashRef.current = payloadHash
      writeLocalDraft(
        leadId,
        templateId,
        answersRef.current,
        saved.id,
        payloadHash,
      )
      setLastSavedAt(new Date())
      setSaveStatus("saved")
      logAutosave(AUTOSAVE_LOG.success, {
        draftId: saved.id,
        payloadHash,
      })
      return true
    } catch (error) {
      setSaveStatus("error")
      logAutosave(AUTOSAVE_LOG.error, {
        message: error instanceof Error ? error.message : "unknown",
      })
      return false
    } finally {
      saveInFlightRef.current = false
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false
        void persistDraft()
      }
    }
  }, [createDraft, enabled, leadId, templateId, updateDraft])

  const persistDraftRef = useRef(persistDraft)
  persistDraftRef.current = persistDraft

  useEffect(() => {
    if (!open || !enabled || !hydrated || !leadId || !templateId) return

    if (!draftPayloadHash && !draftIdRef.current) {
      setSaveStatus("idle")
      return
    }

    if (draftPayloadHash === lastPersistedHashRef.current) {
      return
    }

    if (saveInFlightRef.current || createDraft.isPending || updateDraft.isPending) {
      return
    }

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
    if (leadId && templateId) clearLocalDraft(leadId, templateId)
    setDraftId(null)
    draftIdRef.current = null
    lastPersistedHashRef.current = null
    setLastSavedAt(null)
    setSaveStatus("idle")
  }, [leadId, templateId])

  return {
    draftId,
    saveStatus,
    lastSavedAt,
    hydrated,
    isLoadingDraft: draftsQueryEnabled && draftsQuery.isLoading && !hydrated,
    saveDraftNow,
    clearDraft,
    persistDraft,
  }
}
