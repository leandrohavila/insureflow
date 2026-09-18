import { describe, expect, it } from "vitest"

import { buildRelationshipIndex, safeBuildRelationshipIndex } from "./build-index"
import { resolveIdentityKey, matchesSearchTerm, normalizeIdentityValue } from "./identity"
import { filterContacts, searchOperationalWorkspace } from "./search"
import type { CrmDeal } from "@/lib/data-access/modules/crm"
import type { Customer } from "@/lib/data-access/modules/customers"
import type { Lead } from "@/lib/data-access/modules/leads"

const baseDeal = (overrides: Partial<CrmDeal>): CrmDeal => ({
  id: "deal-1",
  tenantId: "t1",
  title: "Seguro empresarial",
  company: "Acme Ltda",
  value: 10000,
  stage: "qualificacao",
  status: "open",
  pipelineOrder: 1,
  assignedTo: "Ana",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  contact: "Acme Ltda",
  owner: "Ana",
  ownerInitials: "AN",
  priority: "media",
  product: "Seguro",
  lastActivity: "1d",
  tags: ["Aberto"],
  convertedLead: {
    id: "lead-1",
    name: "João Silva",
    email: "joao@acme.com",
    phone: "11999998888",
    assignedTo: "Ana",
    status: "converted",
    lastContactAt: "2026-01-02T00:00:00.000Z",
  },
  commercialContext: {
    questionnaire: {
      status: "pending",
      submissionId: null,
      updatedAt: null,
    },
    phone: "11999998888",
    lastContactAt: "2026-01-02T00:00:00.000Z",
    lastInteractionAt: "2026-01-02T00:00:00.000Z",
    responsible: "Ana",
  },
  ...overrides,
})

const baseLead = (overrides: Partial<Lead>): Lead => ({
  id: "lead-2",
  tenantId: "t1",
  name: "Maria Souza",
  email: "maria@acme.com",
  phone: "11988887777",
  company: "Acme Ltda",
  status: "new",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  initials: "MS",
  ...overrides,
})

describe("resolveIdentityKey", () => {
  it("prioriza documento sobre e-mail e telefone", () => {
    const key = resolveIdentityKey({
      name: "João",
      document: "529.982.247-25",
      email: "joao@test.com",
      phone: "11999999999",
    })
    expect(key.kind).toBe("document")
    expect(key.raw).toBe("52998224725")
  })

  it("usa e-mail quando documento ausente", () => {
    const key = resolveIdentityKey({
      name: "Maria",
      email: "Maria@Acme.COM",
    })
    expect(key.kind).toBe("email")
    expect(key.raw).toBe("maria@acme.com")
  })
})

describe("buildRelationshipIndex", () => {
  it("deduplica contato por identidade e agrupa empresa", () => {
    const index = buildRelationshipIndex({
      deals: [baseDeal({})],
      leads: [
        baseLead({ id: "lead-1", name: "João Silva", email: "joao@acme.com" }),
        baseLead({ id: "lead-2" }),
      ],
    })

    expect(index.contacts.length).toBe(2)
    const joao = index.contacts.find((contact) => contact.name === "João Silva")
    expect(joao?.dealIds).toContain("deal-1")
    expect(joao?.leadIds).toContain("lead-1")
    expect(joao?.phone).toBe("11999998888")

    const acme = index.companies.find((company) => company.name === "Acme Ltda")
    expect(acme?.dealCount).toBe(1)
    expect(acme?.contactCount).toBeGreaterThan(0)
  })

  it("deduplica empresas com mesmo slug independente de caixa", () => {
    const index = buildRelationshipIndex({
      deals: [
        baseDeal({ id: "deal-a", company: "teste" }),
        baseDeal({ id: "deal-b", company: "Teste", title: "Outro negócio" }),
      ],
      leads: [],
    })

    const testeCompanies = index.companies.filter((company) =>
      company.id.endsWith("teste"),
    )
    expect(testeCompanies).toHaveLength(1)
    expect(testeCompanies[0]?.dealCount).toBe(2)
    expect(new Set(index.companies.map((company) => company.id)).size).toBe(
      index.companies.length,
    )
  })

  it("tolera dados incompletos sem lançar exceção", () => {
    const index = buildRelationshipIndex({
      deals: [
        baseDeal({
          id: "deal-null-lead",
          title: null as unknown as string,
          company: null as unknown as string,
          convertedLead: null,
          value: "invalid" as unknown as number,
        }),
        baseDeal({
          id: "deal-partial-lead",
          convertedLead: {
            id: "lead-partial",
            name: null as unknown as string,
            email: null,
            phone: null,
          },
        }),
      ],
      leads: [
        baseLead({
          id: "lead-bad",
          name: null as unknown as string,
          email: undefined,
          phone: ["11999990000"] as unknown as string,
          company: undefined,
        }),
      ],
      customers: [
        {
          id: "cust-1",
          tenantId: "t1",
          type: "PF",
          name: null as unknown as string,
          document: "52998224725",
          status: "active",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          initials: "CL",
        } satisfies Customer,
      ],
    })

    expect(index.contacts.length).toBeGreaterThan(0)
    expect(index.companies.length).toBeGreaterThanOrEqual(0)
    expect(() => filterContacts(index, "9999")).not.toThrow()
    expect(() =>
      searchOperationalWorkspace({
        index,
        deals: [],
        leads: [],
        customers: [],
        term: "acme",
      }),
    ).not.toThrow()
  })

  it("safeBuildRelationshipIndex retorna índice vazio em falha total", () => {
    const broken = safeBuildRelationshipIndex({
      deals: null as unknown as CrmDeal[],
      leads: null as unknown as Lead[],
    })

    expect(broken.failed).toBe(false)
    expect(broken.index.contacts).toEqual([])
    expect(broken.index.companies).toEqual([])
  })
})

describe("normalizeIdentityValue", () => {
  it("coerce valores desconhecidos para string segura", () => {
    expect(normalizeIdentityValue(null)).toBe("")
    expect(normalizeIdentityValue(undefined)).toBe("")
    expect(normalizeIdentityValue(11999998888)).toBe("11999998888")
    expect(normalizeIdentityValue(["11", "99999"])).toBe("11 99999")
  })
})

describe("matchesSearchTerm", () => {
  it("encontra por dígitos parciais de telefone", () => {
    expect(
      matchesSearchTerm("99999", ["João Silva", "11999998888"]),
    ).toBe(true)
  })
})
