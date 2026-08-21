export const COMMISSION_PRODUCT_TYPES = [
  'AUTO',
  'VIDA',
  'EMPRESARIAL',
  'RESIDENCIAL',
  'VENDA',
  'LOCACAO',
] as const;
export type CommissionProductType = (typeof COMMISSION_PRODUCT_TYPES)[number];

export const COMMISSION_STATUSES = [
  'PENDING',
  'APPROVED',
  'PAID',
  'CANCELLED',
] as const;
export type CommissionStatusName = (typeof COMMISSION_STATUSES)[number];

export const DEFAULT_COMMISSION_RATES: Record<
  'INSURANCE' | 'REAL_ESTATE',
  Partial<Record<CommissionProductType, number>>
> = {
  INSURANCE: {
    AUTO: 15,
    VIDA: 25,
    EMPRESARIAL: 20,
    RESIDENCIAL: 15,
  },
  REAL_ESTATE: {
    VENDA: 3,
    LOCACAO: 100,
  },
};

export function targetScopeKey(params: {
  businessUnitId?: string | null;
  userId?: string | null;
  teamId?: string | null;
}) {
  return [
    params.businessUnitId ?? '',
    params.userId ?? '',
    params.teamId ?? '',
  ].join(':');
}

export function computeCommissionValue(params: {
  dealValue: number;
  percentage: number;
  productType?: string | null;
}) {
  const percent = Number(params.percentage);
  if (!Number.isFinite(percent) || percent < 0) return 0;
  const value = Number(params.dealValue);
  if (!Number.isFinite(value) || value < 0) return 0;
  if (params.productType === 'LOCACAO' || percent >= 100) {
    return Math.round(value * 100) / 100;
  }
  return Math.round(((value * percent) / 100) * 100) / 100;
}

export function defaultCommissionPercent(params: {
  productType?: string | null;
  unitType?: 'INSURANCE' | 'REAL_ESTATE' | null;
}) {
  const type = params.productType?.toUpperCase();
  if (type && type in DEFAULT_COMMISSION_RATES.INSURANCE) {
    const insurance =
      DEFAULT_COMMISSION_RATES.INSURANCE[type as CommissionProductType];
    if (insurance != null && params.unitType !== 'REAL_ESTATE') return insurance;
  }
  if (type && type in DEFAULT_COMMISSION_RATES.REAL_ESTATE) {
    const realEstate =
      DEFAULT_COMMISSION_RATES.REAL_ESTATE[type as CommissionProductType];
    if (realEstate != null) return realEstate;
  }
  if (params.unitType === 'REAL_ESTATE') return 3;
  return 15;
}

export function periodBounds(params: {
  year: number;
  month?: number;
  period?: 'month' | 'quarter' | 'year';
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const year = params.year || now.getUTCFullYear();
  const month = params.month || now.getUTCMonth() + 1;
  const period = params.period ?? 'month';
  if (period === 'year') {
    return {
      from: new Date(Date.UTC(year, 0, 1)),
      to: new Date(Date.UTC(year + 1, 0, 1)),
      month: null as number | null,
      year,
    };
  }
  if (period === 'quarter') {
    const quarterStart = Math.floor((month - 1) / 3) * 3;
    return {
      from: new Date(Date.UTC(year, quarterStart, 1)),
      to: new Date(Date.UTC(year, quarterStart + 3, 1)),
      month: null as number | null,
      year,
    };
  }
  return {
    from: new Date(Date.UTC(year, month - 1, 1)),
    to: new Date(Date.UTC(year, month, 1)),
    month,
    year,
  };
}
