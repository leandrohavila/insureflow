import type {
  CreatePropertyLeadInput,
  HighlightsResult,
  PropertyLead,
  PropertyListQuery,
  PropertyListResult,
  PublicProperty,
} from "@/types/property";

const now = "2026-08-24T12:00:00.000Z";

export const MOCK_PROPERTIES: PublicProperty[] = [
  {
    id: "mock-apto-centro",
    slug: "apto-2-quartos-centro",
    title: "Apartamento 2 quartos no Centro",
    description:
      "Apartamento reformado próximo à Praça da República. Mock temporário para validar o portal sem a API.",
    purpose: "SALE",
    type: "APARTMENT",
    city: "Cuiabá",
    neighborhood: "Centro",
    address: "Rua da Paz, 120",
    state: "MT",
    postalCode: "78005-000",
    price: 420000,
    areaM2: 68,
    bedrooms: 2,
    bathrooms: 2,
    parkingSpots: 1,
    featured: true,
    published: true,
    publishedAt: now,
    images: [],
  },
  {
    id: "mock-casa-jardim",
    slug: "casa-condominio-jardim",
    title: "Casa em condomínio no Jardim das Américas",
    description: "Casa térrea com quintal e área gourmet. Destaque do catálogo mock.",
    purpose: "SALE",
    type: "HOUSE",
    city: "Cuiabá",
    neighborhood: "Jardim das Américas",
    address: "Rua das Palmeiras, 80",
    state: "MT",
    postalCode: "78060-000",
    price: 780000,
    areaM2: 180,
    bedrooms: 3,
    bathrooms: 3,
    parkingSpots: 2,
    featured: true,
    published: true,
    publishedAt: now,
    images: [],
  },
  {
    id: "mock-aluguel-cpa",
    slug: "cobertura-aluguel-cpa",
    title: "Cobertura para aluguel no CPA",
    description: "Cobertura mobiliada, aceita contrato anual.",
    purpose: "RENT",
    type: "APARTMENT",
    city: "Cuiabá",
    neighborhood: "CPA",
    address: null,
    state: "MT",
    postalCode: null,
    price: 3200,
    areaM2: 140,
    bedrooms: 3,
    bathrooms: 2,
    parkingSpots: 2,
    featured: false,
    published: true,
    publishedAt: now,
    images: [],
  },
];

function matches(property: PublicProperty, query: PropertyListQuery) {
  if (query.city && property.city.toLowerCase() !== query.city.trim().toLowerCase()) {
    return false;
  }
  if (
    query.neighborhood &&
    (property.neighborhood ?? "").toLowerCase() !== query.neighborhood.trim().toLowerCase()
  ) {
    return false;
  }
  if (query.purpose && property.purpose !== query.purpose) return false;
  if (query.priceMin != null && property.price < query.priceMin) return false;
  if (query.priceMax != null && property.price > query.priceMax) return false;

  const term = query.q?.trim().toLowerCase();
  if (term) {
    const haystack = [
      property.title,
      property.description ?? "",
      property.city,
      property.neighborhood ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(term)) return false;
  }
  return true;
}

export function mockList(query: PropertyListQuery = {}): PropertyListResult {
  const page = query.page ?? 1;
  const limit = query.limit ?? 12;
  const filtered = MOCK_PROPERTIES.filter((item) => matches(item, query));
  const start = (page - 1) * limit;
  return {
    data: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    limit,
  };
}

export function mockHighlights(): HighlightsResult {
  return { data: MOCK_PROPERTIES.filter((item) => item.featured) };
}

export function mockSearch(query: PropertyListQuery): PropertyListResult {
  return mockList(query);
}

export function mockFindBySlug(slug: string): PublicProperty | null {
  return MOCK_PROPERTIES.find((item) => item.slug === slug) ?? null;
}

export function mockCreateLead(
  input: CreatePropertyLeadInput,
  property: PublicProperty,
): PropertyLead {
  return {
    id: `mock-lead-${Date.now()}`,
    propertyId: property.id,
    name: input.name,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    message: input.message?.trim() || null,
    source: "public_portal_mock",
    createdAt: new Date().toISOString(),
  };
}
