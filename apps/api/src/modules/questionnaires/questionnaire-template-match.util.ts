import { INTEREST_CATEGORIES } from '../../common/constants/interest-categories';

/**
 * Chaves de produto alinhadas ao catálogo `@repo/forms-library`
 * (`INSURANCE_PRODUCTS`: auto, vida, residencial, empresarial).
 * Compra de imóvel não existe nesse catálogo: o template imobiliário
 * precisa declarar a chave explicitamente em `settings`.
 */
const INSURANCE_CATALOG_KEYS = {
  AUTO_INSURANCE: ['auto', 'AUTO_INSURANCE'],
  HOME_INSURANCE: ['residencial', 'HOME_INSURANCE'],
  LIFE_INSURANCE: ['vida', 'LIFE_INSURANCE'],
  HEALTH_INSURANCE: ['HEALTH_INSURANCE'],
} as const;

const REAL_ESTATE_KEYS = {
  PROPERTY_BUY: [
    'property_buy',
    'imobiliario',
    'compra_imovel',
    'PROPERTY_BUY',
  ],
  PROPERTY_RENT: ['property_rent', 'locacao_imovel', 'PROPERTY_RENT'],
  PROPERTY_SELL: ['property_sell', 'venda_imovel', 'PROPERTY_SELL'],
  PROPERTY_INVESTMENT: [
    'property_investment',
    'investimento_imovel',
    'PROPERTY_INVESTMENT',
  ],
} as const;

const INTEREST_PRODUCT_KEYS: Record<string, readonly string[]> = {
  ...INSURANCE_CATALOG_KEYS,
  ...REAL_ESTATE_KEYS,
};

const INSURANCE_INTERESTS = new Set<string>([
  'AUTO_INSURANCE',
  'HOME_INSURANCE',
  'LIFE_INSURANCE',
  'HEALTH_INSURANCE',
]);

const REAL_ESTATE_INTERESTS = new Set<string>([
  'PROPERTY_BUY',
  'PROPERTY_RENT',
  'PROPERTY_SELL',
  'PROPERTY_INVESTMENT',
]);

export type QuestionnaireTemplateMatch = 'unique' | 'ambiguous' | 'none';

export type QuestionnaireTemplateCandidate = {
  id: string;
  settings?: unknown;
  fieldKeys?: readonly string[];
  fields?: readonly { key: string }[];
};

export type QuestionnaireTemplateMatchReason =
  | 'missing_interest'
  | 'no_template';

export type QuestionnaireTemplateMatchResult = {
  match: QuestionnaireTemplateMatch;
  suggestedTemplateId: string | null;
  /** Templates compatíveis. Vazio quando não há correspondência. */
  templateIds: string[];
  reason?: QuestionnaireTemplateMatchReason;
};

const KNOWN_INTERESTS = new Set<string>(INTEREST_CATEGORIES);

export function selectRelevantInterests(
  interests: readonly string[],
  businessUnitType: string | null | undefined,
): string[] {
  const known = [
    ...new Set(interests.filter((interest) => KNOWN_INTERESTS.has(interest))),
  ];
  const insurance = known.filter((interest) =>
    INSURANCE_INTERESTS.has(interest),
  );
  const realEstate = known.filter((interest) =>
    REAL_ESTATE_INTERESTS.has(interest),
  );

  if (businessUnitType === 'INSURANCE') {
    return insurance.length > 0 ? insurance : realEstate;
  }
  if (businessUnitType === 'REAL_ESTATE') {
    return realEstate.length > 0 ? realEstate : insurance;
  }
  return known;
}

export function readTemplateProductKeys(settings: unknown): string[] {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return [];
  }
  const record = settings as Record<string, unknown>;
  const keys: string[] = [];
  for (const field of ['wizardBranch', 'branch', 'catalogProduct'] as const) {
    const value = record[field];
    if (typeof value === 'string' && value.trim()) {
      keys.push(value.trim());
    }
  }
  if (Array.isArray(record.interestCategories)) {
    for (const value of record.interestCategories) {
      if (typeof value === 'string' && value.trim()) keys.push(value.trim());
    }
  }
  return keys;
}

const FIELD_PREFIXES: Record<string, readonly string[]> = {
  AUTO_INSURANCE: ['auto'],
  HOME_INSURANCE: ['residencial'],
  LIFE_INSURANCE: ['vida'],
};

function fieldPrefix(key: string) {
  const dot = key.indexOf('.');
  return dot === -1 ? key : key.slice(0, dot);
}

function templateMatchesInterest(
  template: QuestionnaireTemplateCandidate,
  accepted: Set<string>,
  prefixes: Set<string>,
) {
  if (
    readTemplateProductKeys(template.settings).some((key) => accepted.has(key))
  ) {
    return true;
  }
  return templateMatchesByFields(template, prefixes);
}

const MIN_PRODUCT_FIELDS = 2;

function templateMatchesByFields(
  template: QuestionnaireTemplateCandidate,
  prefixes: Set<string>,
) {
  const keys =
    template.fieldKeys ?? template.fields?.map((field) => field.key) ?? [];
  const hits = keys.filter((key) => prefixes.has(fieldPrefix(key))).length;
  return hits >= MIN_PRODUCT_FIELDS;
}

export function matchQuestionnaireTemplates(input: {
  interests: readonly string[];
  businessUnitType?: string | null;
  templates: readonly QuestionnaireTemplateCandidate[];
}): QuestionnaireTemplateMatchResult {
  const relevant = selectRelevantInterests(
    input.interests,
    input.businessUnitType,
  );
  if (relevant.length === 0) {
    return {
      match: 'none',
      suggestedTemplateId: null,
      templateIds: [],
      reason: 'missing_interest',
    };
  }
  const groups = relevant
    .map((interest) => INTEREST_PRODUCT_KEYS[interest])
    .filter((group): group is readonly string[] => Boolean(group));
  const accepted = new Set(groups.flat());
  const prefixes = new Set(
    relevant.flatMap((interest) => FIELD_PREFIXES[interest] ?? []),
  );
  const matched = input.templates.filter((template) =>
    templateMatchesInterest(template, accepted, prefixes),
  );
  const templateIds = matched.map((template) => template.id);

  if (matched.length === 0 || groups.length === 0) {
    return {
      match: 'none',
      suggestedTemplateId: null,
      templateIds: [],
      reason: 'no_template',
    };
  }

  if (groups.length === 1 && matched.length === 1) {
    return {
      match: 'unique',
      suggestedTemplateId: matched[0]?.id ?? null,
      templateIds,
    };
  }

  return { match: 'ambiguous', suggestedTemplateId: null, templateIds };
}
