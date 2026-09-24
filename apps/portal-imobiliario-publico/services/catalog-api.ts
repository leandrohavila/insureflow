import { getCatalogConfig, publicQueryDefaults } from "@/lib/config";
import { CatalogNotFoundError, CatalogUnavailableError } from "@/lib/errors";
import type {
  CreatePropertyLeadInput,
  HighlightsResult,
  PropertyLead,
  PropertyListQuery,
  PropertyListResult,
  PublicProperty,
} from "@/types/property";

function toSearchParams(
  query: PropertyListQuery & Record<string, string | number | boolean | undefined>,
) {
  const params = new URLSearchParams();
  const defaults = publicQueryDefaults();
  params.set("tenantSlug", defaults.tenantSlug);
  params.set("businessUnitSlug", defaults.businessUnitSlug);

  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === "") continue;
    params.set(key, String(value));
  }
  return params;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiBase } = getCatalogConfig();
  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new CatalogUnavailableError(
      error instanceof Error ? error.message : "Falha ao conectar na API",
    );
  }

  if (response.status === 404) {
    throw new CatalogNotFoundError();
  }
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    if (response.status >= 500) {
      throw new CatalogUnavailableError(body || `HTTP ${response.status}`);
    }
    throw new Error(body || `HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export function apiList(query: PropertyListQuery = {}) {
  return request<PropertyListResult>(
    `/api/v1/public/properties?${toSearchParams(query).toString()}`,
  );
}

export function apiSearch(query: PropertyListQuery = {}) {
  return request<PropertyListResult>(
    `/api/v1/public/properties/search?${toSearchParams(query).toString()}`,
  );
}

export function apiHighlights(query: PropertyListQuery = {}) {
  return request<HighlightsResult>(
    `/api/v1/public/properties/highlights?${toSearchParams(query).toString()}`,
  );
}

export function apiLaunches(query: PropertyListQuery = {}) {
  return request<HighlightsResult>(
    `/api/v1/public/properties/launches?${toSearchParams(query).toString()}`,
  );
}

export function apiFacets() {
  return request<import("@/types/property").CatalogFacets>(
    `/api/v1/public/properties/facets?${toSearchParams({}).toString()}`,
  );
}

export function apiPortal() {
  return request<import("@/types/property").PortalHome>(
    `/api/v1/public/portal?${toSearchParams({}).toString()}`,
  );
}

export function apiFindBySlug(slug: string) {
  const params = toSearchParams({});
  return request<PublicProperty>(
    `/api/v1/public/properties/${encodeURIComponent(slug)}?${params.toString()}`,
  );
}

export function apiCreateLead(input: CreatePropertyLeadInput) {
  const defaults = publicQueryDefaults();
  return request<PropertyLead>("/api/v1/public/leads", {
    method: "POST",
    body: JSON.stringify({
      ...defaults,
      ...input,
    }),
  });
}
