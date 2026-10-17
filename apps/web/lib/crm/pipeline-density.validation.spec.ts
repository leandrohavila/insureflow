/**
 * Validação manual — modos Compacto e Confortável do pipeline.
 *
 * Rode:
 *   node --test --experimental-strip-types apps/web/lib/crm/pipeline-density.validation.spec.ts
 *
 * No navegador, em /crm/negocios:
 * 1. Clique em Confortável. O botão ativo fica preenchido na hora.
 * 2. Os cards ficam mais altos, com mais respiro, e passam a mostrar
 *    empresa, contato, responsável, produto, estágio e última interação.
 * 3. Clique em Compacto. Os cards encolhem, o vão entre eles diminui
 *    e somem empresa, contato, nome do responsável, produto e estágio.
 * 4. Recarregue a página. O último modo continua selecionado
 *    (localStorage `insureflow:crm-workspace-prefs-v1`).
 * 5. Troque para Lista. Compacto usa linhas baixas e menos colunas;
 *    Confortável aumenta o padding e devolve contato, produto e questionário.
 * 6. Repita o toggle em /crm (visão geral). O funil acompanha o mesmo modo.
 */
import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"

import {
  CRM_WORKSPACE_PREFS_KEY,
  patchCrmWorkspacePreferences,
  readCrmWorkspacePreferences,
} from "./crm-workspace-preferences.ts"
import {
  PIPELINE_STANDARD_STAGE_COUNT,
  PIPELINE_WIDE_VIEWPORT_PX,
  pipelineBoardWidthAtViewport,
  resolvePipelineLaneLayout,
  runPipelineDensityManualValidation,
  resolvePipelineDensity,
} from "./pipeline-density.ts"

type MemoryStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

function installMemoryStorage() {
  const memory = new Map<string, string>()
  const storage: MemoryStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value)
    },
    removeItem: (key) => {
      memory.delete(key)
    },
  }
  const previous = globalThis.window
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage },
  })
  return {
    memory,
    restore() {
      if (previous === undefined) {
        delete (globalThis as { window?: Window }).window
        return
      }
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: previous,
      })
    },
  }
}

describe("validação manual — densidade do pipeline", () => {
  let restore: (() => void) | undefined

  afterEach(() => {
    restore?.()
    restore = undefined
  })

  it("cada passo perceptível do roteiro passa", () => {
    const checks = runPipelineDensityManualValidation()
    assert.ok(checks.length >= 8)
    for (const check of checks) {
      assert.equal(check.pass, true, `${check.id}: ${check.label}`)
    }
  })

  it("compacto e confortável não compartilham classe de card", () => {
    const compact = resolvePipelineDensity("compact")
    const comfortable = resolvePipelineDensity("comfortable")
    assert.equal(compact.cardClassName, "deal-card-v2--compact")
    assert.equal(comfortable.cardClassName, "deal-card-v2--comfortable")
    assert.equal(compact.dataDensity, "compact")
    assert.equal(comfortable.dataDensity, "comfortable")
    assert.ok(comfortable.cardMinHeightPx > compact.cardMinHeightPx)
    assert.ok(comfortable.laneWidthPx > compact.laneWidthPx)
    assert.ok(compact.laneMinWidthPx < 200)
    assert.ok(comfortable.laneMinWidthPx < 200)
    assert.ok(comfortable.laneMinWidthPx < comfortable.laneWidthPx)
  })

  it("cabe as 5 etapas em viewport de 1600px com a timeline aberta", () => {
    const board = pipelineBoardWidthAtViewport(PIPELINE_WIDE_VIEWPORT_PX, {
      timelineOpen: true,
      sidebarOpen: true,
    })
    for (const density of ["compact", "comfortable"] as const) {
      const layout = resolvePipelineLaneLayout({
        containerWidth: board,
        stageCount: PIPELINE_STANDARD_STAGE_COUNT,
        density,
      })
      assert.equal(layout.fitsWithoutScroll, true, density)
    }
  })

  it("persiste Compacto e Confortável no localStorage", () => {
    const installed = installMemoryStorage()
    restore = installed.restore

    const comfortable = patchCrmWorkspacePreferences("density", "comfortable")
    assert.equal(comfortable.density, "comfortable")
    const raw = installed.memory.get(CRM_WORKSPACE_PREFS_KEY)
    assert.ok(raw)
    assert.equal(JSON.parse(raw).density, "comfortable")
    assert.equal(readCrmWorkspacePreferences().density, "comfortable")
    assert.equal(
      resolvePipelineDensity(readCrmWorkspacePreferences().density).mode,
      "comfortable",
    )

    patchCrmWorkspacePreferences("density", "compact")
    assert.equal(readCrmWorkspacePreferences().density, "compact")
    assert.equal(
      JSON.parse(installed.memory.get(CRM_WORKSPACE_PREFS_KEY) ?? "{}").density,
      "compact",
    )
  })
})
