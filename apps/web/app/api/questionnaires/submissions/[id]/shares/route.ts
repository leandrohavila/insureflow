import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const response = await backendFetch(
    `/api/v1/questionnaires/submissions/${id}/shares`,
  )
  return proxyBackendResponse(response)
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const body = await request.text()
  const response = await backendFetch(
    `/api/v1/questionnaires/submissions/${id}/shares`,
    {
      method: "POST",
      body,
    },
  )
  return proxyBackendResponse(response)
}
