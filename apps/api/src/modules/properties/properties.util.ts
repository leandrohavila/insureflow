export const PROPERTY_DETAIL_INCLUDE = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  owners: {
    include: { person: true },
    orderBy: [{ isPrimary: 'desc' as const }, { createdAt: 'asc' as const }],
  },
  features: {
    include: { definition: true },
    orderBy: { definition: { sortOrder: 'asc' as const } },
  },
};

/** @deprecated use PROPERTY_DETAIL_INCLUDE */
export const PROPERTY_IMAGE_INCLUDE = PROPERTY_DETAIL_INCLUDE;

export const PROPERTY_PURPOSES = ['SALE', 'RENT', 'SALE_AND_RENT'] as const;
export type PropertyPurpose = (typeof PROPERTY_PURPOSES)[number];

export const PROPERTY_TYPES = [
  'APARTMENT',
  'HOUSE',
  'LAND',
  'COMMERCIAL',
  'OTHER',
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_STATUSES = [
  'DRAFT',
  'AVAILABLE',
  'RESERVED',
  'SOLD',
  'RENTED',
  'INACTIVE',
] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const PERSON_KINDS = ['INDIVIDUAL', 'COMPANY'] as const;
export type PersonKind = (typeof PERSON_KINDS)[number];

export const FEATURE_VALUE_TYPES = ['BOOLEAN', 'TEXT', 'NUMBER'] as const;
export type FeatureValueType = (typeof FEATURE_VALUE_TYPES)[number];

export function decimalToNumber(
  value: { toNumber?: () => number } | number | null | undefined,
) {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  return typeof value.toNumber === 'function' ? value.toNumber() : Number(value);
}

type ImageRow = {
  id: string;
  url: string;
  alt?: string | null;
  sortOrder?: number;
  isCover?: boolean;
};

type FeatureRow = {
  valueBoolean?: boolean | null;
  valueText?: string | null;
  valueNumber?: { toNumber?: () => number } | number | null;
  definition?: {
    key: string;
    label: string;
    valueType: string;
  };
};

type OwnerRow = {
  id?: string;
  isPrimary?: boolean;
  publicVisible?: boolean;
  sharePercent?: { toNumber?: () => number } | number | null;
  person?: {
    id?: string;
    name: string;
    kind: string;
    document?: string | null;
    email?: string | null;
    phone?: string | null;
  };
};

export function pickCoverImage(images: ImageRow[] | undefined) {
  if (!images?.length) return null;
  const cover = images.find((image) => image.isCover) ?? images[0];
  return {
    id: cover.id,
    url: cover.url,
    alt: cover.alt ?? null,
  };
}

export function serializeFeatureValue(row: FeatureRow) {
  const definition = row.definition;
  if (!definition) return null;
  let value: boolean | string | number | null = null;
  if (definition.valueType === 'BOOLEAN') value = row.valueBoolean ?? null;
  if (definition.valueType === 'TEXT') value = row.valueText ?? null;
  if (definition.valueType === 'NUMBER') {
    value = decimalToNumber(row.valueNumber ?? null);
  }
  return {
    key: definition.key,
    label: definition.label,
    valueType: definition.valueType,
    value,
  };
}

export function serializeProperty<
  T extends {
    price: { toNumber?: () => number } | number;
    areaM2?: { toNumber?: () => number } | number | null;
    images?: ImageRow[];
    features?: FeatureRow[];
    owners?: OwnerRow[];
  },
>(row: T) {
  return {
    ...row,
    price: decimalToNumber(row.price) ?? 0,
    areaM2: decimalToNumber(row.areaM2 ?? null),
    coverImage: pickCoverImage(row.images),
    features: (row.features ?? [])
      .map((item) => serializeFeatureValue(item))
      .filter((item): item is NonNullable<typeof item> => item != null),
    owners: (row.owners ?? []).map((owner) => ({
      ...owner,
      sharePercent: decimalToNumber(owner.sharePercent ?? null),
    })),
  };
}

export function serializePublicProperty<
  T extends {
    price: { toNumber?: () => number } | number;
    areaM2?: { toNumber?: () => number } | number | null;
    images?: ImageRow[];
    features?: FeatureRow[];
    owners?: OwnerRow[];
  },
>(row: T) {
  const serialized = serializeProperty(row);
  const { owners: _owners, ...safe } = serialized as typeof serialized & {
    owners?: unknown;
  };
  const primary = (row.owners ?? []).find(
    (owner) => owner.isPrimary && owner.publicVisible && owner.person,
  );
  return {
    ...safe,
    primaryOwner: primary?.person
      ? { name: primary.person.name, kind: primary.person.kind }
      : null,
  };
}

export function slugifyTitle(title: string) {
  return (
    title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'imovel'
  );
}

export function slugifyKey(value: string) {
  return slugifyTitle(value).replace(/-/g, '_').slice(0, 40) || 'feature';
}
