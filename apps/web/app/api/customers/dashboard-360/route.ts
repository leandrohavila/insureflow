import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function GET(request: Request) {
  const { search } = new URL(request.url)
  const response = await backendFetch(
    `/api/v1/customers/dashboard-360${search}`,
    {},
    request,
  )
  return proxyBackendResponse(response)
}
