/**
 * Sprint UX 2.0 smoke — API + rotas web de produção.
 * Requer PROD_ADMIN_PASSWORD.
 */
const api = (process.env.API_URL || "https://api.corretoraavila.com.br").replace(
  /\/$/,
  "",
)
const web = (process.env.WEB_URL || "https://corretoraavila.com.br").replace(
  /\/$/,
  "",
)
const tenantSlug = "insureflow"
const email = process.env.PROD_ADMIN_EMAIL || "leandro@corretoraavila.com.br"
const password = process.env.PROD_ADMIN_PASSWORD || ""

const results = []

function rec(name, ok, detail) {
  results.push({ name, ok, detail })
  console.log(`${ok ? "[OK]" : "[FAIL]"} ${name}${detail ? ` — ${detail}` : ""}`)
}

async function req(path, opts = {}, token) {
  const headers = { ...(opts.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  if (opts.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json"
  }
  const res = await fetch(api + path, {
    ...opts,
    headers,
    signal: AbortSignal.timeout(45000),
  })
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text.slice(0, 240)
  }
  return { status: res.status, ok: res.ok, body }
}

async function webGet(path) {
  const res = await fetch(web + path, {
    redirect: "manual",
    signal: AbortSignal.timeout(30000),
  })
  return { status: res.status, location: res.headers.get("location") }
}

async function main() {
  console.log("=== Sprint UX 2.0 smoke ===")
  console.log("API:", api)
  console.log("WEB:", web)

  for (const [path, name] of [
    ["/api/v1/health", "Health"],
    ["/api/v1/health/db", "Health DB"],
    ["/api/v1/health/redis", "Health Redis"],
  ]) {
    const r = await req(path)
    rec(name, r.status === 200, String(r.status))
  }

  const loginPage = await webGet("/login")
  rec("WEB /login", loginPage.status === 200, String(loginPage.status))
  const leadsAnon = await webGet("/leads")
  rec(
    "WEB /leads anon redirect",
    leadsAnon.status === 307 || leadsAnon.status === 302,
    `${leadsAnon.status} → ${leadsAnon.location || ""}`,
  )
  const reLeadsAnon = await webGet("/real-estate/leads")
  rec(
    "WEB /real-estate/leads anon redirect",
    reLeadsAnon.status === 307 || reLeadsAnon.status === 302,
    String(reLeadsAnon.status),
  )
  const govAnon = await webGet("/configuracoes/governanca")
  rec(
    "WEB governança anon redirect",
    govAnon.status === 307 || govAnon.status === 302,
    String(govAnon.status),
  )

  if (!password) {
    rec("Login", false, "PROD_ADMIN_PASSWORD ausente")
    process.exit(1)
  }

  const login = await req("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ tenantSlug, email, password }),
  })
  const token = login.body.accessToken || login.body.access_token
  rec("Login", Boolean(token), String(login.status))
  if (!token) process.exit(1)

  const bus = await req("/api/v1/business-units", {}, token)
  const units = bus.body.data || bus.body || []
  const insurance = units.find((u) => u.type === "INSURANCE")
  const realEstate = units.find((u) => u.type === "REAL_ESTATE")
  rec(
    "Business units",
    Boolean(insurance && realEstate),
    `${insurance?.name || "?"} | ${realEstate?.name || "?"}`,
  )

  const leadsAll = await req("/api/v1/leads?limit=1", {}, token)
  rec("Leads totais", leadsAll.ok, `total=${leadsAll.body.meta?.total}`)

  const leadsIns = await req(
    `/api/v1/leads?limit=1&businessUnitId=${insurance?.id || ""}`,
    {},
    token,
  )
  rec("Leads seguros", leadsIns.ok, `total=${leadsIns.body.meta?.total}`)

  const leadsRe = await req(
    `/api/v1/leads?limit=1&businessUnitId=${realEstate?.id || ""}`,
    {},
    token,
  )
  rec("Leads imobiliários", leadsRe.ok, `total=${leadsRe.body.meta?.total}`)

  const customersIns = await req(
    `/api/v1/customers?limit=1&businessUnitId=${insurance?.id || ""}`,
    {},
    token,
  )
  rec(
    "Clientes seguros",
    customersIns.ok,
    `total=${customersIns.body.meta?.total}`,
  )
  const customersRe = await req(
    `/api/v1/customers?limit=1&businessUnitId=${realEstate?.id || ""}`,
    {},
    token,
  )
  rec(
    "Clientes imobiliários",
    customersRe.ok,
    `total=${customersRe.body.meta?.total}`,
  )

  const stamp = Date.now()
  const createdIns = await req(
    "/api/v1/leads",
    {
      method: "POST",
      body: JSON.stringify({
        name: `UX20 Seguro ${stamp}`,
        phone: "11999990001",
        source: "smoke-ux-2.0",
        businessUnitId: insurance.id,
      }),
      headers: { "Idempotency-Key": `ux20-ins-${stamp}` },
    },
    token,
  )
  rec(
    "POST Lead Seguro",
    createdIns.ok && createdIns.body.businessUnitId === insurance.id,
    createdIns.ok ? createdIns.body.id : JSON.stringify(createdIns.body).slice(0, 160),
  )

  const createdRe = await req(
    "/api/v1/leads",
    {
      method: "POST",
      body: JSON.stringify({
        name: `UX20 Imobiliario ${stamp}`,
        phone: "11999990002",
        source: "smoke-ux-2.0",
        businessUnitId: realEstate.id,
        interestCategories: ["PROPERTY_BUY"],
      }),
      headers: { "Idempotency-Key": `ux20-re-${stamp}` },
    },
    token,
  )
  rec(
    "POST Lead Imobiliário",
    createdRe.ok && createdRe.body.businessUnitId === realEstate.id,
    createdRe.ok ? createdRe.body.id : JSON.stringify(createdRe.body).slice(0, 160),
  )

  if (createdRe.ok) {
    const byId = await req(`/api/v1/leads/${createdRe.body.id}`, {}, token)
    rec(
      "GET Lead Imobiliário por id",
      byId.ok && byId.body.businessUnitId === realEstate.id,
      byId.ok ? byId.body.businessUnitId : String(byId.status),
    )
    const q = encodeURIComponent(`UX20 Imobiliario ${stamp}`)
    const filtered = await req(
      `/api/v1/leads?businessUnitId=${realEstate.id}&search=${q}`,
      {},
      token,
    )
    const found = (filtered.body.data || []).some((l) => l.id === createdRe.body.id)
    rec(
      "Filtro BU imobiliária encontra o lead",
      found,
      `status=${filtered.status} n=${(filtered.body.data || []).length}`,
    )
  }

  const customers = await req("/api/v1/customers?limit=1", {}, token)
  rec("Clientes lista", customers.ok, `total=${customers.body.meta?.total}`)
  const customerId = customers.body.data?.[0]?.id
  if (customerId) {
    const c360 = await req(`/api/v1/customers/${customerId}/360`, {}, token)
    rec(
      "Customer 360",
      c360.ok && Boolean(c360.body.customer),
      c360.ok ? customerId : String(c360.status),
    )
  } else {
    rec("Customer 360", true, "sem cliente para abrir (skip)")
  }

  const users = await req("/api/v1/users", {}, token)
  rec("Governança users", users.ok, String(users.status))

  const allOk = results.every((r) => r.ok)
  console.log(allOk ? "SMOKE UX 2.0 OK" : "SMOKE UX 2.0 COM FALHAS")
  process.exit(allOk ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
