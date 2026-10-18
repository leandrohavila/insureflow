import { autosaveFailurePresentation } from "./autosave-outcome"

export const AUTOSAVE_STORAGE_PREFIX = "insureflow:questionnaire-draft:"

export type AutosaveIdentity = {
  open: boolean
  leadId: string | null
  templateId: string
}

export type AutosaveCursor = {
  generation: number
  identity: AutosaveIdentity
  draftId: string | null
  baseUpdatedAt: string | null
  lastPersistedHash: string | null
  pauseAutosave: boolean
}

export type AutosaveOperation = {
  generation: number
  identity: AutosaveIdentity
  draftId: string | null
  baseUpdatedAt: string | null
  payloadHash: string
  answers: Record<string, unknown>
}

export type AutosaveLocalWrite = {
  leadId: string
  templateId: string
  answers: Record<string, unknown>
  draftId: string | null
  payloadHash: string
  baseUpdatedAt: string | null
}

export type AutosaveStorage = {
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function sameAutosaveIdentity(
  left: AutosaveIdentity,
  right: AutosaveIdentity,
) {
  return (
    left.open === right.open &&
    left.leadId === right.leadId &&
    left.templateId === right.templateId
  )
}

export function createAutosaveCursor(identity: AutosaveIdentity): AutosaveCursor {
  return {
    generation: 0,
    identity,
    draftId: null,
    baseUpdatedAt: null,
    lastPersistedHash: null,
    pauseAutosave: false,
  }
}

/** Invalida a geração atual assim que lead, template ou abertura mudam. */
export function invalidateAutosaveCursor(
  cursor: AutosaveCursor,
  identity: AutosaveIdentity,
): AutosaveCursor {
  if (sameAutosaveIdentity(cursor.identity, identity)) return cursor
  return {
    generation: cursor.generation + 1,
    identity,
    draftId: null,
    baseUpdatedAt: null,
    lastPersistedHash: null,
    pauseAutosave: false,
  }
}

export function captureAutosaveOperation(
  cursor: AutosaveCursor,
  answers: Record<string, unknown>,
  payloadHash: string,
): AutosaveOperation {
  return {
    generation: cursor.generation,
    identity: cursor.identity,
    draftId: cursor.draftId,
    baseUpdatedAt: cursor.baseUpdatedAt,
    payloadHash,
    answers,
  }
}

export function isAutosaveOperationCurrent(
  cursor: AutosaveCursor,
  operation: AutosaveOperation,
) {
  return (
    cursor.generation === operation.generation &&
    cursor.identity.open &&
    operation.identity.open &&
    sameAutosaveIdentity(cursor.identity, operation.identity)
  )
}

export function autosaveStorageKey(leadId: string, templateId: string) {
  return `${AUTOSAVE_STORAGE_PREFIX}${leadId}:${templateId}`
}

export function draftMutationTarget(cursor: AutosaveCursor) {
  if (!cursor.identity.open || !cursor.identity.leadId || !cursor.identity.templateId) {
    return null
  }
  return {
    leadId: cursor.identity.leadId,
    templateId: cursor.identity.templateId,
    draftId: cursor.draftId,
    baseUpdatedAt: cursor.baseUpdatedAt,
  }
}

export type AutosaveSuccessSettlement = {
  applied: boolean
  cursor: AutosaveCursor
  write: AutosaveLocalWrite | null
  draftId: string | null
  baseUpdatedAt: string | null
  payloadHash: string | null
}

export function settleAutosaveSuccess(
  cursor: AutosaveCursor,
  operation: AutosaveOperation,
  saved: { id: string; updatedAt: string },
): AutosaveSuccessSettlement {
  if (!isAutosaveOperationCurrent(cursor, operation)) {
    return {
      applied: false,
      cursor,
      write: null,
      draftId: cursor.draftId,
      baseUpdatedAt: cursor.baseUpdatedAt,
      payloadHash: cursor.lastPersistedHash,
    }
  }

  const leadId = operation.identity.leadId
  const templateId = operation.identity.templateId
  if (!leadId || !templateId) {
    return {
      applied: false,
      cursor,
      write: null,
      draftId: cursor.draftId,
      baseUpdatedAt: cursor.baseUpdatedAt,
      payloadHash: cursor.lastPersistedHash,
    }
  }

  const next: AutosaveCursor = {
    ...cursor,
    draftId: saved.id,
    baseUpdatedAt: saved.updatedAt,
    lastPersistedHash: operation.payloadHash,
  }
  return {
    applied: true,
    cursor: next,
    draftId: saved.id,
    baseUpdatedAt: saved.updatedAt,
    payloadHash: operation.payloadHash,
    write: {
      leadId,
      templateId,
      answers: operation.answers,
      draftId: saved.id,
      payloadHash: operation.payloadHash,
      baseUpdatedAt: saved.updatedAt,
    },
  }
}

export type AutosaveFailureSettlement = {
  applied: boolean
  cursor: AutosaveCursor
  tone: "conflict" | "error" | null
  message: string | null
  clearLocalKey: { leadId: string; templateId: string } | null
  backup: AutosaveLocalWrite | null
}

export function settleAutosaveFailure(
  cursor: AutosaveCursor,
  operation: AutosaveOperation,
  error: unknown,
): AutosaveFailureSettlement {
  if (!isAutosaveOperationCurrent(cursor, operation)) {
    return {
      applied: false,
      cursor,
      tone: null,
      message: null,
      clearLocalKey: null,
      backup: null,
    }
  }

  const presentation = autosaveFailurePresentation(error)
  const leadId = operation.identity.leadId
  const templateId = operation.identity.templateId
  if (presentation.tone === "conflict" && leadId && templateId) {
    return {
      applied: true,
      cursor: { ...cursor, pauseAutosave: true },
      tone: "conflict",
      message: presentation.message,
      clearLocalKey: { leadId, templateId },
      backup: null,
    }
  }

  return {
    applied: true,
    cursor,
    tone: "error",
    message: presentation.message,
    clearLocalKey: null,
    backup:
      leadId && templateId
        ? {
            leadId,
            templateId,
            answers: operation.answers,
            draftId: operation.draftId,
            payloadHash: operation.payloadHash,
            baseUpdatedAt: operation.baseUpdatedAt,
          }
        : null,
  }
}

export function writeSettledAutosave(
  storage: AutosaveStorage,
  write: AutosaveLocalWrite | null,
) {
  if (!write?.leadId || !write.templateId) return
  storage.setItem(
    autosaveStorageKey(write.leadId, write.templateId),
    JSON.stringify({
      answers: write.answers,
      draftId: write.draftId ?? undefined,
      payloadHash: write.payloadHash,
      baseUpdatedAt: write.baseUpdatedAt ?? undefined,
      updatedAt: new Date().toISOString(),
    }),
  )
}

export function clearSettledAutosave(
  storage: AutosaveStorage,
  key: { leadId: string; templateId: string } | null,
) {
  if (!key) return
  storage.removeItem(autosaveStorageKey(key.leadId, key.templateId))
}

export async function performGuardedAutosave<T>(args: {
  operation: AutosaveOperation
  readCursor: () => AutosaveCursor
  run: () => Promise<T>
  mapSuccess: (
    cursor: AutosaveCursor,
    saved: T,
  ) => AutosaveSuccessSettlement
  mapFailure: (
    cursor: AutosaveCursor,
    error: unknown,
  ) => AutosaveFailureSettlement
}): Promise<AutosaveSuccessSettlement | AutosaveFailureSettlement> {
  try {
    const saved = await args.run()
    return args.mapSuccess(args.readCursor(), saved)
  } catch (error) {
    return args.mapFailure(args.readCursor(), error)
  }
}
