import { describe, expect, it } from "vitest"

import { resolveCrmActivityPanel } from "./use-responsive-sidebar"

describe("resolveCrmActivityPanel", () => {
  it("recolhe o painel em telas largas e mantém o acesso", () => {
    expect(
      resolveCrmActivityPanel({
        mode: "wide",
        collapsed: true,
        drawerOpen: false,
      }),
    ).toEqual({ inline: false, drawer: false, showToggle: true })
    expect(
      resolveCrmActivityPanel({
        mode: "wide",
        collapsed: false,
        drawerOpen: false,
      }).inline,
    ).toBe(true)
  })

  it("usa drawer no lugar do painel fixo em telas menores", () => {
    expect(
      resolveCrmActivityPanel({
        mode: "compact",
        collapsed: true,
        drawerOpen: true,
      }),
    ).toEqual({ inline: false, drawer: true, showToggle: true })
  })
})
