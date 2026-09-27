import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  EMPTY_PORTAL_CONFIG,
  assessTextField,
  messageFromPayload,
  portalConfigFromApi,
  portalConfigToPayload,
  portalFormFeedback,
  portalFormIsValid,
  resolvePortalPublicUrl,
  sanitizePortalUpdateBody,
} from "./portal-config-form"

const base = { ...EMPTY_PORTAL_CONFIG, companyName: "Ávila Imóveis" }

describe("portal URL and public slug validation", () => {
  it("accepts lowercase letters, numbers and hyphen in the public slug", () => {
    assert.equal(assessTextField("publicSlug", "avila-imoveis-2").error, null)
    assert.equal(portalFormIsValid({ ...base, publicSlug: "avila-imoveis-2" }), true)
  })

  for (const slug of ["Avila", "avila_imoveis", "ávila", "avila imoveis", "-avila", "avila-"]) {
    it(`rejects public slug "${slug}"`, () => {
      assert.ok(assessTextField("publicSlug", slug).error)
    })
  }

  it("requires company name and a full http(s) portal URL", () => {
    const feedback = portalFormFeedback({
      ...EMPTY_PORTAL_CONFIG,
      portalUrl: "imoveis.grupoavila.com.br",
    })
    assert.ok(feedback.companyName.error)
    assert.ok(feedback.portalUrl.error)
    assert.ok(assessTextField("portalUrl", "ftp://imoveis.grupoavila.com.br").error)
    assert.equal(assessTextField("portalUrl", "https://imoveis.grupoavila.com.br").error, null)
  })

  it("treats empty portal URL and slug as valid", () => {
    assert.equal(portalFormIsValid(base), true)
  })
})

describe("portal config mapping", () => {
  it("normalizes nulls from the API into empty strings", () => {
    const form = portalConfigFromApi({
      companyName: "Ávila",
      heroTitle: null,
      portalUrl: "https://imoveis.grupoavila.com.br",
      publicSlug: null,
      differentials: ["Atendimento", 3],
    })
    assert.equal(form.heroTitle, "")
    assert.equal(form.portalUrl, "https://imoveis.grupoavila.com.br")
    assert.equal(form.publicSlug, "")
    assert.equal(form.differentials, "Atendimento")
  })

  it("sends empty fields as null and trims portal URL and slug", () => {
    const payload = portalConfigToPayload(
      {
        ...base,
        email: "  ",
        portalUrl: " https://imoveis.grupoavila.com.br ",
        publicSlug: "avila",
        differentials: "A\n\n B ",
      },
      "bu-1",
    )
    assert.equal(payload.email, null)
    assert.equal(payload.portalUrl, "https://imoveis.grupoavila.com.br")
    assert.equal(payload.publicSlug, "avila")
    assert.deepEqual(payload.differentials, ["A", "B"])
    assert.equal(portalConfigToPayload(base, "bu-1").publicSlug, null)
  })

  it("keeps portal URL and slug when the CRM proxy sanitizes the PUT body", () => {
    const body = sanitizePortalUpdateBody({
      businessUnitId: "bu-1",
      companyName: "Ávila",
      portalUrl: "https://imoveis.grupoavila.com.br",
      publicSlug: "avila",
      id: "ignored",
      tenantId: "ignored",
    })
    assert.equal(body.portalUrl, "https://imoveis.grupoavila.com.br")
    assert.equal(body.publicSlug, "avila")
    assert.equal("id" in body, false)
    assert.equal("tenantId" in body, false)
  })
})

describe("messageFromPayload", () => {
  it("reads class-validator errors returned by the API", () => {
    assert.equal(
      messageFromPayload(
        { message: [{ property: "publicSlug", constraints: { matches: "Slug inválido" } }] },
        "fallback",
      ),
      "Slug inválido",
    )
  })

  it("reads plain string and string list messages", () => {
    assert.equal(messageFromPayload({ message: "Slug em uso" }, "fallback"), "Slug em uso")
    assert.equal(messageFromPayload({ message: ["a", "b"] }, "fallback"), "a b")
  })

  it("falls back when there is no usable message", () => {
    assert.equal(messageFromPayload(null, "fallback"), "fallback")
    assert.equal(messageFromPayload({ message: [] }, "fallback"), "fallback")
  })
})

describe("resolvePortalPublicUrl", () => {
  it("prefers configured URL and slug", () => {
    assert.equal(
      resolvePortalPublicUrl(
        { portalUrl: "https://imoveis.grupoavila.com.br/", publicSlug: "avila" },
        "http://localhost:3002",
        "unit-slug",
      ),
      "https://imoveis.grupoavila.com.br/?businessUnitSlug=avila",
    )
  })

  it("falls back when values are empty or invalid", () => {
    assert.equal(
      resolvePortalPublicUrl(
        { portalUrl: "nope", publicSlug: "Inválido" },
        "http://localhost:3002",
        "unit-slug",
      ),
      "http://localhost:3002/?businessUnitSlug=unit-slug",
    )
  })
})
