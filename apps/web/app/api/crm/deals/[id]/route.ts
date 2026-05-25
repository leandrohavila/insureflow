import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params
  const body = await request.json()
  if (
    process.env.DEAL_CONTRACT_DEBUG === "1" ||
    process.env.RUNTIME_AUDIT === "1"
  ) {
    console.warn("[runtime-audit][bff.patch] received", id, JSON.stringify(body))
    console.warn(
      "[runtime-audit][bff.patch] backend",
      process.env.API_INTERNAL_URL ?? process.env.API_URL ?? "http://localhost:4000",
    )
  }
  const response = await backendFetch(`/api/v1/crm/deals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
  return proxyBackendResponse(response)
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const response = await backendFetch(`/api/v1/crm/deals/${id}`, {
    method: "DELETE",
  })
  return proxyBackendResponse(response)
}
