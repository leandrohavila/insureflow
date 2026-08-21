import { describe, expect, it, vi } from "vitest"

import {
  buildLeadDialogFormState,
  EMPTY_LEAD_DIALOG_FORM,
  getLeadDialogSessionKey,
  resolveLeadDialogSaveError,
  shouldShowLeadDialogSaveError,
  shouldShowPageLeadSaveError,
} from "./lead-dialog-form"
import { resetLeadSaveMutations } from "./lead-dialog-mutations"
import type { Lead } from "./types"

const sampleLead: Lead = {
  id: "lead-1",
  tenantId: "tenant-1",
  name: "Marina Costa",
  email: "marina@email.com",
  phone: "11999999999",
  company: "Acme",
  source: "whatsapp",
  documentType: "cpf",
  document: "52998224725",
  status: "new",
  notes: "Nota",
  assignedTo: "Ana Costa",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  initials: "MC",
}

describe("getLeadDialogSessionKey", () => {
  it("uses __new__ for create mode", () => {
    expect(getLeadDialogSessionKey(null)).toBe("__new__")
  })

  it("uses lead id for edit mode", () => {
    expect(getLeadDialogSessionKey(sampleLead)).toBe("lead-1")
  })
})

describe("buildLeadDialogFormState", () => {
  it("builds empty form for new lead with session default assignee", () => {
    expect(buildLeadDialogFormState(null, "Operador")).toEqual({
      ...EMPTY_LEAD_DIALOG_FORM,
      assignedTo: "Operador",
    })
  })

  it("hydrates edit form from lead", () => {
    const form = buildLeadDialogFormState(sampleLead, "Operador")
    expect(form.name).toBe("Marina Costa")
    expect(form.email).toBe("marina@email.com")
    expect(form.assignedTo).toBe("Ana Costa")
  })
})

describe("shouldShowPageLeadSaveError", () => {
  it("hides page error while dialog is open", () => {
    expect(shouldShowPageLeadSaveError(true, true)).toBe(false)
  })

  it("shows page error when dialog closed and mutation failed", () => {
    expect(shouldShowPageLeadSaveError(false, true)).toBe(true)
  })
})

describe("lead dialog reopen contract", () => {
  it("clears stale mutation errors before a new open", () => {
    const createLead = { reset: vi.fn() }
    const updateLead = { reset: vi.fn() }

    resetLeadSaveMutations(createLead, updateLead)

    expect(createLead.reset).toHaveBeenCalledTimes(1)
    expect(updateLead.reset).toHaveBeenCalledTimes(1)
  })

  it("detects session change when switching novo and editar", () => {
    expect(getLeadDialogSessionKey(null)).not.toBe(
      getLeadDialogSessionKey(sampleLead),
    )
  })

  it("does not show dialog error immediately after reopen", () => {
    const createError = new Error("Erro ao salvar lead")
    const updateError = null

    expect(
      shouldShowLeadDialogSaveError(true, createError, updateError),
    ).toBe(true)

    const createLead = { reset: vi.fn() }
    const updateLead = { reset: vi.fn() }
    resetLeadSaveMutations(createLead, updateLead)

    expect(
      shouldShowLeadDialogSaveError(
        true,
        null,
        null,
      ),
    ).toBe(false)
  })

  it("shows dialog error only while open and mutation failed", () => {
    const saveError = new Error("Erro ao salvar lead")

    expect(shouldShowLeadDialogSaveError(true, saveError, null)).toBe(true)
    expect(shouldShowLeadDialogSaveError(false, saveError, null)).toBe(false)
    expect(shouldShowLeadDialogSaveError(true, null, null)).toBe(false)
  })

  it("resolves create error before update error", () => {
    expect(
      resolveLeadDialogSaveError(new Error("create"), new Error("update")),
    ).toEqual(new Error("create"))
  })

  it("simulates open → fail → close → reopen without stale error", () => {
    let dialogOpen = false
    let createError: unknown = null
    let updateError: unknown = null

    const openDialog = () => {
      resetLeadSaveMutations(
        { reset: () => { createError = null } },
        { reset: () => { updateError = null } },
      )
      dialogOpen = true
    }

    const closeDialog = () => {
      dialogOpen = false
      resetLeadSaveMutations(
        { reset: () => { createError = null } },
        { reset: () => { updateError = null } },
      )
    }

    openDialog()
    expect(
      shouldShowLeadDialogSaveError(dialogOpen, createError, updateError),
    ).toBe(false)

    createError = new Error("Erro ao salvar lead")
    expect(
      shouldShowLeadDialogSaveError(dialogOpen, createError, updateError),
    ).toBe(true)

    closeDialog()
    expect(
      shouldShowLeadDialogSaveError(dialogOpen, createError, updateError),
    ).toBe(false)

    openDialog()
    expect(
      shouldShowLeadDialogSaveError(dialogOpen, createError, updateError),
    ).toBe(false)
  })

  it("simulates switching from editar to novo without stale error", () => {
    let sessionKey = getLeadDialogSessionKey(sampleLead)
    let createError: unknown = new Error("fail")
    let updateError: unknown = null

    resetLeadSaveMutations(
      { reset: () => { createError = null } },
      { reset: () => { updateError = null } },
    )
    sessionKey = getLeadDialogSessionKey(null)

    expect(sessionKey).toBe("__new__")
    expect(
      shouldShowLeadDialogSaveError(true, createError, updateError),
    ).toBe(false)
  })
})
