import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  adminNavGroups,
  filterNavBySession,
  flattenNavGroups,
  hiddenNavItems,
  isAdminMaster,
  mainNav,
  realEstateNav,
  resolveOperationalNav,
} from "./navigation.ts"

describe("menu de produção", () => {
  it("Corretora não inclui Apólices, Sinistros, WhatsApp nem CRM hub", () => {
    const hrefs = mainNav.map((item) => item.href)
    assert.deepEqual(hrefs, [
      "/",
      "/leads",
      "/crm/negocios",
      "/clientes",
      "/crm/dashboard-360",
      "/crm/agenda",
      "/questionarios/templates",
      "/cotacoes",
      "/propostas",
      "/automacao",
      "/configuracoes",
    ])
    assert.equal(
      hrefs.includes("/apolices") ||
        hrefs.includes("/sinistros") ||
        hrefs.includes("/whatsapp") ||
        hrefs.includes("/crm"),
      false,
    )
  })

  it("Ávila Imóveis não inclui Visitas", () => {
    const hrefs = realEstateNav.map((item) => item.href)
    assert.deepEqual(hrefs, [
      "/",
      "/real-estate/properties",
      "/real-estate/owners",
      "/real-estate/leads",
      "/real-estate/portal",
      "/configuracoes",
    ])
    assert.equal(hrefs.includes("/real-estate/visits"), false)
  })

  it("itens ocultos permanecem no catálogo para ACL/rotas", () => {
    const hrefs = hiddenNavItems.map((item) => item.href)
    assert.ok(hrefs.includes("/apolices"))
    assert.ok(hrefs.includes("/sinistros"))
    assert.ok(hrefs.includes("/whatsapp"))
    assert.ok(hrefs.includes("/real-estate/visits"))
    assert.ok(hrefs.includes("/crm"))
  })

  it("admin consolida seguros e imóveis", () => {
    const hrefs = flattenNavGroups(adminNavGroups).map((item) => item.href)
    assert.ok(hrefs.includes("/leads"))
    assert.ok(hrefs.includes("/crm/negocios"))
    assert.ok(hrefs.includes("/crm/agenda"))
    assert.ok(hrefs.includes("/real-estate/properties"))
    assert.ok(hrefs.includes("/real-estate/portal"))
    assert.ok(hrefs.includes("/configuracoes/governanca/usuarios"))
    assert.ok(hrefs.includes("/configuracoes/governanca/matriz"))
    assert.equal(hrefs.includes("/real-estate/visits"), false)
    assert.equal(hrefs.includes("/apolices"), false)
    const labels = adminNavGroups.map((g) => g.label)
    assert.deepEqual(labels, ["", "CRM", "Seguros", "Imobiliário", "Governança"])
  })

  it("órfãs internas não entram no menu", () => {
    const hrefs = [
      ...mainNav,
      ...realEstateNav,
      ...flattenNavGroups(adminNavGroups),
    ].map((item) => item.href)
    assert.equal(hrefs.includes("/crm/customer-360"), false)
    assert.equal(hrefs.some((h) => h.startsWith("/crm/importacoes")), false)
    assert.equal(hrefs.includes("/real-estate/properties/new"), false)
  })

  it("isAdminMaster analisa todas as roles, não só a primeira", () => {
    assert.equal(isAdminMaster("admin"), true)
    assert.equal(isAdminMaster("super_admin"), true)
    assert.equal(isAdminMaster("comercial"), false)
    assert.equal(isAdminMaster(["comercial", "admin"]), true)
    assert.equal(isAdminMaster(["viewer", "leitura", "super_admin"]), true)
    assert.equal(isAdminMaster(["comercial", "gerencia"]), false)
    assert.equal(isAdminMaster([]), false)
    assert.equal(isAdminMaster(undefined), false)
  })

  it("filtro de ACL continua no menu operacional", () => {
    const session = {
      role: "comercial",
      roles: ["comercial"],
      permissions: ["dashboard:view", "leads:view"],
    } as Parameters<typeof filterNavBySession>[1]
    const filtered = filterNavBySession(mainNav, session)
    assert.deepEqual(
      filtered.map((i) => i.href),
      ["/", "/leads"],
    )
  })

  it("Admin Master não filtra o menu por ACL", () => {
    const session = {
      role: "viewer",
      roles: ["comercial", "admin"],
      permissions: [],
    } as Parameters<typeof resolveOperationalNav>[0]
    const groups = resolveOperationalNav(session, true)
    assert.deepEqual(
      groups.map((g) => g.label),
      ["", "CRM", "Seguros", "Imobiliário", "Governança"],
    )
    const hrefs = flattenNavGroups(groups).map((item) => item.href)
    assert.ok(hrefs.includes("/leads"))
    assert.ok(hrefs.includes("/real-estate/properties"))
    assert.ok(hrefs.includes("/real-estate/portal"))
    assert.ok(hrefs.includes("/configuracoes/governanca/usuarios"))
  })

  it("operador em Ávila Imóveis ainda respeita ACL", () => {
    const session = {
      role: "comercial",
      roles: ["comercial"],
      permissions: ["dashboard:view", "settings:view"],
    } as Parameters<typeof resolveOperationalNav>[0]
    const groups = resolveOperationalNav(session, true)
    assert.deepEqual(
      flattenNavGroups(groups).map((item) => item.href),
      ["/", "/configuracoes"],
    )
  })
})
