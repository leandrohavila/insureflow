import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function GET(request: Request) {
  const response = await backendFetch("/api/v1/cross-sell/metrics", {}, request)
  return proxyBackendResponse(response)
}
