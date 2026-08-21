import type { QuestionnaireField } from '@prisma/client';

export type QuestionnaireAnswerChange = {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
};

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function isSameAnswer(left: unknown, right: unknown): boolean {
  return stableJson(left) === stableJson(right);
}

export function buildQuestionnaireAnswerChanges(
  fields: Pick<QuestionnaireField, 'key' | 'label'>[],
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
): QuestionnaireAnswerChange[] {
  return fields.flatMap((field) => {
    const oldValue = previous[field.key];
    const newValue = next[field.key];

    if (isSameAnswer(oldValue, newValue)) return [];

    return [
      {
        field: field.key,
        label: field.label,
        oldValue,
        newValue,
      },
    ];
  });
}
