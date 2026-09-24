import {
  apiCreateLead,
  apiFindBySlug,
  apiHighlights,
  apiList,
  apiSearch,
} from "@/services/catalog-api";
import type {
  CatalogResult,
  CreatePropertyLeadInput,
  PropertyLead,
  PropertyListQuery,
  PublicProperty,
} from "@/types/property";

function fromApi<T>(data: T): CatalogResult<T> {
  return { data, source: "api" };
}

export async function listProperties(query: PropertyListQuery = {}) {
  return fromApi(await apiList(query));
}

export async function searchProperties(query: PropertyListQuery = {}) {
  const useSearch = Boolean(query.q?.trim());
  const data = useSearch ? await apiSearch(query) : await apiList(query);
  return fromApi(data);
}

export async function listHighlights(query: PropertyListQuery = {}) {
  return fromApi(await apiHighlights(query));
}

export async function getPropertyBySlug(
  slug: string,
): Promise<CatalogResult<PublicProperty>> {
  return fromApi(await apiFindBySlug(slug));
}

export async function submitPropertyLead(
  input: CreatePropertyLeadInput,
): Promise<CatalogResult<PropertyLead>> {
  return fromApi(await apiCreateLead(input));
}
