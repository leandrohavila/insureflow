export const PROPERTY_PURPOSES = ["SALE", "RENT", "SALE_AND_RENT"] as const;
export type PropertyPurpose = (typeof PROPERTY_PURPOSES)[number];

export const PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
  "LAND",
  "COMMERCIAL",
  "OTHER",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export type PropertyImage = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  isCover: boolean;
};

export type PropertyCoverImage = {
  id: string;
  url: string;
  alt: string | null;
};

export type PropertyFeature = {
  key: string;
  label: string;
  valueType: "BOOLEAN" | "TEXT" | "NUMBER" | string;
  value: boolean | string | number | null;
};

export type PropertyPrimaryOwner = {
  name: string;
  kind: string;
};

export type PublicProperty = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  purpose: PropertyPurpose;
  type: PropertyType;
  city: string;
  neighborhood: string | null;
  address: string | null;
  state: string | null;
  postalCode: string | null;
  price: number;
  areaM2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpots: number | null;
  featured: boolean;
  featuredUntil?: string | null;
  published: boolean;
  publishedAt: string | null;
  images: PropertyImage[];
  coverImage?: PropertyCoverImage | null;
  features?: PropertyFeature[];
  primaryOwner?: PropertyPrimaryOwner | null;
};

export type PropertyListQuery = {
  q?: string;
  city?: string;
  neighborhood?: string;
  purpose?: PropertyPurpose;
  priceMin?: number;
  priceMax?: number;
  page?: number;
  limit?: number;
};

export type PropertyListResult = {
  data: PublicProperty[];
  total: number;
  page: number;
  limit: number;
};

export type HighlightsResult = {
  data: PublicProperty[];
};

export type CreatePropertyLeadInput = {
  propertyId?: string;
  propertySlug?: string;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
};

export type PropertyLead = {
  id: string;
  propertyId: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string;
  createdAt: string;
};

export type CatalogSource = "api" | "mock";

export type CatalogResult<T> = {
  data: T;
  source: CatalogSource;
};
