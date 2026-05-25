export const QUESTIONNAIRE_TEMPLATE_STATUSES = [
  "draft",
  "active",
  "archived",
] as const;

export const QUESTIONNAIRE_FIELD_TYPES = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "DATE",
  "BOOLEAN",
  "SELECT",
  "MULTI_SELECT",
  "EMAIL",
  "PHONE",
  "CURRENCY",
  "FILE",
] as const;

export const QUESTIONNAIRE_ORIGINS = [
  "WHATSAPP",
  "INSTAGRAM",
  "SITE",
  "INTERNAL",
  "PHONE",
  "INDICATION",
] as const;

export const QUESTIONNAIRE_SUBMISSION_MODES = ["INTERNAL", "EXTERNAL"] as const;

export const QUESTIONNAIRE_SUBMISSION_STATUSES = [
  "draft",
  "submitted",
  "reviewed",
  "archived",
] as const;

export type QuestionnaireTemplateStatus =
  (typeof QUESTIONNAIRE_TEMPLATE_STATUSES)[number];
export type QuestionnaireFieldType = (typeof QUESTIONNAIRE_FIELD_TYPES)[number];
export type QuestionnaireOrigin = (typeof QUESTIONNAIRE_ORIGINS)[number];
export type QuestionnaireSubmissionMode =
  (typeof QUESTIONNAIRE_SUBMISSION_MODES)[number];
export type QuestionnaireSubmissionStatus =
  (typeof QUESTIONNAIRE_SUBMISSION_STATUSES)[number];

export type JsonObject = Record<string, unknown>;

export type QuestionnaireFieldOption = {
  label: string;
  value: string;
};

export type QuestionnaireField = {
  id: string;
  tenantId: string;
  templateId: string;
  key: string;
  label: string;
  type: QuestionnaireFieldType;
  required: boolean;
  order: number;
  placeholder?: string | null;
  helpText?: string | null;
  options?: QuestionnaireFieldOption[] | null;
  validation?: JsonObject | null;
  settings: JsonObject;
  createdAt: string;
  updatedAt: string;
};

export type QuestionnaireTemplate = {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  status: QuestionnaireTemplateStatus;
  version: number;
  settings: JsonObject;
  fields: QuestionnaireField[];
  submissionsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type QuestionnaireTemplateListFilters = {
  search?: string;
  status?: QuestionnaireTemplateStatus | "all";
  page?: number;
  limit?: number;
};

export type QuestionnaireListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type QuestionnaireTemplateListResponse = {
  data: QuestionnaireTemplate[];
  meta: QuestionnaireListMeta;
};

export type CreateQuestionnaireTemplateInput = {
  name: string;
  description?: string;
  status?: QuestionnaireTemplateStatus;
  version?: number;
  settings?: JsonObject;
};

export type UpdateQuestionnaireTemplateInput =
  Partial<CreateQuestionnaireTemplateInput>;

export type CreateQuestionnaireFieldInput = {
  key: string;
  label: string;
  type: QuestionnaireFieldType;
  required?: boolean;
  order?: number;
  placeholder?: string;
  helpText?: string;
  options?: QuestionnaireFieldOption[];
  validation?: JsonObject;
  settings?: JsonObject;
};

export type UpdateQuestionnaireFieldInput =
  Partial<CreateQuestionnaireFieldInput>;

export type QuestionnaireSubmissionTemplateSummary = {
  id: string;
  name: string;
  version: number;
  status: QuestionnaireTemplateStatus;
};

export type QuestionnaireSubmissionLeadSummary = {
  id: string;
  name: string;
  assignedTo?: string | null;
};

export type QuestionnaireSubmission = {
  id: string;
  tenantId: string;
  templateId: string;
  template?: QuestionnaireSubmissionTemplateSummary | null;
  lead?: QuestionnaireSubmissionLeadSummary | null;
  mode: QuestionnaireSubmissionMode;
  origin: QuestionnaireOrigin;
  status: QuestionnaireSubmissionStatus;
  answers: JsonObject;
  metadata?: JsonObject | null;
  leadId?: string | null;
  customerId?: string | null;
  dealId?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QuestionnaireSubmissionListFilters = {
  templateId?: string;
  status?: QuestionnaireSubmissionStatus | "all";
  origin?: QuestionnaireOrigin | "all";
  mode?: QuestionnaireSubmissionMode | "all";
  leadId?: string;
  customerId?: string;
  dealId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type QuestionnaireSubmissionListResponse = {
  data: QuestionnaireSubmission[];
  meta: QuestionnaireListMeta;
};

export type CreateQuestionnaireSubmissionInput = {
  templateId: string;
  mode?: QuestionnaireSubmissionMode;
  origin?: QuestionnaireOrigin;
  status?: QuestionnaireSubmissionStatus;
  answers?: JsonObject;
  metadata?: JsonObject;
  leadId?: string;
  customerId?: string;
  dealId?: string;
  submittedAt?: string;
};

export type UpdateQuestionnaireSubmissionInput =
  Partial<CreateQuestionnaireSubmissionInput>;

export type BackendQuestionnaireField = Omit<
  QuestionnaireField,
  "required" | "order" | "options" | "settings"
> & {
  required?: boolean | null;
  order?: number | null;
  options?: unknown;
  settings?: JsonObject | null;
};

export type BackendQuestionnaireTemplate = Omit<
  QuestionnaireTemplate,
  "fields" | "submissionsCount" | "settings"
> & {
  fields?: BackendQuestionnaireField[] | null;
  settings?: JsonObject | null;
  _count?: { submissions?: number | null } | null;
};

export type BackendQuestionnaireTemplateListResponse = {
  data?: BackendQuestionnaireTemplate[] | null;
  meta?: Partial<QuestionnaireListMeta> | null;
};

export type BackendQuestionnaireSubmission = Omit<
  QuestionnaireSubmission,
  "answers" | "template" | "lead"
> & {
  answers?: JsonObject | null;
  template?: QuestionnaireSubmissionTemplateSummary | null;
  lead?: QuestionnaireSubmissionLeadSummary | null;
};

export type BackendQuestionnaireSubmissionListResponse = {
  data?: BackendQuestionnaireSubmission[] | null;
  meta?: Partial<QuestionnaireListMeta> | null;
};
