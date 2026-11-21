import { proxyPublicBackend } from "@/lib/api/public-backend"

type RouteContext = {
  params: Promise<{ token: string }>
}

const PUBLIC_TOKEN = /^[A-Za-z0-9_-]{32,128}$/

function invalidLink() {
  return new Response(
    JSON.stringify({ message: "Link inválido ou expirado." }),
    { status: 404, headers: { "Content-Type": "application/json" } },
  )
}

async function publicToken(context: RouteContext) {
  const { token } = await context.params
  return PUBLIC_TOKEN.test(token) ? token : null
}

export async function GET(_request: Request, context: RouteContext) {
  const token = await publicToken(context)
  if (!token) return invalidLink()
  return proxyPublicBackend(`/api/v1/public/questionnaires/${token}`)
}

export async function PATCH(request: Request, context: RouteContext) {
  const token = await publicToken(context)
  if (!token) return invalidLink()
  const body = await request.text()
  return proxyPublicBackend(`/api/v1/public/questionnaires/${token}`, {
    method: "PATCH",
    body,
  })
}
