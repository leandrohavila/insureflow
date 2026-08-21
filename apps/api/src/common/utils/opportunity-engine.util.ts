import type { InterestCategory } from '../constants/interest-categories';

export const OPPORTUNITY_TYPES = [
  'AUTO_INSURANCE',
  'LIFE_INSURANCE',
  'HEALTH_INSURANCE',
  'HOME_INSURANCE',
  'PROPERTY_BUY',
  'PROPERTY_SELL',
  'PROPERTY_RENT',
] as const;
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

export const OPPORTUNITY_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'WON',
  'LOST',
  'DISMISSED',
] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const OPPORTUNITY_SCORES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type OpportunityScore = (typeof OPPORTUNITY_SCORES)[number];

export const OPPORTUNITY_SOURCES = [
  'ENGINE',
  'MANUAL',
  'CROSS_SELL',
  'PROPERTY',
  'RENEWAL',
] as const;
export type OpportunitySource = (typeof OPPORTUNITY_SOURCES)[number];

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  AUTO_INSURANCE: 'Seguro Auto',
  LIFE_INSURANCE: 'Seguro de Vida',
  HEALTH_INSURANCE: 'Seguro Saúde',
  HOME_INSURANCE: 'Seguro Residencial',
  PROPERTY_BUY: 'Compra de imóvel',
  PROPERTY_SELL: 'Venda de imóvel',
  PROPERTY_RENT: 'Locação de imóvel',
};

export const OPPORTUNITY_SCORE_LABELS: Record<OpportunityScore, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
};

export type OpportunitySuggestion = {
  type: OpportunityType;
  originType: string;
  score: OpportunityScore;
  source: OpportunitySource;
  reason: string;
};

const RULES: Array<{
  origin: InterestCategory;
  type: OpportunityType;
  score: OpportunityScore;
  source: OpportunitySource;
  reason: string;
}> = [
  {
    origin: 'PROPERTY_BUY',
    type: 'HOME_INSURANCE',
    score: 'HIGH',
    source: 'PROPERTY',
    reason: 'Cliente comprou imóvel → sugerir seguro residencial',
  },
  {
    origin: 'PROPERTY_SELL',
    type: 'HOME_INSURANCE',
    score: 'MEDIUM',
    source: 'PROPERTY',
    reason: 'Cliente vendeu/está vendendo imóvel → proteger o patrimônio',
  },
  {
    origin: 'PROPERTY_RENT',
    type: 'HOME_INSURANCE',
    score: 'HIGH',
    source: 'PROPERTY',
    reason: 'Cliente possui imóvel alugado → sugerir seguro fiança/residencial',
  },
  {
    origin: 'PROPERTY_INVESTMENT',
    type: 'HOME_INSURANCE',
    score: 'MEDIUM',
    source: 'PROPERTY',
    reason: 'Carteira imobiliária sem proteção residencial',
  },
  {
    origin: 'AUTO_INSURANCE',
    type: 'LIFE_INSURANCE',
    score: 'HIGH',
    source: 'CROSS_SELL',
    reason: 'Cliente possui seguro auto → sugerir seguro de vida',
  },
  {
    origin: 'HOME_INSURANCE',
    type: 'LIFE_INSURANCE',
    score: 'MEDIUM',
    source: 'CROSS_SELL',
    reason: 'Cliente possui residencial → sugerir vida',
  },
  {
    origin: 'LIFE_INSURANCE',
    type: 'HEALTH_INSURANCE',
    score: 'MEDIUM',
    source: 'CROSS_SELL',
    reason: 'Cliente possui vida → sugerir saúde',
  },
];

export function suggestOpportunities(
  categories: readonly string[],
): OpportunitySuggestion[] {
  const owned = new Set(categories);
  return RULES.filter(
    (rule) => owned.has(rule.origin) && !owned.has(rule.type),
  ).map((rule) => ({
    type: rule.type,
    originType: rule.origin,
    score: rule.score,
    source: rule.source,
    reason: rule.reason,
  }));
}

export function isOpportunityType(value: string): value is OpportunityType {
  return (OPPORTUNITY_TYPES as readonly string[]).includes(value);
}

export function businessUnitTypeForOpportunity(
  type: OpportunityType,
): 'INSURANCE' | 'REAL_ESTATE' {
  return type.startsWith('PROPERTY_') ? 'REAL_ESTATE' : 'INSURANCE';
}
