/**
 * Ramos do Questionário Inteligente.
 * As seções acompanham os formulários internos de automóvel, residencial
 * e empresarial. A obrigatoriedade fica em cada campo, não na seção.
 */
export const QUESTIONNAIRE_BRANCHES = [
  'auto',
  'residencial',
  'empresarial',
] as const;

export type QuestionnaireBranchId = (typeof QUESTIONNAIRE_BRANCHES)[number];

export type QuestionnaireSectionDefinition = {
  key: string;
  title: string;
  order: number;
  required: false;
};

const AUTO_SECTIONS = [
  ['vehicle_identification', 'Dados do veículo'],
  ['driver', 'Condutor'],
  ['usage', 'Utilização'],
  ['garage', 'Garagem e pernoite'],
  ['insurance_history', 'Histórico'],
  ['coverages', 'Coberturas'],
] as const;

const RESIDENTIAL_SECTIONS = [
  ['property_identification', 'Dados do imóvel'],
  ['risk_location', 'Endereço do risco'],
  ['estimated_values', 'Valores'],
  ['existing_protections', 'Proteção'],
  ['claims_history', 'Histórico'],
  ['coverages', 'Coberturas'],
] as const;

const BUSINESS_SECTIONS = [
  ['company_identification', 'Empresa'],
  ['establishment', 'Estabelecimento'],
  ['operation', 'Operação'],
  ['assets', 'Bens e valores'],
  ['protection_history', 'Proteção e histórico'],
  ['coverages', 'Coberturas'],
] as const;

function sections(
  source: readonly (readonly [string, string])[],
): QuestionnaireSectionDefinition[] {
  return source.map(([key, title], order) => ({
    key,
    title,
    order,
    required: false,
  }));
}

export const QUESTIONNAIRE_BRANCH_SECTIONS: Record<
  QuestionnaireBranchId,
  QuestionnaireSectionDefinition[]
> = {
  auto: sections(AUTO_SECTIONS),
  residencial: sections(RESIDENTIAL_SECTIONS),
  empresarial: sections(BUSINESS_SECTIONS),
};

export function isQuestionnaireBranch(
  value: unknown,
): value is QuestionnaireBranchId {
  return (
    typeof value === 'string' &&
    (QUESTIONNAIRE_BRANCHES as readonly string[]).includes(value)
  );
}

export function readQuestionnaireBranch(input: {
  branch?: string | null;
  settings?: unknown;
}): QuestionnaireBranchId | null {
  const record =
    input.settings &&
    typeof input.settings === 'object' &&
    !Array.isArray(input.settings)
      ? (input.settings as Record<string, unknown>)
      : null;
  const candidates = [input.branch, record?.branch, record?.wizardBranch];
  for (const candidate of candidates) {
    if (isQuestionnaireBranch(candidate)) return candidate;
  }
  return null;
}
