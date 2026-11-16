import { describe, expect, it } from "vitest"

import type { CrmDeal } from "@/lib/data-access/modules/crm"

import { reorderDeals } from "./pipeline-dnd"
import {
  ensureDistinctPipelineOrder,
  getSortedStageDeals,
  listPipelinePositionChanges,
  sortDealsForPipeline,
} from "./pipeline-order"

function deal(
  id: string,
  stage: CrmDeal["stage"],
  pipelineOrder: number,
  createdAt = "2026-01-01T00:00:00.000Z",
): CrmDeal {
  return {
    id,
    stage,
    pipelineOrder,
    createdAt,
    status: "open",
    title: id,
  } as CrmDeal
}

const ids = (deals: CrmDeal[], stage: CrmDeal["stage"]) =>
  getSortedStageDeals(deals, stage).map((item) => item.id)

describe("ensureDistinctPipelineOrder", () => {
  it("keeps orders untouched when the moved card is already between distinct neighbours", () => {
    const deals = [deal("a", "novo", 1000), deal("b", "novo", 1500), deal("c", "novo", 2000)]
    expect(ensureDistinctPipelineOrder(deals, "b")).toBe(deals)
  })

  it("renumbers the stage when the moved card ties with a neighbour, preserving the visual order", () => {
    const deals = [
      deal("x", "novo", 0),
      deal("a", "novo", 0),
      deal("b", "novo", 0),
      deal("c", "novo", 17000),
    ]
    const result = ensureDistinctPipelineOrder(deals, "x")
    expect(ids(result, "novo")).toEqual(["x", "a", "b", "c"])
    expect(getSortedStageDeals(result, "novo").map((item) => item.pipelineOrder)).toEqual([
      1000, 2000, 3000, 4000,
    ])
  })

  it("does not touch deals from other stages", () => {
    const other = deal("o", "contato", 0)
    const result = ensureDistinctPipelineOrder(
      [deal("a", "novo", 0), deal("b", "novo", 0), other],
      "b",
    )
    expect(result.find((item) => item.id === "o")).toBe(other)
  })
})

describe("listPipelinePositionChanges", () => {
  it("returns only deals whose stage or order changed", () => {
    const before = [deal("a", "novo", 0), deal("b", "novo", 0), deal("c", "contato", 1000)]
    const after = [deal("a", "novo", 1000), deal("b", "novo", 0), deal("c", "proposta", 1000)]
    expect(listPipelinePositionChanges(before, after).map((item) => item.id)).toEqual(["a", "c"])
  })
})

describe("reorder with tied pipelineOrder (regression)", () => {
  const tied = sortDealsForPipeline([
    deal("a", "novo", 0, "2026-08-21T10:00:00.000Z"),
    deal("b", "novo", 0, "2026-08-21T11:00:00.000Z"),
    deal("c", "novo", 0, "2026-08-21T12:00:00.000Z"),
    deal("d", "novo", 17000, "2026-07-01T00:00:00.000Z"),
  ])

  it("moving the last tied card to the top survives a re-sort after persistence", () => {
    const reordered = reorderDeals(tied, "c", "a", tied)
    expect(ids(reordered, "novo")).toEqual(["c", "a", "b", "d"])

    const final = ensureDistinctPipelineOrder(reordered, "c")
    const changes = listPipelinePositionChanges(tied, final)
    expect(changes.map((item) => item.id).sort()).toEqual(["a", "b", "c", "d"])

    expect(ids(sortDealsForPipeline(final), "novo")).toEqual(["c", "a", "b", "d"])
  })

  it("a card dropped from another stage between tied cards keeps the dropped position", () => {
    const deals = sortDealsForPipeline([...tied, deal("z", "contato", 1000)])
    const reordered = reorderDeals(deals, "z", "b", deals)
    const final = ensureDistinctPipelineOrder(reordered, "z")
    const novo = ids(sortDealsForPipeline(final), "novo")
    expect(novo.indexOf("z")).toBe(ids(reordered, "novo").indexOf("z"))
    expect(final.find((item) => item.id === "z")?.stage).toBe("novo")
  })
})
