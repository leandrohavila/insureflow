import { getCatalogConfig } from "@/lib/config";
import {
  CatalogNotFoundError,
  isCatalogUnavailable,
} from "@/lib/errors";
import {
  apiCreateLead,
  apiFindBySlug,
  apiHighlights,
  apiList,
  apiSearch,
} from "@/services/catalog-api";
import {
  mockCreateLead,
  mockFindBySlug,
  mockHighlights,
  mockList,
  mockSearch,
} from "@/services/catalog-mock";
import type {
  CatalogResult,
  CreatePropertyLeadInput,
  HighlightsResult,
  PropertyLead,
  PropertyListQuery,
  PropertyListResult,
  PublicProperty,
} from "@/types/property";

async function withFallback<T>(
  apiFn: () => Promise<T>,
  mockFn: () => T | Promise<T>,
): Promise<CatalogResult<T>> {
  if (getCatalogConfig().forceMock) {
    return { data: await mockFn(), source: "mock" };
  }
  try {
    return { data: await apiFn(), source: "api" };
  } catch (error) {
    if (error instanceof CatalogNotFoundError) throw error;
    if (isCatalogUnavailable(error)) {
      return { data: await mockFn(), source: "mock" };
    }
    throw error;
  }
}

export function listProperties(query: PropertyListQuery = {}) {
  return withFallback(() => apiList(query), () => mockList(query));
}

export function searchProperties(query: PropertyListQuery = {}) {
  const useSearch = Boolean(query.q?.trim());
  return withFallback(
    () => (useSearch ? apiSearch(query) : apiList(query)),
    () => (useSearch ? mockSearch(query) : mockList(query)),
  );
}

export function listHighlights(query: PropertyListQuery = {}) {
  return withFallback(() => apiHighlights(query), () => mockHighlights());
}

export async function getPropertyBySlug(
  slug: string,
): Promise<CatalogResult<PublicProperty>> {
  const result = await withFallback(
    () => apiFindBySlug(slug),
    () => {
      const row = mockFindBySlug(slug);
      if (!row) throw new CatalogNotFoundError();
      return row;
    },
  );
  return result;
}

export async function submitPropertyLead(
  input: CreatePropertyLeadInput,
): Promise<CatalogResult<PropertyLead>> {
  return withFallback(
    () => apiCreateLead(input),
    () => {
      const slug = input.propertySlug ?? "";
      const property =
        mockFindBySlug(slug) ??
        (input.propertyId
          ? mockList({}).data.find((item) => item.id === input.propertyId)
          : undefined);
      if (!property) throw new CatalogNotFoundError();
      return mockCreateLead(input, property);
    },
  );
}
