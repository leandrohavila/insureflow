import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = {
  params: Promise<{ customerId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { customerId } = await context.params
  const response = await backendFetch(
    `/api/v1/opportunities/generate/${customerId}`,
    { method: "POST" },
  )
  return proxyBackendResponse(response)
}
