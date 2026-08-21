import { backendFetch, proxyBackendBinary } from "@/lib/api/backend"

export async function GET() {
  const response = await backendFetch(
    "/api/v1/commercial-import/clientes/template",
  )
  return proxyBackendBinary(response)
}
