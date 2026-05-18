import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const body = await request.json()
  const response = await backendFetch(`/api/v1/leads/${id}/convert`, {
    method: "POST",
    body: JSON.stringify(body),
  })
  return proxyBackendResponse(response)
}
