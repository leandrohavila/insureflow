import type { MetadataRoute } from "next";

import { portalOrigin } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const origin = portalOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
