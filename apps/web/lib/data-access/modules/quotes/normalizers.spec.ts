import { describe, expect, it } from "vitest"

import {
  normalizeQuoteComparison,
  normalizeQuoteComparisonList,
  normalizeQuoteLine,
  normalizeQuoteMetrics,
  normalizeProposalListItem,
} from "./normalizers"

describe("normalizeQuoteLine", () => {
  it("converte premiumValue string e coverages json", () => {
    const line = normalizeQuoteLine({
      id: "q1",
      tenantId: "t1",
      comparisonId: "c1",
      insurer: "Porto Seguro",
      product: null,
      plan: "Auto Premium",
      premiumValue: "1250.50",
      franchiseValue: "500",
      coverages: ["colisão", "terceiros"],
      assistance: "24h",
      effectiveFrom: null,
      effectiveTo: null,
      status: "quoted",
      observations: null,
      externalSource: "manual",
      externalRef: null,
      isSelected: false,
      sortOrder: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    })

    expect(line.premiumValue).toBe(1250.5)
    expect(line.franchiseValue).toBe(500)
    expect(line.coverages).toEqual(["colisão", "terceiros"])
  })
})

describe("normalizeQuoteComparisonList", () => {
  it("aplica defaults de paginação", () => {
    const response = normalizeQuoteComparisonList({
      data: [],
      meta: {},
    })

    expect(response.meta).toEqual({
      page: 1,
      limit: 0,
      total: 0,
      totalPages: 1,
    })
  })
})

describe("normalizeQuoteComparison", () => {
  it("normaliza relações resumidas", () => {
    const comparison = normalizeQuoteComparison({
      id: "c1",
      tenantId: "t1",
      title: " Comparativo ",
      workflowStatus: "quote_created",
      leadId: "l1",
      dealId: null,
      customerId: null,
      submissionId: null,
      assignedToId: null,
      notes: null,
      selectedQuoteId: null,
      sentAt: null,
      closedAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      lead: { id: "l1", name: " Lead Test " },
      deal: null,
      customer: null,
      submission: null,
      assignedTo: null,
      quotes: [],
      proposals: [],
      selectedQuote: null,
    })

    expect(comparison.title).toBe("Comparativo")
    expect(comparison.lead?.name).toBe("Lead Test")
  })
})

describe("normalizeQuoteMetrics", () => {
  it("preenche zeros quando métricas parciais", () => {
    const metrics = normalizeQuoteMetrics({})

    expect(metrics.pendingAnalysis).toBe(0)
    expect(metrics.acceptedProposals).toBe(0)
    expect(metrics.rejectedProposals).toBe(0)
    expect(metrics.averageQuoteDurationHours).toBeNull()
    expect(metrics.quoteConversionRate).toBeNull()
  })

  it("normaliza métricas derivadas de cotação", () => {
    const metrics = normalizeQuoteMetrics({
      averageQuoteDurationHours: "12.5",
      quoteConversionRate: "66.7",
    })

    expect(metrics.averageQuoteDurationHours).toBe(12.5)
    expect(metrics.quoteConversionRate).toBe(66.7)
  })
})

describe("normalizeProposalListItem", () => {
  it("normaliza proposta com campos de PDF e workflow", () => {
    const item = normalizeProposalListItem({
      id: "p1",
      tenantId: "t1",
      comparisonId: "c1",
      quoteId: null,
      status: "viewed",
      title: " Proposta Auto ",
      value: "1500",
      sentAt: "2026-01-02T00:00:00.000Z",
      viewedAt: "2026-01-03T00:00:00.000Z",
      respondedAt: null,
      expiresAt: "2026-02-01T00:00:00.000Z",
      expiredAt: null,
      notes: null,
      pdfStorageKey: "t1/p1-v1.pdf",
      pdfGeneratedAt: "2026-01-02T00:00:00.000Z",
      pdfVersion: 1,
      hasPdf: true,
      signatureProvider: null,
      signatureExternalId: null,
      signatureStatus: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-03T00:00:00.000Z",
      comparisonTitle: " Comparativo ",
      lead: { id: "l1", name: " Lead " },
      deal: null,
      customer: null,
      quote: {
        id: "q1",
        insurer: "Porto",
        plan: "Auto",
        premiumValue: "1500",
      },
    })

    expect(item.title).toBe("Proposta Auto")
    expect(item.hasPdf).toBe(true)
    expect(item.status).toBe("viewed")
    expect(item.quote?.premiumValue).toBe(1500)
  })
})
