import {
  autosaveStorageKey,
  captureAutosaveOperation,
  clearSettledAutosave,
  createAutosaveCursor,
  draftMutationTarget,
  invalidateAutosaveCursor,
  performGuardedAutosave,
  settleAutosaveFailure,
  settleAutosaveSuccess,
  writeSettledAutosave,
  type AutosaveCursor,
  type AutosaveIdentity,
  type AutosaveStorage,
} from "./autosave-session"

const leadA = "lead-marina"
const leadB = "lead-bruno"
const templateA = "tpl-auto"
const templateB = "tpl-compra"
const answersA = { vehicle_model: "Uno" }
const answersB = { property_type: "apartamento" }
const hashA = "hash-auto-uno"
const hashB = "hash-compra-apto"
const savedAt = "2026-08-02T12:05:00.000Z"
const baseA = "2026-08-02T12:00:00.000Z"
const baseB = "2026-08-03T09:00:00.000Z"

function identity(
  open: boolean,
  leadId: string | null,
  templateId: string,
): AutosaveIdentity {
  return { open, leadId, templateId }
}

function memoryStorage(seed?: Record<string, string>): AutosaveStorage & {
  map: Map<string, string>
} {
  const map = new Map(Object.entries(seed ?? {}))
  return {
    map,
    setItem(key, value) {
      map.set(key, value)
    },
    removeItem(key) {
      map.delete(key)
    },
  }
}

function defer<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function cursorFor(leadId: string, templateId: string): AutosaveCursor {
  const cursor = createAutosaveCursor(identity(true, leadId, templateId))
  cursor.draftId = "submission-a"
  cursor.baseUpdatedAt = baseA
  cursor.lastPersistedHash = hashA
  return cursor
}

function applySettlementStorage(
  storage: AutosaveStorage,
  settlement:
    | ReturnType<typeof settleAutosaveSuccess>
    | ReturnType<typeof settleAutosaveFailure>,
) {
  if (!settlement.applied) {
    writeSettledAutosave(storage, null)
    clearSettledAutosave(storage, null)
    return
  }
  if ("write" in settlement) {
    writeSettledAutosave(storage, settlement.write)
  }
  if ("backup" in settlement) {
    writeSettledAutosave(storage, settlement.backup)
    clearSettledAutosave(storage, settlement.clearLocalKey)
  }
}

