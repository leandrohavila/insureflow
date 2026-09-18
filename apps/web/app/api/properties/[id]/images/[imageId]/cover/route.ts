import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = { params: Promise<{ id: string; imageId: string }> }

export async function POST(request: Request, context: RouteContext) {
  const { id, imageId } = await context.params
  const response = await backendFetch(
    `/api/v1/properties/${id}/images/${imageId}/cover`,
    { method: "POST", body: JSON.stringify({}) },
    request,
  )
  return proxyBackendResponse(response)
}
