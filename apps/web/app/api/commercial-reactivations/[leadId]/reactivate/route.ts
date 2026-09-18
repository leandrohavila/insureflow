import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type Params = { params: Promise<{ leadId: string }> }

export async function POST(request: Request, { params }: Params) {
  const { leadId } = await params
  const body = await request.text()
  const response = await backendFetch(
    `/api/v1/commercial-reactivations/${leadId}/reactivate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    },
    request,
  )
  return proxyBackendResponse(response)
}
