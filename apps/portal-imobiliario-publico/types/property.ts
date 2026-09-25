export const PROPERTY_PURPOSES = ["SALE", "RENT", "SALE_AND_RENT", "SEASONAL"] as const;
export type PropertyPurpose = (typeof PROPERTY_PURPOSES)[number];

export const PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
  "LAND",
  "COMMERCIAL",
  "CONDOMINIUM",
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
  publicCode?: string | null;
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
  isFeatured?: boolean;
  isLaunch?: boolean;
  featuredUntil?: string | null;
  portalOrder?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  updatedAt?: string | null;
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
  purposeMode?: "buy" | "rent";
  type?: PropertyType;
  code?: string;
  isLaunch?: boolean;
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
  source?: string;
  metadata?: Record<string, string>;
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

export type PortalConfig = {
  id: string;
  companyName: string;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroImage: string | null;
  logoUrl: string | null;
  aboutTitle: string | null;
  aboutText: string | null;
  aboutImage: string | null;
  differentials: string[];
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  creci: string | null;
  address: string | null;
};

export type PortalBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  active: boolean;
  order: number;
};

export type PortalHome = {
  config: PortalConfig | null;
  banners: PortalBanner[];
};

export type CatalogFacetNeighborhood = {
  name: string;
  city: string;
  slug: string;
  count: number;
};

export type CatalogFacets = {
  neighborhoods: CatalogFacetNeighborhood[];
  cities: { name: string; count: number }[];
  types: { type: string; count: number }[];
};

export type CatalogSource = "api" | "mock";

export type CatalogResult<T> = {
  data: T;
  source: CatalogSource;
};
