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
    publicCode: "9012",
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
    publicCode: "3456",
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
    publicCode: "7890",
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
  {
    id: "mock-apto-uberaba",
    slug: "apartamento-centro-uberaba-2-quartos-cod-1234",
    publicCode: "1234",
    title: "Apartamento no Centro de Uberaba",
    description: "Apartamento de 2 quartos no Centro de Uberaba, perto do comércio.",
    purpose: "SALE",
    type: "APARTMENT",
    city: "Uberaba",
    neighborhood: "Centro",
    address: "Rua Artur Machado, 100",
    state: "MG",
    postalCode: "38010-000",
    price: 390000,
    areaM2: 72,
    bedrooms: 2,
    bathrooms: 2,
    parkingSpots: 1,
    featured: true,
    published: true,
    publishedAt: now,
    images: [],
  },
  {
    id: "mock-casa-fabricio",
    slug: "casa-fabricio-uberaba-cod-5678",
    publicCode: "5678",
    title: "Casa no Fabrício em Uberaba",
    description: "Casa para locação no bairro Fabrício, Uberaba.",
    purpose: "RENT",
    type: "HOUSE",
    city: "Uberaba",
    neighborhood: "Fabrício",
    address: null,
    state: "MG",
    postalCode: null,
    price: 2800,
    areaM2: 160,
    bedrooms: 3,
    bathrooms: 2,
    parkingSpots: 2,
    featured: true,
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
  if (query.purposeMode === "buy" && property.purpose !== "SALE" && property.purpose !== "SALE_AND_RENT") {
    return false;
  }
  if (query.purposeMode === "rent" && property.purpose !== "RENT" && property.purpose !== "SALE_AND_RENT") {
    return false;
  }
  if (!query.purposeMode && query.purpose && property.purpose !== query.purpose) return false;
  if (query.type && property.type !== query.type) return false;
  if (query.isLaunch && !property.isLaunch) return false;
  if (query.code) {
    const code = query.code.trim().toLowerCase();
    const digits = code.match(/^(?:cod-)?(\d{3,8})$/i)?.[1];
    const byCode =
      property.slug.toLowerCase() === code ||
      property.id === query.code.trim() ||
      (digits != null &&
        (property.publicCode === digits || property.slug.toLowerCase().endsWith(`-cod-${digits}`)));
    if (!byCode) return false;
  }
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

export function mockFindByCode(raw: string): PublicProperty | null {
  const digits = raw.trim().match(/^(?:cod-)?(\d{3,8})$/i)?.[1];
  if (!digits) return null;
  return (
    MOCK_PROPERTIES.find(
      (item) => item.publicCode === digits || item.slug.endsWith(`-cod-${digits}`),
    ) ?? null
  );
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
