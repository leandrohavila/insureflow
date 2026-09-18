import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function GET() {
  const response = await backendFetch("/api/v1/quotes/metrics")
  return proxyBackendResponse(response)
}
