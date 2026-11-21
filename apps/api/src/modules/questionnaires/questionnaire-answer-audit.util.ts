import type { QuestionnaireField } from '@prisma/client';

/** Trilha de auditoria sem o conteúdo da resposta (dado pessoal). */
export type QuestionnaireAnswerChange = {
  field: string;
  label: string;
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
      },
    ];
  });
}

export function questionnaireAnswersDiffer(
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
) {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  for (const key of keys) {
    if (!isSameAnswer(previous[key], next[key])) return true;
  }
  return false;
}
