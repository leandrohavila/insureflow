import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "insureflow_access_token" ? { value: "test-token" } : undefined,
    set: () => undefined,
    delete: () => undefined,
  }),
}))

vi.mock("@/lib/auth/constants", () => ({
  API_ACCESS_TOKEN_COOKIE: "insureflow_access_token",
  API_REFRESH_TOKEN_COOKIE: "insureflow_refresh_token",
}))

vi.mock("@/lib/auth/config", () => ({ sessionCookieOptions: {} }))

import { backendFetch } from "./backend"

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("backendFetch", () => {
  it("returns an explicit 503 (not an unhandled 500) when the API is unreachable", async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined)
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(
        Object.assign(new TypeError("fetch failed"), {
          cause: new Error("connect ECONNREFUSED 127.0.0.1:4000"),
        }),
      ),
    )

    const response = await backendFetch("/api/v1/leads?page=1&limit=25")
    expect(response.status).toBe(503)
    const body = (await response.json()) as { message: string }
    expect(body.message).toMatch(/API indispon/)
  })

  it("passes through real backend responses untouched", async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined)
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: [], meta: { total: 0 } }), {
          status: 200,
        }),
      ),
    )

    const response = await backendFetch("/api/v1/leads")
    expect(response.status).toBe(200)
  })

  it("does not swallow non-network errors", async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined)
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")))

    await expect(backendFetch("/api/v1/leads")).rejects.toThrow("boom")
  })
})
