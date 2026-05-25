import type {
  BackendQuestionnaireField,
  BackendQuestionnaireSubmission,
  BackendQuestionnaireSubmissionListResponse,
  BackendQuestionnaireTemplate,
  BackendQuestionnaireTemplateListResponse,
  JsonObject,
  QuestionnaireField,
  QuestionnaireFieldOption,
  QuestionnaireSubmission,
  QuestionnaireSubmissionListResponse,
  QuestionnaireTemplate,
  QuestionnaireTemplateListResponse,
} from "./types";

function normalizeText(value: string | null | undefined) {
  return value?.trim() || null;
}

function normalizeObject(value: JsonObject | null | undefined): JsonObject {
  return value ?? {};
}

function slugifyOptionValue(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return slug || "opcao";
}

function firstStringValue(value: Record<string, unknown>) {
  return Object.values(value).find(
    (item): item is string => typeof item === "string" && Boolean(item.trim()),
  );
}

function normalizeQuestionnaireFieldOptions(
  options: unknown,
): QuestionnaireFieldOption[] | null {
  const optionItems =
    typeof options === "string"
      ? parseOptionString(options)
      : Array.isArray(options)
        ? options
        : isPlainRecord(options)
          ? Object.values(options)
          : null;
  if (!optionItems) return null;

  const normalized = optionItems
    .map((option, index) => {
      if (typeof option === "string") {
        const label = option.trim();
        return label
          ? { label, value: `${slugifyOptionValue(label)}_${index}` }
          : null;
      }
      if (!option || typeof option !== "object" || Array.isArray(option)) {
        return null;
      }

      const record = option as Record<string, unknown>;
      const label =
        typeof record.label === "string" && record.label.trim()
          ? record.label.trim()
          : typeof record.value === "string" && record.value.trim()
            ? record.value.trim()
            : firstStringValue(record)?.trim();
      if (!label) return null;

      const value =
        typeof record.value === "string" && record.value.trim()
          ? record.value.trim()
          : `${slugifyOptionValue(label)}_${index}`;

      return { label, value };
    })
    .filter((option): option is QuestionnaireFieldOption => Boolean(option));

  return normalized.length > 0 ? normalized : null;
}

function parseOptionString(value: string): unknown[] | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
    if (isPlainRecord(parsed)) return Object.values(parsed);
  } catch {
    return trimmed
      .split(/\n|,/)
      .map((option) => option.trim())
      .filter(Boolean);
  }

  return [trimmed];
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeQuestionnaireField(
  field: BackendQuestionnaireField,
): QuestionnaireField {
  return {
    ...field,
    required: field.required ?? false,
    order: field.order ?? 0,
    placeholder: normalizeText(field.placeholder),
    helpText: normalizeText(field.helpText),
    options: normalizeQuestionnaireFieldOptions(field.options),
    validation: field.validation ?? null,
    settings: normalizeObject(field.settings),
    createdAt: field.createdAt ?? "",
    updatedAt: field.updatedAt ?? "",
  };
}

export function normalizeQuestionnaireTemplate(
  template: BackendQuestionnaireTemplate,
): QuestionnaireTemplate {
  const fields = template.fields ?? [];

  return {
    ...template,
    description: normalizeText(template.description),
    status: template.status ?? "draft",
    version: template.version ?? 1,
    settings: normalizeObject(template.settings),
    fields: fields
      .map(normalizeQuestionnaireField)
      .sort((a, b) => a.order - b.order),
    submissionsCount: template._count?.submissions ?? 0,
    createdAt: template.createdAt ?? "",
    updatedAt: template.updatedAt ?? "",
  };
}

export function normalizeQuestionnaireTemplateList(
  response: BackendQuestionnaireTemplateListResponse,
): QuestionnaireTemplateListResponse {
  const data = response.data ?? [];
  const meta = response.meta ?? {};

  return {
    data: data.map(normalizeQuestionnaireTemplate),
    meta: {
      page: meta.page ?? 1,
      limit: meta.limit ?? data.length,
      total: meta.total ?? data.length,
      totalPages: meta.totalPages ?? 1,
    },
  };
}

function normalizeSubmissionLead(
  lead: BackendQuestionnaireSubmission["lead"],
): QuestionnaireSubmission["lead"] {
  if (!lead?.id) return null;
  return {
    id: lead.id,
    name: lead.name?.trim() || "Lead",
    assignedTo: normalizeText(lead.assignedTo) ?? null,
  };
}

export function normalizeQuestionnaireSubmission(
  submission: BackendQuestionnaireSubmission,
): QuestionnaireSubmission {
  return {
    ...submission,
    template: submission.template ?? null,
    lead: normalizeSubmissionLead(submission.lead),
    mode: submission.mode ?? "INTERNAL",
    origin: submission.origin ?? "INTERNAL",
    status: submission.status ?? "draft",
    answers: normalizeObject(submission.answers),
    metadata: submission.metadata ?? null,
    leadId: normalizeText(submission.leadId),
    customerId: normalizeText(submission.customerId),
    dealId: normalizeText(submission.dealId),
    submittedAt: submission.submittedAt ?? null,
    createdAt: submission.createdAt ?? "",
    updatedAt: submission.updatedAt ?? "",
  };
}

export function normalizeQuestionnaireSubmissionList(
  response: BackendQuestionnaireSubmissionListResponse,
): QuestionnaireSubmissionListResponse {
  const data = response.data ?? [];
  const meta = response.meta ?? {};

  return {
    data: data.map(normalizeQuestionnaireSubmission),
    meta: {
      page: meta.page ?? 1,
      limit: meta.limit ?? data.length,
      total: meta.total ?? data.length,
      totalPages: meta.totalPages ?? 1,
    },
  };
}
