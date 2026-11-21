import { describe, expect, it, vi } from "vitest"

import {
  buildLeadDialogFormState,
  collectLeadDialogUnitIds,
  leadDialogAcceptsSubmit,
  leadDialogCanSubmit,
  leadDialogFieldErrors,
  leadDialogUnitFields,
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
    expect(form.phone).toBe("(11) 99999-9999")
    expect(form.company).toBe("Acme")
    expect(form.source).toBe("whatsapp")
    expect(form.document).toBe("529.982.247-25")
    expect(form.notes).toBe("Nota")
    expect(form.assignedTo).toBe("Ana Costa")
    expect(form).not.toHaveProperty("status")
  })

  it("sugere D-60/D-30/D-15 ao hidratar vencimento de apólice", () => {
    const form = buildLeadDialogFormState(
      {
        ...sampleLead,
        opportunityType: "renewal",
        currentInsurer: "Porto Seguro",
        policyExpiresAt: "2027-04-15T00:00:00.000Z",
      },
      "Operador",
    )
    expect(form.policyExpiresAt).toBe("2027-04-15")
    expect(form.renewalReminderD60Date).toBe("2027-02-14")
    expect(form.renewalReminderD30Date).toBe("2027-03-16")
    expect(form.renewalReminderD15Date).toBe("2027-03-31")
    expect(form.nextContactType).toBe("whatsapp")
  })

  it("reidrata lembrete e próximo contato salvos em vez da sugestão", () => {
    const form = buildLeadDialogFormState(
      {
        ...sampleLead,
        policyExpiresAt: "2027-04-15T00:00:00.000Z",
        renewalReminderD60: "2027-02-01T14:30:00.000Z",
        nextContactAt: "2027-03-20T13:00:00.000Z",
        nextContactType: "call",
        nextContactNotes: "Retornar proposta",
      },
      "Operador",
    )
    const saved = new Date("2027-02-01T14:30:00.000Z")
    const contact = new Date("2027-03-20T13:00:00.000Z")
    const pad = (value: number) => String(value).padStart(2, "0")
    expect(form.renewalReminderD60Date).toBe(
      `${saved.getFullYear()}-${pad(saved.getMonth() + 1)}-${pad(saved.getDate())}`,
    )
    expect(form.renewalReminderD60Time).toBe(
      `${pad(saved.getHours())}:${pad(saved.getMinutes())}`,
    )
    expect(form.renewalReminderD30Date).toBe("2027-03-16")
    expect(form.followUpDays).toBe("custom")
    expect(form.nextContactDate).toBe(
      `${contact.getFullYear()}-${pad(contact.getMonth() + 1)}-${pad(contact.getDate())}`,
    )
    expect(form.nextContactType).toBe("call")
    expect(form.nextContactNotes).toBe("Retornar proposta")
    expect(form.renewalReminderD60Mode).toBe("manual")
  })

  it("mantém D-60 desativado ao reabrir o diálogo", () => {
    const form = buildLeadDialogFormState(
      {
        ...sampleLead,
        policyExpiresAt: "2027-04-15T00:00:00.000Z",
        renewalD60Disabled: true,
      },
      "Operador",
    )
    expect(form.renewalReminderD60Mode).toBe("disabled")
    expect(form.renewalReminderD60Date).toBe("")
    expect(form.renewalReminderD30Mode).toBe("suggested")
    expect(form.renewalReminderD30Date).toBe("2027-03-16")
  })

  it("distingue atividade concluída de lembrete desativado", () => {
    const form = buildLeadDialogFormState(
      {
        ...sampleLead,
        policyExpiresAt: "2027-04-15T00:00:00.000Z",
        renewalReminderD60CompletedAt: "2027-02-14T12:00:00.000Z",
        renewalD30Disabled: true,
      },
      "Operador",
    )
    expect(form.renewalReminderD60Mode).toBe("completed")
    expect(form.renewalReminderD60Date).toBe("")
    expect(form.renewalReminderD30Mode).toBe("disabled")
  })

  it("locks business unit and default interests on create", () => {
    const form = buildLeadDialogFormState(null, "Operador", {
      lockedBusinessUnitId: "re-1",
      defaultInterestCategories: ["PROPERTY_BUY"],
    })
    expect(form.businessUnitId).toBe("re-1")
    expect(form.businessUnitIds).toEqual(["re-1"])
    expect(form.interestCategories).toEqual(["PROPERTY_BUY"])
    expect(form.assignedTo).toBe("Operador")
  })
})

