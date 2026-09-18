import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const response = await backendFetch(
    `/api/v1/communications/${id}`,
    {},
    request,
  )
  return proxyBackendResponse(response)
}
