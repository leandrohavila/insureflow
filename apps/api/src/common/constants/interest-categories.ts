export const INTEREST_CATEGORIES = [
  'AUTO_INSURANCE',
  'HOME_INSURANCE',
  'LIFE_INSURANCE',
  'HEALTH_INSURANCE',
  'PROPERTY_BUY',
  'PROPERTY_RENT',
  'PROPERTY_SELL',
  'PROPERTY_INVESTMENT',
] as const;

export type InterestCategory = (typeof INTEREST_CATEGORIES)[number];

export const INTEREST_CATEGORY_LABELS: Record<InterestCategory, string> = {
  AUTO_INSURANCE: 'Seguro Auto',
  HOME_INSURANCE: 'Seguro Residencial',
  LIFE_INSURANCE: 'Seguro de Vida',
  HEALTH_INSURANCE: 'Seguro Saúde',
  PROPERTY_BUY: 'Compra de imóvel',
  PROPERTY_RENT: 'Locação de imóvel',
  PROPERTY_SELL: 'Venda de imóvel',
  PROPERTY_INVESTMENT: 'Investimento imobiliário',
};

export const BUSINESS_UNIT_TYPES = ['INSURANCE', 'REAL_ESTATE'] as const;
export type BusinessUnitType = (typeof BUSINESS_UNIT_TYPES)[number];

export const BUSINESS_UNIT_TYPE_LABELS: Record<BusinessUnitType, string> = {
  INSURANCE: 'Corretora de Seguros',
  REAL_ESTATE: 'Imobiliária',
};

export const MESSAGE_CHANNELS = ['WHATSAPP', 'EMAIL'] as const;
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];

export const REACTIVATION_CHANNELS = ['WHATSAPP', 'EMAIL', 'BOTH'] as const;
export type ReactivationChannel = (typeof REACTIVATION_CHANNELS)[number];

export const CROSS_SELL_STATUSES = [
  'PENDING',
  'CONTACTED',
  'CONVERTED',
  'DISMISSED',
] as const;
export type CrossSellStatus = (typeof CROSS_SELL_STATUSES)[number];

export const FOLLOW_UP_TYPES = ['CALL', 'WHATSAPP', 'EMAIL', 'MEETING'] as const;
export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number];

export const FOLLOW_UP_STATUSES = [
  'PENDING',
  'COMPLETED',
  'CANCELLED',
] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

export const COMMERCIAL_RENEWAL_STATUSES = [
  'ACTIVE',
  'RENEWAL_PENDING',
  'RENEWAL_IN_PROGRESS',
  'RENEWED',
  'LOST',
] as const;
export type CommercialRenewalStatus = (typeof COMMERCIAL_RENEWAL_STATUSES)[number];

export const MESSAGE_TEMPLATE_KINDS = [
  'reactivation',
  'cross_sell',
  'campaign',
  'FOLLOW_UP',
  'REACTIVATION',
  'RENEWAL',
  'CROSS_SELL',
] as const;
export type MessageTemplateKind = (typeof MESSAGE_TEMPLATE_KINDS)[number];

export const COMMUNICATION_PROVIDER_KINDS = [
  'INTERNAL',
  'EVOLUTION',
  'META',
  'ZAPI',
  'TWILIO',
] as const;
export type CommunicationProviderKind =
  (typeof COMMUNICATION_PROVIDER_KINDS)[number];

export const COMMUNICATION_PURPOSES = [
  'REACTIVATION',
  'FOLLOW_UP',
  'RENEWAL',
  'CROSS_SELL',
  'MANUAL',
] as const;
export type CommunicationPurpose = (typeof COMMUNICATION_PURPOSES)[number];

export const COMMUNICATION_STATUSES = [
  'queued',
  'sent',
  'delivered',
  'read',
  'failed',
  'replied',
] as const;
export type CommunicationStatus = (typeof COMMUNICATION_STATUSES)[number];

export const COMMUNICATION_DIRECTIONS = ['OUTBOUND', 'INBOUND'] as const;
export type CommunicationDirection = (typeof COMMUNICATION_DIRECTIONS)[number];

export const COMMUNICATION_PROVIDER_LABELS: Record<
  CommunicationProviderKind,
  string
> = {
  INTERNAL: 'Interno (log only)',
  EVOLUTION: 'Evolution API',
  META: 'Meta Cloud API',
  ZAPI: 'Z-API',
  TWILIO: 'Twilio',
};

export const COMMUNICATION_PURPOSE_LABELS: Record<CommunicationPurpose, string> =
  {
    REACTIVATION: 'Reativação',
    FOLLOW_UP: 'Follow-up',
    RENEWAL: 'Renovação',
    CROSS_SELL: 'Cross-sell',
    MANUAL: 'Manual',
  };

export const COMMUNICATION_STATUS_LABELS: Record<CommunicationStatus, string> =
  {
    queued: 'Na fila',
    sent: 'Enviado',
    delivered: 'Entregue',
    read: 'Lido',
    failed: 'Falhou',
    replied: 'Respondido',
  };

export function isInterestCategory(
  value: string | null | undefined,
): value is InterestCategory {
  return (
    typeof value === 'string' &&
    (INTEREST_CATEGORIES as readonly string[]).includes(value)
  );
}

export function interestCategoryLabel(value: string | null | undefined): string {
  if (isInterestCategory(value)) return INTEREST_CATEGORY_LABELS[value];
  return value?.trim() || 'interesse';
}
