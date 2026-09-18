import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type Params = { params: Promise<{ id: string; campaignLeadId: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id, campaignLeadId } = await params
  const body = await request.text()
  const response = await backendFetch(
    `/api/v1/commercial-reactivation-campaigns/${id}/leads/${campaignLeadId}/reactivate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body || "{}",
    },
    request,
  )
  return proxyBackendResponse(response)
}
