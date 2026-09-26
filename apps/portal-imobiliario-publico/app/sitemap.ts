import type { MetadataRoute } from "next";

import { CATEGORY_LINKS } from "@/lib/commercial";
import { getCatalogConfig } from "@/lib/config";
import { CatalogUnavailableError } from "@/lib/errors";
import { portalOrigin } from "@/lib/site";
import { UBERABA_LANDINGS, UBERABA_NEIGHBORHOODS } from "@/lib/uberaba";
import { listProperties } from "@/services/catalog";
import { apiFacets, apiList } from "@/services/catalog-api";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = portalOrigin();
  const entries: MetadataRoute.Sitemap = [
    { url: origin, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    {
      url: `${origin}/imoveis`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    { url: `${origin}/comprar`, changeFrequency: "daily", priority: 0.8 },
    { url: `${origin}/alugar`, changeFrequency: "daily", priority: 0.8 },
    { url: `${origin}/imoveis/uberaba`, changeFrequency: "daily", priority: 0.8 },
  ];

  for (const slug of Object.keys(UBERABA_NEIGHBORHOODS)) {
    entries.push({
      url: `${origin}/imoveis/uberaba/${slug}`,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  for (const landing of UBERABA_LANDINGS) {
    entries.push({
      url: `${origin}${landing.path}`,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  for (const category of CATEGORY_LINKS) {
    entries.push({
      url: `${origin}/imoveis/tipos/${category.slug}`,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  try {
    const facets = await apiFacets();
    for (const neighborhood of facets.neighborhoods) {
      entries.push({
        url: `${origin}/imoveis/bairros/${neighborhood.slug}`,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
  } catch (error) {
    if (!(error instanceof CatalogUnavailableError)) {
      /* sitemap segue com as rotas estruturais */
    }
  }

  try {
    let page = 1;
    const limit = 50;
    for (;;) {
      const result = getCatalogConfig().forceMock
        ? (await listProperties({ page, limit })).data
        : await apiList({ page, limit });
      for (const property of result.data) {
        entries.push({
          url: `${origin}/imoveis/${property.slug}`,
          lastModified: property.updatedAt
            ? new Date(property.updatedAt)
            : property.publishedAt
              ? new Date(property.publishedAt)
              : new Date(),
          changeFrequency: "weekly",
          priority: property.featured ? 0.8 : 0.6,
        });
      }
      if (result.data.length < limit || entries.length > 5000) break;
      page += 1;
    }
  } catch (error) {
    if (!(error instanceof CatalogUnavailableError)) {
      /* sitemap ainda publica home + listagem */
    }
  }

  return entries;
}
