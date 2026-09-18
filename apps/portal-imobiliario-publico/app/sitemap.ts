import type { MetadataRoute } from "next";

import { CatalogUnavailableError } from "@/lib/errors";
import { portalOrigin } from "@/lib/site";
import { apiList } from "@/services/catalog-api";

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
  ];

  try {
    let page = 1;
    const limit = 50;
    for (;;) {
      const result = await apiList({ page, limit });
      for (const property of result.data) {
        entries.push({
          url: `${origin}/imoveis/${property.slug}`,
          lastModified: property.publishedAt
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
