import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function POST(request: Request) {
  const response = await backendFetch(
    "/api/v1/communications/evolution/qrcode",
    { method: "POST", body: "{}" },
    request,
  )
  return proxyBackendResponse(response)
}
