import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type PropertyListPayload = {
  data?: unknown[]
  total?: number
}

type PropertyLeadRow = { id: string }

async function fetchCount(
  request: Request,
  query: URLSearchParams,
): Promise<number> {
  const response = await backendFetch(
    `/api/v1/properties?${query.toString()}`,
    {},
    request,
  )
  if (!response.ok) return 0
  const payload = (await response.json()) as PropertyListPayload
  return payload.total ?? payload.data?.length ?? 0
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const businessUnitId = searchParams.get("businessUnitId")

  const baseQuery = new URLSearchParams({ limit: "1", page: "1" })
  if (businessUnitId) baseQuery.set("businessUnitId", businessUnitId)

  const publishedQuery = new URLSearchParams(baseQuery)
  publishedQuery.set("published", "true")

  const [totalProperties, publishedProperties, featuredProperties] =
    await Promise.all([
      fetchCount(request, baseQuery),
      fetchCount(request, publishedQuery),
      (async () => {
        const featuredQuery = new URLSearchParams(baseQuery)
        featuredQuery.set("limit", "100")
        featuredQuery.set("page", "1")
        const response = await backendFetch(
          `/api/v1/properties?${featuredQuery.toString()}`,
          {},
          request,
        )
        if (!response.ok) return 0
        const payload = (await response.json()) as {
          data?: { featured?: boolean }[]
        }
        return (payload.data ?? []).filter((row) => row.featured).length
      })(),
    ])

  const listQuery = new URLSearchParams({ limit: "100", page: "1" })
  if (businessUnitId) listQuery.set("businessUnitId", businessUnitId)

  const listResponse = await backendFetch(
    `/api/v1/properties?${listQuery.toString()}`,
    {},
    request,
  )

  let leadsReceived = 0
  if (listResponse.ok) {
    const listPayload = (await listResponse.json()) as {
      data?: { id: string }[]
    }
    const properties = listPayload.data ?? []
    const leadCounts = await Promise.all(
      properties.map(async (property) => {
        const response = await backendFetch(
          `/api/v1/properties/${property.id}/leads`,
          {},
          request,
        )
        if (!response.ok) return 0
        const rows = (await response.json()) as PropertyLeadRow[]
        return rows.length
      }),
    )
    leadsReceived = leadCounts.reduce((sum, count) => sum + count, 0)
  }

  return Response.json({
    totalProperties,
    publishedProperties,
    featuredProperties,
    leadsReceived,
    scheduledVisits: 0,
  })
}
