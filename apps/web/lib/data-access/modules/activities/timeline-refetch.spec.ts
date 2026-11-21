import { QueryClient, QueryObserver, focusManager } from "@tanstack/react-query"

import { dedupeAndSortActivities } from "@/lib/crm/commercial-timeline"
import type { Activity } from "@/lib/data-access/modules/activities"

import { activityTimelineQueryOptions } from "./timeline-refetch"

function activity(id: string, subject: string): Activity {
  return {
    id,
    tenantId: "tenant-1",
    type: "note",
    status: "completed",
    subject,
    description: null,
    outcome: null,
    occurredAt: "2026-11-17T18:00:00.000Z",
    nextFollowUpAt: null,
    leadId: "lead-1",
    dealId: null,
    customerId: null,
    operationalEventKind: "questionnaire_completed",
    performedById: "broker-1",
    performedBy: { id: "broker-1", name: "Corretor", initials: "C" },
    createdAt: "2026-11-17T18:00:00.000Z",
    updatedAt: "2026-11-17T18:00:00.000Z",
  }
}

function list(data: Activity[]) {
  return {
    data,
    meta: { page: 1, limit: 50, total: data.length, totalPages: 1 },
  }
}

describe("atualização da timeline ao focar a janela", () => {
  afterEach(() => {
    focusManager.setFocused(true)
  })

  it("busca o evento ao voltar o foco e não consulta enquanto a janela segue ativa", async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 30_000,
          refetchOnWindowFocus: false,
        },
      },
    })
    client.mount()
    const payloads = [
      list([]),
      list([activity("completed-1", "Questionário concluído pelo cliente")]),
    ]
    let calls = 0
    const observer = new QueryObserver(
      client,
      activityTimelineQueryOptions({
        queryKey: ["activities", "lead-timeline", "lead-1"],
        queryFn: async () => {
          calls += 1
          return payloads[Math.min(calls, payloads.length) - 1] ?? payloads[1]
        },
      }),
    )
    const unsubscribe = observer.subscribe(() => undefined)

    await vi.waitFor(() => expect(calls).toBe(1))
    focusManager.setFocused(false)
    focusManager.setFocused(true)
    await vi.waitFor(() => expect(calls).toBe(2))

    await new Promise((resolve) => setTimeout(resolve, 40))
    expect(calls).toBe(2)

    const shown = dedupeAndSortActivities(
      observer.getCurrentResult().data?.data ?? [],
    )
    expect(shown.map((item) => item.id)).toEqual(["completed-1"])

    unsubscribe()
    client.unmount()
    client.clear()
  })

  it("não duplica o evento quando o foco busca a mesma conclusão outra vez", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    })
    client.mount()
    const completed = activity(
      "completed-1",
      "Questionário concluído pelo cliente",
    )
    let calls = 0
    const observer = new QueryObserver(
      client,
      activityTimelineQueryOptions({
        queryKey: ["activities", "lead-timeline", "lead-2"],
        queryFn: async () => {
          calls += 1
          return list([completed, completed])
        },
      }),
    )
    const unsubscribe = observer.subscribe(() => undefined)
    await vi.waitFor(() => expect(calls).toBe(1))

    focusManager.setFocused(false)
    focusManager.setFocused(true)
    await vi.waitFor(() => expect(calls).toBe(2))

    expect(
      dedupeAndSortActivities(observer.getCurrentResult().data?.data ?? []),
    ).toHaveLength(1)

    unsubscribe()
    client.unmount()
    client.clear()
  })

  it("mantém a lista comum sem busca ao focar a janela", async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 30_000,
          refetchOnWindowFocus: false,
        },
      },
    })
    client.mount()
    let calls = 0
    const observer = new QueryObserver(client, {
      queryKey: ["activities", "tasks"],
      queryFn: async () => {
        calls += 1
        return list([])
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    })
    const unsubscribe = observer.subscribe(() => undefined)
    await vi.waitFor(() => expect(calls).toBe(1))

    focusManager.setFocused(false)
    focusManager.setFocused(true)
    await new Promise((resolve) => setTimeout(resolve, 40))
    expect(calls).toBe(1)

    unsubscribe()
    client.unmount()
    client.clear()
  })

  it("busca de novo ao observar a timeline outra vez", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
    })
    client.mount()
    let calls = 0
    const options = activityTimelineQueryOptions({
      queryKey: ["activities", "lead-timeline", "lead-3"],
      queryFn: async () => {
        calls += 1
        return list(
          calls === 1
            ? []
            : [activity("completed-1", "Questionário concluído pelo cliente")],
        )
      },
    })
    const first = new QueryObserver(client, options)
    const stopFirst = first.subscribe(() => undefined)
    await vi.waitFor(() => {
      expect(calls).toBe(1)
      expect(first.getCurrentResult().status).toBe("success")
    })
    stopFirst()

    const second = new QueryObserver(client, options)
    const stopSecond = second.subscribe(() => undefined)
    await vi.waitFor(() =>
      expect(second.getCurrentResult().data?.data.map((item) => item.id)).toEqual([
        "completed-1",
      ]),
    )
    expect(calls).toBe(2)

    stopSecond()
    client.unmount()
    client.clear()
  })
})
