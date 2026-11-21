import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { isCrmCanvasPath } from "./crm-canvas.ts"

describe("superfície clara do CRM", () => {
  it("inclui Leads e as páginas comerciais do CRM", () => {
    for (const path of [
      "/leads",
      "/leads?status=new",
      "/clientes",
      "/crm",
      "/crm/negocios",
      "/crm/agenda",
      "/crm/reativacoes",
      "/crm/campaigns/reactivation",
      "/crm/campanhas-reativacao",
      "/crm/dashboard-360",
      "/crm/customer-360/abc",
      "/questionarios/templates",
      "/questionarios/respostas",
      "/",
    ]) {
      assert.equal(isCrmCanvasPath(path), true, path)
    }
  })

  it("não altera Seguros, Imobiliário, Configurações nem o Portal", () => {
    for (const path of [
      "/questionario/token-publico",
      "/cotacoes",
      "/propostas",
      "/apolices",
      "/crm/renovacoes",
      "/crm/renovacoes-carteira",
      "/crm/follow-ups",
      "/automacao/reativacao",
      "/whatsapp",
      "/real-estate/properties",
      "/real-estate/portal",
      "/real-estate/leads",
      "/configuracoes",
      "/configuracoes/governanca/usuarios",
    ]) {
      assert.equal(isCrmCanvasPath(path), false, path)
    }
  })
})
