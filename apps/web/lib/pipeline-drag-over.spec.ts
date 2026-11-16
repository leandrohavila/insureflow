import { describe, expect, it } from "vitest"

import type { CrmDeal } from "@/lib/data-access/modules/crm"

import {
  resolvePipelineDragOverTarget,
  resolveStickyPipelineOver,
} from "./pipeline-drag-over"

function deal(
  id: string,
  stage: CrmDeal["stage"],
  pipelineOrder: number,
): CrmDeal {
  return {
    id,
    tenantId: "t1",
    title: id,
    company: id,
    value: 1000,
    stage,
    status: "open",
    pipelineOrder,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    contact: id,
    owner: "Owner",
    ownerInitials: "OW",
    priority: "media",
    product: "Seguro",
    lastActivity: "Hoje",
    tags: ["Aberto"],
  }
}

describe("resolveStickyPipelineOver", () => {
  const atTop = [deal("c", "novo", 500), deal("a", "novo", 1000), deal("b", "novo", 2000)]

  it("keeps sticky first card when raw over is a lower card", () => {
    expect(resolveStickyPipelineOver(atTop, "c", "b", "a")).toBe("a")
  })

  it("keeps sticky first card when raw over is the stage container", () => {
    expect(resolveStickyPipelineOver(atTop, "c", "stage:novo", "a")).toBe("a")
  })

  it("allows a new raw over above the sticky target", () => {
    const deals = [deal("c", "novo", 500), deal("a", "novo", 1000)]
    expect(resolveStickyPipelineOver(deals, "c", "a", "a")).toBe("a")
  })
})

describe("resolvePipelineDragOverTarget", () => {
  const column = [
    deal("a", "novo", 1000),
    deal("b", "novo", 2000),
    deal("c", "novo", 3000),
  ]

  it("keeps stage target while active is still last (append)", () => {
    expect(
      resolvePipelineDragOverTarget(column, "c", "stage:novo", null),
    ).toBe("stage:novo")
  })

  it("ignores stage chrome after card moved off last slot", () => {
    const atTop = [deal("c", "novo", 500), deal("a", "novo", 1000), deal("b", "novo", 2000)]
    expect(
      resolvePipelineDragOverTarget(atTop, "c", "stage:novo", "a"),
    ).toBe("a")
  })

  it("keeps stage append when active is already last in column", () => {
    expect(
      resolvePipelineDragOverTarget(column, "c", "stage:novo", null),
    ).toBe("stage:novo")
  })
})

describe("crossing columns (regression: card stuck in the intermediate column)", () => {
  // O card ativo já foi inserido ao vivo no topo de "contato" ao passar por ela,
  // com um card de "contato" como alvo pegajoso. O ponteiro agora está sobre a
  // coluna vazia "cotacao": o destino deve ser essa coluna, não a anterior.
  const crossing = [
    deal("x", "contato", 500),
    deal("m", "contato", 1000),
    deal("n", "contato", 2000),
  ]

  it("does not let a sticky card from another column override a different stage", () => {
    expect(resolveStickyPipelineOver(crossing, "x", "stage:cotacao", "m")).toBe(
      "stage:cotacao",
    )
    expect(
      resolvePipelineDragOverTarget(crossing, "x", "stage:cotacao", "m"),
    ).toBe("stage:cotacao")
  })

  it("still suppresses stage-container jitter inside the same column", () => {
    expect(resolveStickyPipelineOver(crossing, "x", "stage:contato", "m")).toBe("m")
  })

  it("ignores a stale sticky card after the active card already changed column (drop on empty column)", () => {
    // No drop o card ativo já está em "cotacao" (sozinho); o alvo pegajoso "m"
    // ainda aponta para um card de "contato".
    const dropped = [
      deal("x", "cotacao", 1000),
      deal("m", "contato", 1000),
      deal("n", "contato", 2000),
    ]
    expect(resolveStickyPipelineOver(dropped, "x", "stage:cotacao", "m")).toBe(
      "stage:cotacao",
    )
    expect(
      resolvePipelineDragOverTarget(dropped, "x", "stage:cotacao", "m"),
    ).toBe("stage:cotacao")
  })

  it("ignores a stale sticky card when dropped over a populated column", () => {
    const dropped = [
      deal("x", "proposta", 500),
      deal("p", "proposta", 1000),
      deal("m", "contato", 1000),
    ]
    expect(resolvePipelineDragOverTarget(dropped, "x", "p", "m")).toBe("p")
  })
})
