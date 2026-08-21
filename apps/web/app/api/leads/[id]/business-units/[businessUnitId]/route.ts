import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = {
  params: Promise<{ id: string; businessUnitId: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, businessUnitId } = await context.params
  const response = await backendFetch(
    `/api/v1/leads/${id}/business-units/${businessUnitId}`,
    { method: "DELETE" },
  )
  return proxyBackendResponse(response)
}
