import { describe, expect, it } from "vitest"

import type { Lead } from "@/lib/data-access/modules/leads"

import {
  LEAD_DETAIL_EMPTY,
  formatLeadDetailDate,
  leadCanReactivate,
  leadDetailActions,
  leadDetailDocument,
  leadDetailInterests,
  leadDetailOpportunity,
  leadDetailPhone,
  leadDetailUnits,
  leadNextAction,
  leadQualificationSnapshot,
  leadReactivationPayload,
} from "./lead-detail-view"

const access = {
  canEdit: true,
  canConvert: true,
  canSchedule: true,
  canViewDeals: true,
}

function lead(partial: Partial<Lead> & Pick<Lead, "status">): Lead {
  return {
    id: "lead-1",
    tenantId: "tenant-1",
    name: "Marina Costa",
    createdAt: "2026-03-02T12:00:00.000Z",
    updatedAt: "2026-03-02T12:00:00.000Z",
    initials: "MC",
    ...partial,
  }
}

describe("lead detail view", () => {
  it("mostra documento, telefone, interesse, empresa e unidade existentes", () => {
    const current = lead({
      status: "contacted",
      documentType: "cpf",
      document: "52998224725",
      phone: "11988887777",
      email: "marina@email.com",
      company: "Acme",
      source: "site",
      assignedTo: "Ana Costa",
      interestCategories: ["AUTO_INSURANCE"],
      businessUnit: {
        id: "bu-1",
        name: "Corretora Ávila",
        slug: "corretora",
        type: "INSURANCE",
        isActive: true,
      },
    })

    expect(leadDetailDocument(current)).toEqual({
      label: "CPF",
      value: "529.982.247-25",
    })
    expect(leadDetailPhone(current.phone)).toBe("(11) 98888-7777")
    expect(leadDetailInterests(current)).toEqual(["Seguro Auto"])
    expect(leadDetailUnits(current)).toBe("Corretora Ávila")
    expect(current.company).toBe("Acme")
    expect(formatLeadDetailDate(current.createdAt)).toBe("02/03/2026")
  })

  it("não inventa documento, unidade nem oportunidade", () => {
    const current = lead({ status: "new" })
    expect(leadDetailDocument(current)).toBeNull()
    expect(leadDetailUnits(current)).toBeNull()
    expect(leadDetailOpportunity(null)).toBeNull()
    expect(leadDetailPhone("")).toBeNull()
    expect(LEAD_DETAIL_EMPTY).toBe("Não informado")
  })

  it("abre edição e esconde conversão de lead perdido", () => {
    const lost = lead({
      status: "lost",
      lostReason: "Sem retorno",
      phone: "11988887777",
    })
    expect(leadDetailActions(lost, access)).toMatchObject({
      edit: true,
      schedule: true,
      convert: false,
      markLost: false,
      showLoss: true,
      call: true,
    })
  })

  it("mantém o negócio existente sem nova conversão", () => {
    const converted = lead({ status: "converted", dealId: "deal-1" })
    expect(leadDetailActions(converted, access)).toMatchObject({
      convert: false,
      openDeal: true,
      markLost: false,
    })
  })

  it("qualifica com o que já foi coletado e o que falta", () => {
    const view = leadQualificationSnapshot(
      lead({
        status: "qualified",
        phone: "11988887777",
        interestCategories: ["AUTO_INSURANCE"],
        opportunityType: "renewal",
        assignedTo: "Ana Costa",
        lastContactAt: "2026-04-01T12:00:00.000Z",
      }),
    )
    expect(view.seeking).toContain("Renovação")
    expect(view.seeking).toContain("Seguro Auto")
    expect(view.collected).toContain("Contato")
    expect(view.pending).toEqual([])
    expect(view.lastContactAt).toBe("2026-04-01T12:00:00.000Z")
  })

  it("mostra a próxima ação agendada e o vazio quando não há", () => {
    expect(
      leadNextAction({
        followUps: [
          {
            status: "completed",
            nextFollowUpAt: "2026-12-01T15:00:00.000Z",
            subject: "Retorno da proposta",
          },
        ],
      }),
    ).toMatchObject({ scheduled: true, label: "Retorno da proposta" })
    expect(leadNextAction({})).toEqual({
      scheduled: false,
      label: "Sem próxima ação",
    })
  })

  it("reativa só lead perdido elegível e mantém o lead como lead", () => {
    const eligible = lead({
      status: "lost",
      reactivationEnabled: true,
      nextReactivationAt: "2026-12-01T12:00:00.000Z",
      lostReason: "Sem retorno",
    })
    expect(leadCanReactivate(eligible)).toBe(true)
    expect(
      leadCanReactivate({ ...eligible, status: "contacted" }),
    ).toBe(false)
    expect(
      leadCanReactivate({ ...eligible, reactivationEnabled: false }),
    ).toBe(false)
    expect(
      leadCanReactivate({ ...eligible, nextReactivationAt: null }),
    ).toBe(false)
    expect(leadReactivationPayload()).toEqual({ toStatus: "contacted" })
    expect(leadReactivationPayload()).not.toHaveProperty("lostReason")
    expect(leadReactivationPayload()).not.toHaveProperty("dealId")
    expect(leadReactivationPayload()).not.toHaveProperty("renewalD60Disabled")
    expect(eligible.status).toBe("lost")
    expect(eligible.lostReason).toBe("Sem retorno")
  })

  it("respeita permissão e contato ausente", () => {
    const current = lead({ status: "qualified" })
    expect(
      leadDetailActions(current, { ...access, canEdit: false, canConvert: false }),
    ).toMatchObject({
      edit: false,
      convert: false,
      markLost: false,
      call: false,
      email: false,
      whatsapp: false,
    })
  })
})
