import type { Metadata } from "next";
import { Suspense } from "react";

import { PropertyListing } from "@/components/property-listing";
import { SiteHeader } from "@/components/site-header";
import { getPortalHome } from "@/services/catalog";
import type { PropertyListQuery } from "@/types/property";

export function seoMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, locale: "pt_BR", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export async function SeoCatalog({
  title,
  description,
  preset,
}: {
  title: string;
  description: string;
  preset: Partial<PropertyListQuery>;
}) {
  const portal = await getPortalHome();
  return (
    <>
      <SiteHeader config={portal.data.config} />
      <main className="mx-auto w-full max-w-[90rem] px-4 py-4 md:px-8 md:py-8 2xl:max-w-[110rem]">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}>
          <PropertyListing preset={preset} title={title} description={description} />
        </Suspense>
      </main>
    </>
  );
}
