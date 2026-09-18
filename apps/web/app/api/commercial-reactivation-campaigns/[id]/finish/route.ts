import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.text()
  const response = await backendFetch(
    `/api/v1/commercial-reactivation-campaigns/${id}/finish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body || "{}",
    },
    request,
  )
  return proxyBackendResponse(response)
}
