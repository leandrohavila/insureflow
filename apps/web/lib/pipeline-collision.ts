import {
  pointerWithin,
  rectIntersection,
  type Collision,
  type CollisionDetection,
  type UniqueIdentifier,
} from "@dnd-kit/core"

import { parseStageId } from "@/lib/pipeline-dnd"
import {
  logPipelineCollision,
  pipelineDndDebugEnabled,
} from "@/lib/pipeline-dnd-debug"

export function isStageDroppableId(id: UniqueIdentifier) {
  return parseStageId(id) !== null
}

export function collisionIds(collisions: Collision[]) {
  return collisions.map((item) => String(item.id))
}

export function pickPipelineCollisions(
  collisions: Collision[],
  activeId: UniqueIdentifier,
): Collision[] {
  const withoutActive = collisions.filter(
    (item) => item.id !== activeId,
  )
  const dealHits = withoutActive.filter(
    (item) => !isStageDroppableId(item.id),
  )
  if (dealHits.length > 0) return dealHits
  return withoutActive
}

export type PipelineCollisionSnapshot = {
  strategy: "pointerWithin" | "rectIntersection"
  collisionIds: string
  pickedIds: string
}

/**
 * pointerWithin primeiro; cards sempre vencem stage:* na mesma coluna.
 */
export function createPipelineCollisionDetection(
  onDetect?: (snapshot: PipelineCollisionSnapshot) => void,
): CollisionDetection {
  return (args) => {
    const pointerHits = pointerWithin(args)
    const pickedPointer = pickPipelineCollisions(pointerHits, args.active.id)

    if (pickedPointer.length > 0) {
      const snapshot: PipelineCollisionSnapshot = {
        strategy: "pointerWithin",
        collisionIds: collisionIds(pointerHits).join(", "),
        pickedIds: collisionIds(pickedPointer).join(", "),
      }
      onDetect?.(snapshot)
      if (pipelineDndDebugEnabled) {
        logPipelineCollision({
          strategy: snapshot.strategy,
          activeId: String(args.active.id),
          collisionIds: snapshot.collisionIds,
          pickedIds: snapshot.pickedIds,
        })
      }
      return pickedPointer
    }

    const rectHits = rectIntersection(args)
    const pickedRect = pickPipelineCollisions(rectHits, args.active.id)
    const snapshot: PipelineCollisionSnapshot = {
      strategy: "rectIntersection",
      collisionIds: collisionIds(rectHits).join(", "),
      pickedIds: collisionIds(pickedRect).join(", "),
    }
    onDetect?.(snapshot)
    if (pipelineDndDebugEnabled) {
      logPipelineCollision({
        strategy: snapshot.strategy,
        activeId: String(args.active.id),
        collisionIds: snapshot.collisionIds,
        pickedIds: snapshot.pickedIds,
      })
    }

    return pickedRect
  }
}

export const pipelineCollisionDetection = createPipelineCollisionDetection()
