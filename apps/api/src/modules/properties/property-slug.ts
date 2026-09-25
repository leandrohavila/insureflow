import { slugifyTitle } from './properties.util';

const TYPE_SLUG: Record<string, string> = {
  APARTMENT: 'apartamento',
  HOUSE: 'casa',
  LAND: 'terreno',
  COMMERCIAL: 'comercial',
  CONDOMINIUM: 'condominio',
  OTHER: 'imovel',
};

export function buildFriendlyPropertySlug(input: {
  type?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  bedrooms?: number | null;
  publicCode: string;
}) {
  const typeSlug = TYPE_SLUG[input.type ?? ''] ?? 'imovel';
  const bedrooms =
    input.bedrooms != null && input.bedrooms > 0
      ? `${input.bedrooms} quartos`
      : null;
  const codeSuffix = `-cod-${slugifyTitle(input.publicCode, 12)}`;
  const head = slugifyTitle(
    [typeSlug, input.neighborhood, input.city, bedrooms].filter(Boolean).join(' '),
    Math.max(12, 140 - codeSuffix.length),
  );
  return `${head}${codeSuffix}`;
}

export function withUniqueFriendlySuffix(base: string, attempt: number) {
  if (attempt <= 1) return base;
  return base.replace(/-cod-([a-z0-9]+)$/i, `-${attempt}-cod-$1`);
}

export function normalizePropertyCode(value: string) {
  const match = value.trim().match(/^(?:cod-)?(\d{3,8})$/i);
  return match?.[1] ?? null;
}