describe("isolamento de autosave entre questionários", () => {
  it("aplica o sucesso quando o contexto não muda", async () => {
    let cursor = cursorFor(leadA, templateA)
    const operation = captureAutosaveOperation(cursor, answersA, hashA)
    const pending = defer<{ id: string; updatedAt: string }>()
    const flight = performGuardedAutosave({
      operation,
      readCursor: () => cursor,
      run: () => pending.promise,
      mapSuccess: (live, saved) => settleAutosaveSuccess(live, operation, saved),
      mapFailure: (live, error) => settleAutosaveFailure(live, operation, error),
    })

    pending.resolve({ id: "submission-a", updatedAt: savedAt })
    const settlement = await flight
    if (settlement.applied && "write" in settlement && settlement.write) {
      cursor = settlement.cursor
    }

    expect(settlement.applied).toBe(true)
    expect(cursor.draftId).toBe("submission-a")
    expect(cursor.baseUpdatedAt).toBe(savedAt)
    expect(cursor.lastPersistedHash).toBe(hashA)
    const storage = memoryStorage()
    applySettlementStorage(storage, settlement)
    const stored = JSON.parse(storage.map.get(autosaveStorageKey(leadA, templateA)) ?? "{}")
    expect(stored.draftId).toBe("submission-a")
    expect(stored.answers).toEqual(answersA)
  })

  it("ignora o sucesso antigo depois da troca de template", async () => {
    let cursor = cursorFor(leadA, templateA)
    const operation = captureAutosaveOperation(cursor, answersA, hashA)
    const pending = defer<{ id: string; updatedAt: string }>()
    const flight = performGuardedAutosave({
      operation,
      readCursor: () => cursor,
      run: () => pending.promise,
      mapSuccess: (live, saved) => settleAutosaveSuccess(live, operation, saved),
      mapFailure: (live, error) => settleAutosaveFailure(live, operation, error),
    })

    cursor = invalidateAutosaveCursor(cursor, identity(true, leadA, templateB))
    cursor.draftId = "submission-b"
    cursor.baseUpdatedAt = baseB
    cursor.lastPersistedHash = hashB

    const seeded = JSON.stringify({ answers: answersB, draftId: "submission-b" })
    const storage = memoryStorage({
      [autosaveStorageKey(leadA, templateB)]: seeded,
    })

    pending.resolve({ id: "submission-a", updatedAt: savedAt })
    const settlement = await flight
    applySettlementStorage(storage, settlement)

    expect(settlement.applied).toBe(false)
    expect(cursor.draftId).toBe("submission-b")
    expect(cursor.baseUpdatedAt).toBe(baseB)
    expect(cursor.lastPersistedHash).toBe(hashB)
    expect(cursor.pauseAutosave).toBe(false)
    expect(storage.map.get(autosaveStorageKey(leadA, templateB))).toBe(seeded)
    expect(storage.map.has(autosaveStorageKey(leadA, templateA))).toBe(false)

    const next = draftMutationTarget(cursor)
    expect(next).toEqual({
      leadId: leadA,
      templateId: templateB,
      draftId: "submission-b",
      baseUpdatedAt: baseB,
    })
  })

  it("ignora o sucesso antigo depois da troca de lead", async () => {
    let cursor = cursorFor(leadA, templateA)
    const operation = captureAutosaveOperation(cursor, answersA, hashA)
    const pending = defer<{ id: string; updatedAt: string }>()
    const flight = performGuardedAutosave({
      operation,
      readCursor: () => cursor,
      run: () => pending.promise,
      mapSuccess: (live, saved) => settleAutosaveSuccess(live, operation, saved),
      mapFailure: (live, error) => settleAutosaveFailure(live, operation, error),
    })

    cursor = invalidateAutosaveCursor(cursor, identity(true, leadB, templateA))
    cursor.lastPersistedHash = hashB
    cursor.baseUpdatedAt = null
    cursor.draftId = null

    pending.resolve({ id: "submission-a", updatedAt: savedAt })
    const settlement = await flight
    const storage = memoryStorage()
    applySettlementStorage(storage, settlement)

    expect(settlement.applied).toBe(false)
    expect(cursor.draftId).toBeNull()
    expect(cursor.baseUpdatedAt).toBeNull()
    expect(cursor.lastPersistedHash).toBe(hashB)
    expect(storage.map.size).toBe(0)
    expect(draftMutationTarget(cursor)).toEqual({
      leadId: leadB,
      templateId: templateA,
      draftId: null,
      baseUpdatedAt: null,
    })
  })

  it("ignora falha de rede e conflito 409 depois da troca de contexto", async () => {
    const cases = [
      new Error("Failed to fetch"),
      { status: 409 },
    ]

    for (const error of cases) {
      let cursor = cursorFor(leadA, templateA)
      const operation = captureAutosaveOperation(cursor, answersA, hashA)
      const pending = defer<{ id: string; updatedAt: string }>()
      const flight = performGuardedAutosave({
        operation,
        readCursor: () => cursor,
        run: () => pending.promise,
        mapSuccess: (live, saved) => settleAutosaveSuccess(live, operation, saved),
        mapFailure: (live, failure) => settleAutosaveFailure(live, operation, failure),
      })

      cursor = invalidateAutosaveCursor(cursor, identity(true, leadA, templateB))
      cursor.draftId = "submission-b"
      cursor.baseUpdatedAt = baseB
      cursor.lastPersistedHash = hashB
      const seeded = JSON.stringify({ answers: answersB, draftId: "submission-b" })
      const storage = memoryStorage({
        [autosaveStorageKey(leadA, templateB)]: seeded,
      })

      pending.reject(error)
      const settlement = await flight
      applySettlementStorage(storage, settlement)

      expect(settlement.applied).toBe(false)
      expect("tone" in settlement ? settlement.tone : "applied").toBeNull()
      expect("message" in settlement ? settlement.message : "applied").toBeNull()
      expect(cursor.pauseAutosave).toBe(false)
      expect(cursor.draftId).toBe("submission-b")
      expect(cursor.baseUpdatedAt).toBe(baseB)
      expect(cursor.lastPersistedHash).toBe(hashB)
      expect(storage.map.get(autosaveStorageKey(leadA, templateB))).toBe(seeded)
    }
  })

  it("ignora a resposta pendente quando o diálogo fecha", async () => {
    let cursor = cursorFor(leadA, templateA)
    const operation = captureAutosaveOperation(cursor, answersA, hashA)
    const pending = defer<{ id: string; updatedAt: string }>()
    const flight = performGuardedAutosave({
      operation,
      readCursor: () => cursor,
      run: () => pending.promise,
      mapSuccess: (live, saved) => settleAutosaveSuccess(live, operation, saved),
      mapFailure: (live, error) => settleAutosaveFailure(live, operation, error),
    })

    cursor = invalidateAutosaveCursor(
      cursor,
      identity(false, leadA, templateA),
    )
    pending.resolve({ id: "submission-a", updatedAt: savedAt })
    const settlement = await flight
    const storage = memoryStorage()
    applySettlementStorage(storage, settlement)

    expect(settlement.applied).toBe(false)
    expect(cursor.draftId).toBeNull()
    expect(cursor.baseUpdatedAt).toBeNull()
    expect(cursor.lastPersistedHash).toBeNull()
    expect(draftMutationTarget(cursor)).toBeNull()
    expect(storage.map.size).toBe(0)
  })
})
