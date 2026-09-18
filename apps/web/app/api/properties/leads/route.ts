import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type PropertyRow = {
  id: string
  title: string
  slug: string
}

type PropertyListPayload = {
  data?: PropertyRow[]
  total?: number
}

type PropertyLeadRow = {
  id: string
  tenantId: string
  businessUnitId: string
  propertyId: string
  name: string
  email?: string | null
  phone?: string | null
  message?: string | null
  source: string
  createdAt: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const businessUnitId = searchParams.get("businessUnitId") ?? undefined

  const listQuery = new URLSearchParams({ limit: "100", page: "1" })
  if (businessUnitId) listQuery.set("businessUnitId", businessUnitId)

  const listResponse = await backendFetch(
    `/api/v1/properties?${listQuery.toString()}`,
    {},
    request,
  )
  if (!listResponse.ok) return proxyBackendResponse(listResponse)

  const listPayload = (await listResponse.json()) as PropertyListPayload
  const properties = listPayload.data ?? []

  const leadGroups = await Promise.all(
    properties.map(async (property) => {
      const response = await backendFetch(
        `/api/v1/properties/${property.id}/leads`,
        {},
        request,
      )
      if (!response.ok) return [] as PropertyLeadRow[]
      const rows = (await response.json()) as PropertyLeadRow[]
      return rows.map((row) => ({
        ...row,
        propertyTitle: property.title,
        propertySlug: property.slug,
      }))
    }),
  )

  const merged = leadGroups
    .flat()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

  return Response.json(merged)
}
