/**
 * Smoke local forçado em localhost (ignora API_URL de produção no ambiente).
 */
const api = "http://localhost:4000"
const web = "http://localhost:3000"
const credentials = {
  email: "admin@insureflow.com",
  password: "Admin@2026!",
  tenantSlug: "insureflow",
}

function rec(name, ok, detail) {
  console.log(`${ok ? "[OK]" : "[FAIL]"} ${name}${detail ? ` — ${detail}` : ""}`)
  return { name, ok, detail }
}

async function apiReq(path, opts = {}, token) {
  const headers = { ...(opts.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  if (opts.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json"
  const res = await fetch(api + path, {
    ...opts,
    headers,
    signal: AbortSignal.timeout(20000),
  })
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text.slice(0, 180)
  }
  return { status: res.status, ok: res.ok, body }
}

async function main() {
  const results = []
  const health = await apiReq("/api/v1/health")
  results.push(rec("Health", health.status === 200, String(health.status)))
  const db = await apiReq("/api/v1/health/db")
  results.push(rec("Health DB", db.status === 200, String(db.status)))

  const login = await apiReq("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  })
  const token = login.body.accessToken
  results.push(rec("Login API", Boolean(token), String(login.status)))
  if (!token) process.exit(1)

  const leads = await apiReq("/api/v1/leads?limit=1", {}, token)
  results.push(rec("GET /api/v1/leads", leads.ok, `total=${leads.body?.meta?.total}`))
  const deals = await apiReq("/api/v1/crm/deals", {}, token)
  results.push(rec("GET /api/v1/crm/deals", deals.ok, String(deals.status)))

  const bff = await fetch(`${web}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
      tenantSlug: credentials.tenantSlug,
    }),
    signal: AbortSignal.timeout(20000),
  })
  const cookies = bff.headers.getSetCookie?.() ?? []
  const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ")
  results.push(
    rec(
      "BFF login",
      bff.status === 200 && cookieHeader.includes("insureflow-session"),
      `status=${bff.status} cookies=${cookies.length}`,
    ),
  )

  for (const path of ["/", "/leads", "/crm/negocios"]) {
    const page = await fetch(web + path, {
      headers: { cookie: cookieHeader },
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    })
    results.push(
      rec(`WEB ${path}`, page.status === 200, String(page.status)),
    )
  }

  const failed = results.filter((r) => !r.ok)
  if (failed.length) {
    console.error(`\n${failed.length} failed`)
    process.exit(1)
  }
  console.log(`\n${results.length}/${results.length} local capture smoke OK`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
