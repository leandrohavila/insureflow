import { describe, expect, it } from "vitest"

import type { CrmDeal } from "@/lib/data-access/modules/crm"
import type { Lead } from "@/lib/data-access/modules/leads"
import type { QuestionnaireField } from "@/lib/data-access/modules/questionnaires"

import { evaluateCommercialIntelligence } from "./commercial-journey.service"

function mockDeal(overrides: Partial<CrmDeal> = {}): CrmDeal {
  return {
    id: "deal-1",
    tenantId: "tenant-1",
    title: "Auto — João Silva",
    company: "Particular",
    value: 2500,
    stage: "proposta",
    status: "open",
    pipelineOrder: 0,
    contact: "João Silva",
    owner: "Ana",
    ownerInitials: "AN",
    priority: "media",
    product: "Auto",
    lastActivity: "1d",
    tags: [],
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-08T00:00:00Z",
    convertedLead: {
      id: "lead-1",
      name: "João Silva",
      phone: "11999998888",
      email: "joao@example.com",
    },
    commercialContext: {
      questionnaire: {
        status: "submitted",
        submissionId: "sub-1",
        updatedAt: "2026-07-07T00:00:00Z",
      },
      quote: {
        comparisonId: "cmp-1",
        workflowStatus: "quote_created",
        title: "Comparativo Auto",
        lineCount: 2,
        hasSelectedQuote: true,
        updatedAt: "2026-07-08T00:00:00Z",
      },
      phone: "11999998888",
      lastContactAt: null,
      lastInteractionAt: "2026-07-08T00:00:00Z",
      responsible: "Ana",
    },
    ...overrides,
  }
}

const fields: QuestionnaireField[] = [
  {
    id: "f-cpf",
    tenantId: "tenant-1",
    templateId: "tpl-1",
    key: "cpf",
    label: "CPF",
    type: "TEXT",
    required: true,
    order: 1,
    settings: {},
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
  },
  {
    id: "f-cep",
    tenantId: "tenant-1",
    templateId: "tpl-1",
    key: "cep",
    label: "CEP",
    type: "TEXT",
    required: true,
    order: 2,
    settings: {},
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
  },
  {
    id: "f-vehicle",
    tenantId: "tenant-1",
    templateId: "tpl-1",
    key: "veiculo",
    label: "Veículo",
    type: "TEXT",
    required: true,
    order: 3,
    settings: {},
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
  },
]

describe("CommercialJourneyService", () => {
  it("calculates journey stages from deal context", () => {
    const snapshot = evaluateCommercialIntelligence({
      deal: mockDeal(),
      lead: {
        id: "lead-1",
        tenantId: "tenant-1",
        name: "João Silva",
        phone: "11999998888",
        email: "joao@example.com",
        documentType: "cpf",
        document: "52998224725",
        status: "converted",
        createdAt: "2026-07-01T00:00:00Z",
        updatedAt: "2026-07-08T00:00:00Z",
        initials: "JS",
      } satisfies Lead,
      questionnaireAnswers: {
        cpf: "529.982.247-25",
        cep: "01310-100",
        veiculo: "Honda Civic 2022",
      },
      questionnaireFields: fields,
      quoteComparisons: [
        {
          id: "cmp-1",
          tenantId: "tenant-1",
          title: "Comparativo",
          workflowStatus: "quote_created",
          leadId: "lead-1",
          dealId: "deal-1",
          customerId: null,
          submissionId: null,
          assignedToId: null,
          notes: null,
          selectedQuoteId: "q-1",
          sentAt: null,
          closedAt: null,
          createdAt: "2026-07-08T00:00:00Z",
          updatedAt: "2026-07-08T00:00:00Z",
          lead: null,
          deal: null,
          customer: null,
          submission: null,
          assignedTo: null,
          quotes: [
            {
              id: "q-1",
              tenantId: "tenant-1",
              comparisonId: "cmp-1",
              insurer: "Porto",
              product: "Auto",
              plan: null,
              premiumValue: 2500,
              franchiseValue: null,
              coverages: [],
              assistance: null,
              effectiveFrom: null,
              effectiveTo: null,
              status: "selected",
              observations: null,
              externalSource: "manual",
              externalRef: null,
              isSelected: true,
              sortOrder: 0,
              createdAt: "2026-07-08T00:00:00Z",
              updatedAt: "2026-07-08T00:00:00Z",
            },
            {
              id: "q-2",
              tenantId: "tenant-1",
              comparisonId: "cmp-1",
              insurer: "Tokio",
              product: "Auto",
              plan: null,
              premiumValue: 2600,
              franchiseValue: null,
              coverages: [],
              assistance: null,
              effectiveFrom: null,
              effectiveTo: null,
              status: "quoted",
              observations: null,
              externalSource: "manual",
              externalRef: null,
              isSelected: false,
              sortOrder: 1,
              createdAt: "2026-07-08T00:00:00Z",
              updatedAt: "2026-07-08T00:00:00Z",
            },
          ],
          proposals: [],
          selectedQuote: null,
        },
      ],
      proposals: [],
    })

    expect(snapshot.journey.find((item) => item.id === "lead")?.status).toBe(
      "COMPLETED",
    )
    expect(
      snapshot.journey.find((item) => item.id === "questionnaire")?.status,
    ).toBe("COMPLETED")
    expect(
      snapshot.journey.find((item) => item.id === "comparison")?.status,
    ).toBe("COMPLETED")
    expect(snapshot.checklist.items.find((item) => item.id === "cpf")?.completed).toBe(
      true,
    )
    expect(snapshot.score.value).toBeGreaterThan(50)
    expect(snapshot.recommendations.some((item) => item.id === "missing-proposal")).toBe(
      true,
    )
  })

  it("flags blocked policy stage without proposals", () => {
    const snapshot = evaluateCommercialIntelligence({
      deal: mockDeal({
        commercialContext: {
          questionnaire: {
            status: "draft",
            submissionId: null,
            updatedAt: null,
          },
          quote: null,
          phone: null,
          lastContactAt: null,
          lastInteractionAt: null,
          responsible: null,
        },
        convertedLead: null,
        product: "",
      }),
    })

    expect(snapshot.journey.find((item) => item.id === "lead")?.status).toBe(
      "NOT_STARTED",
    )
    expect(snapshot.score.tier).toBe("low")
    expect(snapshot.recommendations.length).toBeGreaterThan(0)
  })
})
