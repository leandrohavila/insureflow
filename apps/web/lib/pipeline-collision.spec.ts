import { describe, expect, it } from "vitest"

import type { Collision } from "@dnd-kit/core"

import { collisionIds, pickPipelineCollisions } from "./pipeline-collision"

function collision(id: string): Collision {
  return { id } as Collision
}

describe("pickPipelineCollisions", () => {
  it("prefers deal targets over stage when both are hit", () => {
    const hits = [
      collision("stage:novo"),
      collision("a"),
      collision("b"),
    ]
    const picked = pickPipelineCollisions(hits, "c")
    expect(collisionIds(picked)).toEqual(["a", "b"])
  })

  it("falls back to stage when only column is hit", () => {
    const hits = [collision("stage:novo")]
    const picked = pickPipelineCollisions(hits, "c")
    expect(collisionIds(picked)).toEqual(["stage:novo"])
  })

  it("excludes the active draggable from collisions", () => {
    const hits = [collision("c"), collision("a")]
    const picked = pickPipelineCollisions(hits, "c")
    expect(collisionIds(picked)).toEqual(["a"])
  })
})
