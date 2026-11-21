import {
  QUESTIONNAIRE_BRANCH_SECTIONS,
  type QuestionnaireBranchId,
  type QuestionnaireSectionDefinition,
} from './questionnaire-branches';

export const QUESTIONNAIRE_VERSION_SCHEMA = 1;

export type QuestionnaireVersionFieldSnapshot = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
  sectionKey: string | null;
  placeholder: string | null;
  helpText: string | null;
  options: unknown;
  validation: unknown;
  settings?: unknown;
};

export type QuestionnaireVersionDefinition = {
  schemaVersion: typeof QUESTIONNAIRE_VERSION_SCHEMA;
  branch: QuestionnaireBranchId | null;
  sections: QuestionnaireSectionDefinition[];
  fields: QuestionnaireVersionFieldSnapshot[];
  catalogVersion?: number;
  rules?: unknown;
};

export type QuestionnaireVersionFieldSource = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
  placeholder?: string | null;
  helpText?: string | null;
  options?: unknown;
  validation?: unknown;
  settings?: unknown;
};

function sectionKeyFromSettings(settings: unknown): string | null {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return null;
  }
  const section = (settings as Record<string, unknown>).section;
  return typeof section === 'string' && section.trim() ? section.trim() : null;
}

function copySettings(settings: unknown): Record<string, unknown> | null {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return null;
  }
  return { ...(settings as Record<string, unknown>) };
}

export function buildQuestionnaireVersionDefinition(input: {
  branch: QuestionnaireBranchId | null;
  fields?: readonly QuestionnaireVersionFieldSource[];
  catalogVersion?: number;
  rules?: unknown;
}): QuestionnaireVersionDefinition {
  const sections = input.branch
    ? QUESTIONNAIRE_BRANCH_SECTIONS[input.branch].map((section) => ({
        ...section,
      }))
    : [];

  const fields = (input.fields ?? [])
    .map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      order: field.order,
      sectionKey: sectionKeyFromSettings(field.settings),
      placeholder: field.placeholder ?? null,
      helpText: field.helpText ?? null,
      options: field.options ?? null,
      validation: field.validation ?? null,
      settings: copySettings(field.settings),
    }))
    .sort(
      (left, right) =>
        left.order - right.order || left.key.localeCompare(right.key),
    );

  return {
    schemaVersion: QUESTIONNAIRE_VERSION_SCHEMA,
    branch: input.branch,
    sections,
    fields,
    ...(input.catalogVersion !== undefined
      ? { catalogVersion: input.catalogVersion }
      : {}),
    ...(Array.isArray(input.rules) && input.rules.length > 0
      ? { rules: input.rules }
      : {}),
  };
}

export function readVersionDefinition(
  value: unknown,
): QuestionnaireVersionDefinition | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== QUESTIONNAIRE_VERSION_SCHEMA) return null;
  if (!Array.isArray(record.sections) || !Array.isArray(record.fields)) {
    return null;
  }
  return record as QuestionnaireVersionDefinition;
}
