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