describe("leadDialogCanSubmit", () => {
  it("exige nome e ao menos uma unidade", () => {
    expect(
      leadDialogCanSubmit({
        name: "Marina",
        businessUnitIds: [],
      }),
    ).toBe(false)
    expect(
      leadDialogCanSubmit({
        name: "Marina",
        businessUnitIds: ["bu-1"],
      }),
    ).toBe(true)
    expect(
      leadDialogCanSubmit({
        name: "  ",
        businessUnitIds: ["bu-1"],
      }),
    ).toBe(false)
  })
})

describe("leadDialogFieldErrors", () => {
  const valid = {
    name: "Marina Costa",
    email: "marina@email.com",
    phone: "(11) 98888-7777",
    document: "",
    documentType: "cpf" as const,
    businessUnitIds: ["bu-1"],
    assignedTo: "Ana Costa",
  }

  it("aceita cadastro com nome, empresa e responsável", () => {
    expect(leadDialogFieldErrors(valid)).toEqual({})
  })

  it("exige nome, empresa e responsável", () => {
    expect(
      leadDialogFieldErrors({
        ...valid,
        name: "  ",
        businessUnitIds: [],
        assignedTo: "",
      }),
    ).toEqual({
      name: "Informe o nome completo.",
      businessUnitIds: "Selecione ao menos uma unidade.",
      assignedTo: "Informe o responsável.",
    })
  })

  it("valida e-mail, telefone e documento só quando preenchidos", () => {
    expect(
      leadDialogFieldErrors({
        ...valid,
        email: "marina",
        phone: "1199",
        document: "111.111.111-11",
      }),
    ).toMatchObject({
      email: "Informe um e-mail válido.",
      phone: "Informe um telefone com DDD.",
      document: "Informe um CPF válido.",
    })
    expect(
      leadDialogFieldErrors({
        ...valid,
        email: "",
        phone: "",
        document: "",
      }),
    ).toEqual({})
  })
})

describe("leadDialogAcceptsSubmit", () => {
  it("permite um cadastro válido e bloqueia o envio duplicado", () => {
    expect(
      leadDialogAcceptsSubmit({ pending: false, submitLocked: false }),
    ).toBe(true)
    expect(
      leadDialogAcceptsSubmit({ pending: true, submitLocked: false }),
    ).toBe(false)
    expect(
      leadDialogAcceptsSubmit({ pending: false, submitLocked: true }),
    ).toBe(false)
  })
})

describe("leadDialogUnitFields", () => {
  it("preserva a origem e envia o conjunto explícito", () => {
    expect(leadDialogUnitFields(["bu-2", "bu-1"], "bu-1")).toEqual({
      businessUnitId: "bu-1",
      businessUnitIds: ["bu-2", "bu-1"],
    })
  })

  it("não envia lista vazia", () => {
    expect(leadDialogUnitFields([], "bu-1")).toEqual({})
  })

  it("reúne vínculos existentes sem substituir pela unidade do cadastro", () => {
    expect(
      collectLeadDialogUnitIds(
        {
          ...sampleLead,
          businessUnitId: "bu-1",
          businessUnits: [
            {
              id: "bu-1",
              name: "Corretora",
              slug: "corretora",
              type: "INSURANCE",
              isActive: true,
            },
            {
              id: "bu-2",
              name: "Imóveis",
              slug: "imoveis",
              type: "REAL_ESTATE",
              isActive: true,
            },
          ],
        },
        "bu-9",
      ),
    ).toEqual(["bu-1", "bu-2"])
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
