import { describe, expect, it } from "vitest";

import type { QuestionnaireField } from "@/lib/data-access/modules/questionnaires";

import { answersToFormState } from "./questionnaire-form-state";
import { buildSubmitAnswers } from "./questionnaire-field-validation";

const baseField = {
  tenantId: "tenant-1",
  templateId: "template-1",
  required: true,
  order: 0,
  placeholder: null,
  helpText: null,
  options: null,
  validation: null,
  settings: {},
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} satisfies Omit<QuestionnaireField, "id" | "key" | "label" | "type">;

const fields: QuestionnaireField[] = [
  {
    ...baseField,
    id: "field-1",
    key: "vehicle_model",
    label: "Modelo",
    type: "TEXT",
  },
  {
    ...baseField,
    id: "field-2",
    key: "inspection_date",
    label: "Data da vistoria",
    type: "DATE",
  },
];

describe("questionnaire editable submission form state", () => {
  it("hydrates submitted answers for editing and builds a normalized save payload", () => {
    const formState = answersToFormState(fields, {
      vehicle_model: "Civic",
      inspection_date: "2026-07-24",
    });

    expect(formState).toMatchObject({
      vehicle_model: "Civic",
      inspection_date: "24/07/2026",
    });

    expect(
      buildSubmitAnswers(fields, {
        ...formState,
        vehicle_model: "Corolla",
      }),
    ).toMatchObject({
      vehicle_model: "Corolla",
      inspection_date: "2026-07-24",
    });
  });
});
