import type { Prisma } from '@prisma/client';

export const LEAD_LIST_PERIOD_DAYS = [7, 30, 90] as const;

export type LeadListPeriodDays = (typeof LEAD_LIST_PERIOD_DAYS)[number];

export const LEAD_SEARCH_ACCENTS_FROM = 'áàâãäéèêëíìîïóòôõöúùûüçñ';
export const LEAD_SEARCH_ACCENTS_TO = 'aaaaaeeeeiiiiooooouuuucn';

const ACCENT_PATTERN = new RegExp(`[${LEAD_SEARCH_ACCENTS_FROM}]`, 'g');

export function foldLeadSearchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(ACCENT_PATTERN, (char) => {
      const index = LEAD_SEARCH_ACCENTS_FROM.indexOf(char);
      return index >= 0 ? LEAD_SEARCH_ACCENTS_TO[index] : char;
    });
}

export function leadSearchLikePattern(value: string) {
  const folded = foldLeadSearchText(value);
  if (!folded) return null;
  return `%${folded.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export function leadPhoneLikePattern(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 3) return null;
  return `%${digits}%`;
}

export function isLeadListPeriodDays(
  value: number | undefined,
): value is LeadListPeriodDays {
  return (
    value !== undefined &&
    (LEAD_LIST_PERIOD_DAYS as readonly number[]).includes(value)
  );
}

export function buildLeadAttributeWhere(input: {
  status?: string;
  source?: string;
  interestCategory?: string;
  mine?: boolean;
  actorUserId?: string;
  createdWithinDays?: number;
  now?: Date;
}): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};
  const source = input.source?.trim();
  if (input.status) where.status = input.status;
  if (source) {
    where.source = { contains: source, mode: 'insensitive' };
  }
  if (input.interestCategory) {
    where.interestCategories = { has: input.interestCategory };
  }
  if (input.mine && input.actorUserId) {
    where.ownerUserId = input.actorUserId;
  }
  if (isLeadListPeriodDays(input.createdWithinDays)) {
    const now = input.now ?? new Date();
    where.createdAt = {
      gte: new Date(
        now.getTime() - input.createdWithinDays * 24 * 60 * 60 * 1000,
      ),
    };
  }
  return where;
}
