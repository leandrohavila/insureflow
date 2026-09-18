import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const response = await backendFetch(
    `/api/v1/policy-renewals/${id}/activity`,
    { method: "POST", body: JSON.stringify({}) },
    request,
  )
  return proxyBackendResponse(response)
}
