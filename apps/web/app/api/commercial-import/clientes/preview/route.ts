import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function POST(request: Request) {
  const form = await request.formData()
  const response = await backendFetch(
    "/api/v1/commercial-import/clientes/preview",
    { method: "POST", body: form },
    request,
  )
  return proxyBackendResponse(response)
}
