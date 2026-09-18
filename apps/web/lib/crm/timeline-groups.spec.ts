import { describe, expect, it } from "vitest"

import {
  buildTimelineGroups,
  timelineGroupKeyOf,
} from "./timeline-groups"
import type { Activity } from "@/lib/data-access/modules/activities"

function mockActivity(occurredAt: string, id = "a1"): Activity {
  return {
    id,
    tenantId: "t1",
    type: "call",
    status: "completed",
    subject: "Test",
    description: null,
    outcome: null,
    occurredAt,
    nextFollowUpAt: null,
    leadId: null,
    dealId: null,
    customerId: null,
    performedById: "u1",
    performedBy: { id: "u1", name: "User", initials: "U" },
    createdAt: occurredAt,
    updatedAt: occurredAt,
  }
}

describe("timelineGroupKeyOf", () => {
  const now = new Date("2026-05-22T15:00:00")

  it("classifica hoje, ontem, esta semana e mais antigas", () => {
    expect(timelineGroupKeyOf("2026-05-22T10:00:00", now)).toBe("today")
    expect(timelineGroupKeyOf("2026-05-21T10:00:00", now)).toBe("yesterday")
    expect(timelineGroupKeyOf("2026-05-18T10:00:00", now)).toBe("this-week")
    expect(timelineGroupKeyOf("2026-05-01T10:00:00", now)).toBe("older")
  })
})

describe("buildTimelineGroups", () => {
  const now = new Date("2026-05-22T15:00:00")

  it("agrupa em quatro buckets na ordem correta", () => {
    const groups = buildTimelineGroups(
      [
        mockActivity("2026-05-01T10:00:00", "old"),
        mockActivity("2026-05-22T09:00:00", "today"),
        mockActivity("2026-05-21T09:00:00", "yesterday"),
        mockActivity("2026-05-18T09:00:00", "week"),
      ],
      now,
    )

    expect(groups.map((g) => g.key)).toEqual([
      "today",
      "yesterday",
      "this-week",
      "older",
    ])
    expect(groups[0]?.activities.map((a) => a.id)).toEqual(["today"])
  })
})
