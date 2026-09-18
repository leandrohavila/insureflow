import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function POST() {
  const response = await backendFetch("/api/v1/opportunities/generate", {
    method: "POST",
  })
  return proxyBackendResponse(response)
}
