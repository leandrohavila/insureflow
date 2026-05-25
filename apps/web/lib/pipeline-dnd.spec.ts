import { describe, expect, it } from "vitest"



import type { CrmDeal } from "@/lib/data-access/modules/crm"

import { reorderDeals } from "./pipeline-dnd"

import { getSortedStageDeals } from "./pipeline-order"



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



function stageIds(deals: CrmDeal[], stage: CrmDeal["stage"]) {

  return getSortedStageDeals(deals, stage).map((item) => item.id)

}



describe("reorderDeals", () => {

  const column = [

    deal("a", "novo", 1000),

    deal("b", "novo", 2000),

    deal("c", "novo", 3000),

  ]



  it("B. last → first (upward)", () => {

    const result = reorderDeals(column, "c", "a")

    expect(stageIds(result, "novo")).toEqual(["c", "a", "b"])

    expect(result.find((item) => item.id === "c")?.pipelineOrder).toBeLessThan(

      1000,

    )

  })



  it("A. first → last (downward)", () => {

    const result = reorderDeals(column, "a", "c")

    expect(stageIds(result, "novo")).toEqual(["b", "c", "a"])

    expect(result.find((item) => item.id === "a")?.pipelineOrder).toBeGreaterThan(

      3000,

    )

  })



  it("C. middle → first", () => {

    const result = reorderDeals(column, "b", "a")

    expect(stageIds(result, "novo")).toEqual(["b", "a", "c"])

  })



  it("D. first → middle", () => {

    const result = reorderDeals(column, "a", "b")

    expect(stageIds(result, "novo")).toEqual(["b", "a", "c"])

  })



  it("stays at first when dragOver repeats over first card (baseline)", () => {

    const baseline = column

    let current = column

    current = reorderDeals(current, "c", "a", baseline)

    current = reorderDeals(current, "c", "a", baseline)

    expect(stageIds(current, "novo")).toEqual(["c", "a", "b"])

  })



  it("stays at first when dragOver repeats over lower card after upward move", () => {

    const baseline = column

    let current = reorderDeals(column, "c", "a", baseline)

    current = reorderDeals(current, "c", "b", baseline)

    expect(stageIds(current, "novo")).toEqual(["c", "a", "b"])

  })



  it("stays at first when dragOver hits stage container after upward move", () => {

    const baseline = column

    let current = reorderDeals(column, "c", "a", baseline)

    current = reorderDeals(current, "c", "stage:novo", baseline)

    expect(stageIds(current, "novo")).toEqual(["c", "a", "b"])

  })



  it("returns same reference when reorder is redundant (idempotent)", () => {

    const baseline = column

    const once = reorderDeals(column, "c", "a", baseline)

    const twice = reorderDeals(once, "c", "a", baseline)

    expect(twice).toBe(once)

  })



  it("F. cross-column drop on middle card", () => {

    const input = [

      ...column,

      deal("x", "qualificacao", 1000),

      deal("y", "qualificacao", 2000),

    ]

    const result = reorderDeals(input, "a", "y")

    expect(stageIds(result, "novo")).toEqual(["b", "c"])

    expect(stageIds(result, "qualificacao")).toEqual(["x", "a", "y"])

  })



  it("E. cross-column drop on first card in target", () => {

    const input = [

      ...column,

      deal("x", "qualificacao", 1000),

      deal("y", "qualificacao", 2000),

    ]

    const result = reorderDeals(input, "c", "x")

    expect(stageIds(result, "qualificacao")).toEqual(["c", "x", "y"])

  })



  it("moves across columns at the requested index", () => {

    const input = [

      deal("a", "novo", 1000),

      deal("b", "novo", 2000),

      deal("c", "qualificacao", 1000),

      deal("d", "qualificacao", 2000),

    ]

    const result = reorderDeals(input, "a", "d")

    expect(stageIds(result, "qualificacao")).toEqual(["c", "a", "d"])

    expect(result.find((item) => item.id === "a")?.stage).toBe("qualificacao")

  })



  it("G. appends when dropping on empty column container", () => {

    const input = [deal("a", "novo", 1000), deal("b", "novo", 2000)]

    const result = reorderDeals(input, "a", "stage:proposta")

    expect(stageIds(result, "proposta")).toEqual(["a"])

  })

})


