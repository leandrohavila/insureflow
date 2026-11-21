import { formFromVersionDefinition } from "./version-form"
import {
  currentQuestionnaireShare,
  questionnaireCanShare,
  questionnairePublicPath,
} from "./questionnaire-share"

describe("formulário pela versão vinculada", () => {
  it("ignora um campo que existe só no catálogo atual", () => {
    const form = formFromVersionDefinition(
      {
        schemaVersion: 1,
        branch: "auto",
        sections: [{ key: "vehicle_identification", title: "Dados do veículo" }],
        fields: [
          {
            key: "brand",
            label: "Marca",
            type: "TEXT",
            required: true,
            order: 0,
            sectionKey: "vehicle_identification",
          },
        ],
        rules: [{ id: "keep-me" }],
        currentCatalogOnly: "future_field",
      },
      { templateId: "tpl", tenantId: "tenant", name: "Automóvel" },
    )

    expect(form?.fields.map((field) => field.key)).toEqual(["brand"])
    expect(form?.fields[0]?.settings).toMatchObject({
      section: "vehicle_identification",
      sectionTitle: "Dados do veículo",
    })
    expect(form?.settings.rules).toEqual([{ id: "keep-me" }])
    expect(form?.settings.engineVersion).toBe(2)
    expect(JSON.stringify(form)).not.toContain("future_field")
  })

  it("não monta formulário sem campos da versão", () => {
    expect(
      formFromVersionDefinition(
        { schemaVersion: 1, fields: [], sections: [] },
        { templateId: "tpl", tenantId: "tenant", name: "Vazio" },
      ),
    ).toBeNull()
  })
})

describe("link vigente", () => {
  it("escolhe o compartilhamento ativo mais recente e ignora os encerrados", () => {
    const current = currentQuestionnaireShare([
      {
        id: "old",
        status: "active",
        createdAt: "2026-11-01T00:00:00.000Z",
        expiresAt: "2026-11-02T00:00:00.000Z",
      },
      {
        id: "revoked",
        status: "revoked",
        createdAt: "2026-11-16T00:00:00.000Z",
        expiresAt: "2099-11-20T00:00:00.000Z",
      },
      {
        id: "current",
        status: "active",
        createdAt: "2026-11-10T00:00:00.000Z",
        expiresAt: "2099-12-01T00:00:00.000Z",
      },
    ])
    expect(current?.id).toBe("current")
    expect(questionnaireCanShare("pending_client")).toBe(true)
    expect(questionnaireCanShare("completed")).toBe(false)
    expect(questionnairePublicPath("abc")).toBe("/questionario/abc")
  })
})
